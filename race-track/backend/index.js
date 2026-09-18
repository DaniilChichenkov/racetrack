const { Server } = require("socket.io");
require("dotenv").config();

// Sqlite database for data-persistance
const Database = require("better-sqlite3");
const db = new Database("database.db");
db.pragma("foreign_keys = ON");

const TIMER_DURATION = 10 * 60 * 1000;
function getRemainingMs(startedAt) {
  const elapsed = Date.now() - startedAt;
  return Math.max(TIMER_DURATION - elapsed, 0);
}

// Map will contain session-id : 10 minutes timeout
const raceControlTimes = new Map();

// Map will hold data if car passed finish line first time
// (When starting a race)
const isCarPassedLineFirstTime = new Map();

// Dedicated endpoints
// Public
const io = new Server({
  cors: {
    origin: "http://localhost:5173",
  },
});

// Employee endpoints
const frontDeskIo = io.of("/front-desk");
const raceControlIo = io.of("/race-control");
const lapLineObserverIo = io.of("/lap-line-observer");

// Create tables
const createTables = require("./utils/db/migrate/createTables.js");
createTables(db);

// Session modules
const createSession = require("./utils/db/session/createSession.js");
const assignCurrentSession = require("./utils/db/session/assignCurrentSession.js");
const getNonFinishedSessions = require("./utils/db/session/getNonFinishedSessions.js");
const getSessionById = require("./utils/db/session/getSessionById.js");
const getCurrentSession = require("./utils/db/session/getCurrentSession.js");
const getSessionsInQueue = require("./utils/db/session/getSessionsInQueue.js");
const startSession = require("./utils/db/session/startSession.js");
const finishSession = require("./utils/db/session/finishSession.js");
const getFirstSessionInQueue = require("./utils/db/session/getFirstSessionInQueue.js");
const deleteSessionById = require("./utils/db/session/deleteSessionById.js");
const getActiveSession = require("./utils/db/session/getActiveSession.js");
const getActiveOrFinishedSession = require("./utils/db/session/getActiveOrFinishedSession.js");
const changeSessionStatusById = require("./utils/db/session/changeSessionStatusById.js");

// Drivers modules
const assignDriversToSession = require("./utils/db/drivers/assignDriversToSession.js");
const getDriversOfSession = require("./utils/db/drivers/getDriversOfSession.js");
const deleteDriversOfSessionById = require("./utils/db/drivers/deleteDriversOfSessionById.js");
const getDriverByCarNumber = require("./utils/db/drivers/getDriverByCarNumber.js");

// Mode modules
const setRaceModeStatus = require("./utils/db/mode/setRaceModeStatus.js");
const getRaceMode = require("./utils/db/mode/getRaceMode.js");

// Lap Line Record Modules
const recordLineCross = require("./utils/db/lap-line/recordLineCross.js");
const getLineCrossRecordsBySessionId = require("./utils/db/lap-line/getLineCrossRecordsBySessionId.js");
const getLineCrossRecordByDriverNameAndSessionId = require("./utils/db/lap-line/getLineCrossRecordByDriverNameAndSessionId.js");
const updateLineCrossRecord = require("./utils/db/lap-line/updateLineCrossRecord.js");

// Best Lap time record modules
const recordBestLapTimePerCar = require("./utils/db/best-lap-time-for-each-car/recordBestLapTimePerCar.js");
const updateBestLapTimePerCar = require(
  `./utils/db/best-lap-time-for-each-car/updateBestLapTimePerCar.js`,
);
const getBestLapTimesForCarBySessionId = require("./utils/db/best-lap-time-for-each-car/getBestLapTimesForCarBySessionId.js");

// Laps count
const createLapsCountRecord = require("./utils/db/laps-count/createLapsCountRecord.js");
const incLapsCount = require("./utils/db/laps-count/incLapsCount.js");
const getLapsCount = require("./utils/db/laps-count/getLapsCount.js");

// Get active session after restart
const sessionInProgress = getActiveSession(db);
if (sessionInProgress) {
  // Check time remaining
  const remaining = getRemainingMs(sessionInProgress.started_at);

  // If session expired
  if (!remaining) {
    const transaction = db.transaction(() => {
      // Change session status to finished
      changeSessionStatusById(db, "finished", sessionInProgress.id);

      // Change race mode
      setRaceModeStatus(db, "finish");

      io.emit("race-session:list-update");
      io.emit("race-session:race-control-list-update");
    });
    transaction();
  } else {
    // If unexpired session was found -> Add timeout to map
    const timeout = setTimeout(() => {
      const transaction = db.transaction(() => {
        // Set status of session as finished
        finishSession(db, sessionInProgress.id);

        // Change racing mode
        setRaceModeStatus(db, "finish");
      });

      transaction();

      const flag = getRaceMode(db);

      io.emit("session-end", sessionInProgress.id);
      io.emit("race-flags:status-update", flag);
      io.emit("race-ended");
    }, remaining);
    raceControlTimes.set(sessionInProgress.id, timeout);
  }
}

// Default public events handler
io.on("connection", (socket) => {
  // Get all sessions
  socket.on("race-sessions:list", (callback) => {
    try {
      const allSessions = getNonFinishedSessions(db);

      callback({ success: true, sessions: allSessions });
    } catch (error) {
      callback({ success: false });
    }
  });

  // Get session by id
  socket.on("race-session:get-by-id", (data, callback) => {
    try {
      const sessionInfo = getSessionById(db, data);

      let sessionDrivers;
      if (sessionInfo?.id) {
        sessionDrivers = getDriversOfSession(db, sessionInfo.id);
      }

      callback({
        success: true,
        sessionInfo,
        drivers: sessionDrivers,
      });
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });

  // Edit hearthbeat
  socket.on("race-session:edit-hearthbeat", (data) => {
    try {
      db.prepare(
        `
        UPDATE sessions SET editing_last_seen = ?, status = ? WHERE id = ?
      `,
      ).run(Date.now(), "editing", data);

      io.emit("race-session:list-update");
      io.emit("race-control:session-by-id:status-change", data);
    } catch (error) {
      console.log(error);
    }
  });

  // Get status of session by id
  socket.on("race-control:session-by-id-status", (data, callback) => {
    try {
      const sessionInfo = getSessionById(db, data);
      callback({ success: true, status: sessionInfo.status });
    } catch (error) {
      callback({ success: false });
    }
  });

  // Get sessions for race-control (Safety official)
  // Requires separate getter because this one will get current session / session about to start
  // And subsequent sessions, but only current will be available to start
  socket.on("race-sessions:race-control-sessions-list", (callback) => {
    try {
      const currentSession = getCurrentSession(db);
      const sessionsInQueue = getSessionsInQueue(db);

      callback({
        success: true,
        currentSession,
        sessionsInQueue,
      });
    } catch (error) {
      console.log(error);
      callback({
        success: false,
      });
    }
  });

  // Get race status
  socket.on("race-flags:get-status", (callback) => {
    try {
      const flag = getRaceMode(db);

      callback({ success: true, flag });
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });

  // Get next race data
  socket.on("next-race:get-data", (callback) => {
    try {
      const nextRace = getFirstSessionInQueue(db);

      if (nextRace && nextRace.id) {
        const raceDrivers = getDriversOfSession(db, nextRace.id);

        callback({
          success: true,
          data: {
            ...nextRace,
            drivers: raceDrivers,
          },
        });
      } else {
        callback({ success: false });
      }
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });

  // Get timer of an active race
  socket.on("race-countdown:get-active-race-time", (callback) => {
    try {
      const activeRace = getActiveSession(db);

      if (activeRace) {
        callback({
          success: true,
          startedAt: activeRace.started_at,
        });
      } else {
        callback({
          success: false,
        });
      }
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });

  // Get session for leader board
  socket.on("leader-board:get-session", (callback) => {
    try {
      const session = db
        .prepare(
          `
        SELECT * FROM sessions
        WHERE status IN (?, ?)
      `,
        )
        .get("active", "finished");

      // If session with status 'active' or 'finished' was found
      if (session) {
        const sessionDrivers = getDriversOfSession(db, session.id);
        const sessionLapLineCrossings = getLineCrossRecordsBySessionId(
          db,
          session.id,
        );

        callback({
          success: true,
          ...session,
          drivers: sessionDrivers,
          lineCrossings: sessionLapLineCrossings,
        });
      } else {
        // If no session was found -> Try to just get first one in queue
        const session = getFirstSessionInQueue(db);

        // If any session was found at all
        if (session) {
          const sessionDrivers = getDriversOfSession(session.id);

          callback({ success: true, ...session, drivers: sessionDrivers });
        } else {
          // If no session at all was found
          callback({ success: false });
        }
      }
    } catch (error) {
      callback({ success: false });
    }
  });

  // Get list of drivers for current / finished session
  socket.on("leader-board:get-crossings-list", (callback) => {
    try {
      const activeOrFinishedSession = getActiveOrFinishedSession(db);

      if (activeOrFinishedSession) {
        const sessionLineCrossings = getLineCrossRecordsBySessionId(
          db,
          activeOrFinishedSession.id,
        );

        callback({
          success: true,
          crossings: sessionLineCrossings,
          sessionStarted: activeOrFinishedSession.started_at,
        });
      } else {
        // console.log("No active or finished session found");
        callback({ success: false });
      }
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });

  // Get list of best lap times per car
  socket.on("leader-board:get-best-lap-times-per-car", (callback) => {
    try {
      const session = getActiveOrFinishedSession(db);
      if (session) {
        const bestLapTimes = getBestLapTimesForCarBySessionId(db, session.id);
        callback({ success: true, lapTimes: bestLapTimes });
      } else {
        callback({ success: false });
      }
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });

  // Get laps count for each car in active session
  socket.on("leader-board:get-laps-count", (callback) => {
    try {
      const session = getActiveOrFinishedSession(db);

      if (session) {
        const lapsCount = getLapsCount(db, session.id);
        callback({ success: true, laps: lapsCount });
      } else {
        throw new Error();
      }
    } catch (error) {
      callback({ success: false });
    }
  });

  // Get active session data for lap-line-observer
  socket.on("lap-line-observer:get-active-session", (callback) => {
    try {
      const session = getActiveSession(db);

      // If active session was found
      if (session) {
        const activeSessionDrivers = getDriversOfSession(db, session.id);

        callback({ success: true, ...session, drivers: activeSessionDrivers });
      } else {
        callback({ success: false });
      }
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });
});

// Front desk events handler
frontDeskIo.use((socket, next) => {
  const accessKey = socket.handshake.auth.accessKey;
  if (accessKey === process.env.FRONT_DESK_KEY) {
    next();
    return;
  }
  next(new Error("Unauthorized"));
});
frontDeskIo.on("connection", (socket) => {
  // Create new session
  socket.on("race-session:create", (data, callback) => {
    const content = JSON.parse(data);

    try {
      const transaction = db.transaction(() => {
        // Create new session and get back id of it
        const idOfSession = createSession(db);

        // Assign drivers to newly created session
        content.forEach((driver) =>
          assignDriversToSession(db, idOfSession, driver),
        );

        // Assign current session
        assignCurrentSession(db);
      });

      transaction();

      // Emit events for client
      io.emit("race-session:list-update");
      io.emit("race-session:race-control-list-update");
      io.emit("next-race:update");
      callback({ success: true });
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });

  // Save changes of race session
  socket.on("race-session:save-changes", (data, callback) => {
    try {
      const { sessionId, driversToSubmit } = JSON.parse(data);

      const transaction = db.transaction(() => {
        // Delete all old drivers from session
        deleteDriversOfSessionById(db, sessionId);

        // Insert new drivers
        driversToSubmit.forEach((item) => {
          assignDriversToSession(db, sessionId, item);
        });
      });

      transaction();

      io.emit("race-control:session-by-id:updated", sessionId);
      io.emit("next-race:update");

      callback({ success: true });
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });

  // Delete session
  socket.on("race-session:delete-by-id", (data, callback) => {
    try {
      // Delete session
      deleteSessionById(db, data);

      // Assign new session as current (If needed)
      assignCurrentSession(db);

      io.emit("race-session:race-control-list-update");
      io.emit("race-session:deleted", data);
      io.emit("next-race:update");

      callback({ success: true });
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });
});

// Race control events handler
raceControlIo.use((socket, next) => {
  const accessKey = socket.handshake.auth.accessKey;
  if (accessKey === process.env.RACE_CONTROL_KEY) {
    next();
    return;
  }
  next(new Error("Unauthorized"));
});
raceControlIo.on("connection", (socket) => {
  // Handle session start
  socket.on("race-control:start-session", (data, callback) => {
    try {
      const transaction = db.transaction(() => {
        // Mark session as started
        startSession(db, data);

        // Clear map which holds data if car passed finish line for the first time
        isCarPassedLineFirstTime.clear();

        const updatedSessionData = getSessionById(db, data);

        // Change race mode to safe
        setRaceModeStatus(db, "safe");

        // Add timeout to timers map (10 minutes)
        const timeout = setTimeout(() => {
          const transaction = db.transaction(() => {
            // Set status of session as finished
            finishSession(db, data);

            // Change racing mode
            setRaceModeStatus(db, "finish");
          });

          transaction();

          const flag = getRaceMode(db);

          io.emit("session-end", data);
          io.emit("race-flags:status-update", flag);
          io.emit("race-ended");
        }, TIMER_DURATION);
        raceControlTimes.set(data, timeout);

        // Send updated list
        const sessionsInQueue = getSessionsInQueue(db);

        // Get flag status
        const flag = getRaceMode(db);

        io.emit("race-session:list-update", sessionsInQueue);
        io.emit("race-session:race-control-list-update");
        io.emit("race-flags:status-update", flag);
        io.emit("next-race:update");
        io.emit("race-started");

        callback({ success: true, sessionInfo: updatedSessionData });
      });

      transaction();
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });

  // Handle session end
  socket.on("race-control:end-session", (data) => {
    // Just delete session (For now) Maybe will implement previous session look out as a bonus feature
    try {
      const transaction = db.transaction(() => {
        deleteSessionById(db, data);
        assignCurrentSession(db);
        setRaceModeStatus(db, "hazard");
      });

      transaction();

      // Send updated race flag
      const flag = getRaceMode(db);

      io.emit("race-flags:status-update", flag);
      io.emit("race-session:list-update");
      io.emit("race-session:race-control-list-update");
      io.emit("session-deleted");
      io.emit("next-race:update");
    } catch (error) {
      console.log(error);
    }
  });

  // Set new race mode
  socket.on("race-flags:set-status", (data, callback) => {
    try {
      // Check current status
      const currentStatus = getRaceMode(db);

      // Only change race mode if its not already on finish
      if (currentStatus.mode !== "finish") {
        // Change race mode
        setRaceModeStatus(db, data);

        // Get updated race mode
        const flag = getRaceMode(db);

        // If finish was clicked ->
        // End race session
        if (data === "finish") {
          db.prepare(
            `
            UPDATE sessions
            SET status = ?
            WHERE status = ?
          `,
          ).run("finished", "active");

          io.emit("race-ended");
          io.emit("race-control:session-by-id:updated");
        }

        // Send updated race flag status to client
        io.emit("race-flags:status-update", flag);

        callback({ success: true, mode: flag.mode });
      } else {
        // If mode is already = finished but somehow active session exists
        const activeSession = getActiveSession(db);
        if (activeSession) {
          finishSession(db, activeSession.id);
          io.emit("race-ended");
          io.emit("race-control:session-by-id:updated");
          // Send updated race flag status to client
          io.emit("race-flags:status-update", flag);

          callback({ success: true, mode: flag.mode });
        }
      }
    } catch (error) {
      console.log(error);
      callback({ success: false });
    }
  });
});

// Lap line observer events handler
lapLineObserverIo.use((socket, next) => {
  const accessKey = socket.handshake.auth.accessKey;
  if (accessKey === process.env.LAP_LINE_OBSERVER_KEY) {
    next();
    return;
  }
  next(new Error("Unauthorized"));
});
lapLineObserverIo.on("connection", (socket) => {
  // Record lap-line cross
  socket.on("lap-line-observer:car-crossed", (data) => {
    try {
      // Get active session
      const activeSession = getActiveSession(db);

      if (activeSession) {
        // Get driver by car number
        const driver = getDriverByCarNumber(db, activeSession.id, data);

        if (driver) {
          // Check if car passed finish line for the first time
          // And if not passed -> firstly record data in MAP
          // Check if car already passed the line
          const isCarPassedLine = getLineCrossRecordByDriverNameAndSessionId(
            db,
            driver.name,
            activeSession.id,
          );
          if (!isCarPassedLine) {
            isCarPassedLineFirstTime.set(driver.car_assigned, true);
            recordLineCross(db, driver, null);
            // Record best lap time for the car
            recordBestLapTimePerCar(
              db,
              activeSession.id,
              driver.car_assigned,
              null,
            );

            // Create laps count record
            createLapsCountRecord(db, activeSession.id, driver.car_assigned);
          } else {
            // Inc laps counter
            incLapsCount(db, activeSession.id, driver.car_assigned);

            // Check if driver already has lap-line record
            const previousRecord = getLineCrossRecordByDriverNameAndSessionId(
              db,
              driver.name,
              activeSession.id,
            );

            if (previousRecord) {
              // If driver already crossed the lap (Comparing lap_time fields)
              if (previousRecord.lap_time) {
                const currentLapTime = Date.now() - previousRecord.time;

                // If new time is better than previous -> Update it
                if (currentLapTime < previousRecord.lap_time) {
                  updateLineCrossRecord(db, previousRecord.id, currentLapTime);
                  updateBestLapTimePerCar(
                    db,
                    activeSession.id,
                    driver.car_assigned,
                    currentLapTime,
                  );
                } else {
                  updateLineCrossRecord(
                    db,
                    previousRecord.id,
                    previousRecord.lap_time,
                  );
                }
              } else {
                const lapTime = Date.now() - previousRecord.time;
                updateLineCrossRecord(db, previousRecord.id, lapTime);
                updateBestLapTimePerCar(
                  db,
                  activeSession.id,
                  driver.car_assigned,
                  lapTime,
                );
              }
            }

            // Emit event for client
            io.emit("lap-line-observer:new-record");
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
});

// Track hearthbeat expiration
setInterval(() => {
  const expirationTime = Date.now() - 20000;

  try {
    const query = db
      .prepare(
        `
        UPDATE sessions SET editing_last_seen = ?, status = ? WHERE editing_last_seen < ?
    `,
      )
      .run(null, "pending", expirationTime);

    if (query.changes > 0) {
      // Emit events to update sessions list
      io.emit("race-session:list-update");
      io.emit("race-session:race-control-list-update");
    }
  } catch (error) {
    console.log(error);
  }
}, 10000);

io.listen(3000);
