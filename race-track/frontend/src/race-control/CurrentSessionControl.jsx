/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from "react";
import { socket } from "../socket/socket";
import { useNavigate, useParams } from "react-router";
import { v4 } from "uuid";
import { getRemainingTime } from "../utils/getRemainingTime";
import { getRaceControlSocket } from "../socket/raceControlSocket";

const CurrentSessionControl = () => {
  const [drivers, setDrivers] = useState([]);
  const [isSessionBusy, setSessionBusyStatus] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setLoadingState] = useState(true);
  const [remainingTime, setRemainingTime] = useState(null);
  const [raceMode, setRaceMode] = useState("safe");
  const { id } = useParams();
  const nav = useNavigate();
  const requestTimer = useRef();
  const raceControlSocket = getRaceControlSocket();

  const timer = useRef();

  // Get session data
  const getSessionInfo = async () => {
    setLoadingState(true);

    const response = await socket
      .timeout(500)
      .emitWithAck("race-session:get-by-id", id);

    if (response.success) {
      setLoadingState(false);
      setSessionBusyStatus(() => response.sessionInfo.status !== "pending");
      setDrivers(
        response.drivers.map((item) => {
          return {
            ...item,
            car: item.car_assigned,
            uuid: v4(),
          };
        }),
      );
      setSessionData(response.sessionInfo);

      // If status is active (Race is in progress)
      if (response.sessionInfo.status === "active") {
        setRemainingTime(() => null);

        // Clear previous timer
        if (timer.current) {
          clearInterval(timer.current);
        }

        // Immediately set remaining time without waiting additional 1 second
        const remainingTime = getRemainingTime(sessionData?.started_at);
        setRemainingTime(() => {
          return {
            minutes: remainingTime.minutes,
            seconds: remainingTime.seconds,
          };
        });

        // Set new timer
        timer.current = setInterval(() => {
          const remainingTime = getRemainingTime(sessionData.started_at);
          setRemainingTime(() => {
            return {
              minutes: remainingTime.minutes,
              seconds: remainingTime.seconds,
            };
          });
        }, 1000);
      }
    } else {
      nav("/race-control");
    }
  };

  useEffect(() => {
    // Request periodically
    requestTimer.current = setInterval(async () => {
      const response = await socket
        .timeout(500)
        .emitWithAck("race-control:session-by-id-status", id);

      if (response.success) {
        setSessionBusyStatus(() => response.status !== "pending");
      }
    }, 5000);

    // Get session data
    getSessionInfo();

    return () => {
      clearInterval(requestTimer.current);
    };
  }, [id]);

  // Request session data when status of a session is being changed
  useEffect(() => {
    getSessionInfo();
  }, [isSessionBusy]);

  // eslint-disable-next-line react-hooks/refs
  useState(() => {
    if (sessionData && sessionData.started_at) {
      // Clear previous timer
      if (timer.current) {
        clearInterval(timer.current);
      }

      // Set new timer
      if (sessionData.status === "active") {
        timer.current = setInterval(() => {
          const remainingTime = getRemainingTime(sessionData.started_at);
          setRemainingTime(() => {
            return {
              minutes: remainingTime.minutes,
              seconds: remainingTime.seconds,
            };
          });
        }, 1000);
      }
    }
  }, [sessionData]);

  useEffect(() => {
    const handleSessionStatusChange = (data) => {
      // If id of session which is being changed equals current session
      if (data == id) {
        setSessionBusyStatus(true);
      }
    };

    const handleSessionEnd = async () => {
      await getSessionInfo();
      clearInterval(timer.current);
      setRemainingTime(() => null);
    };

    const handleSessionDeleteEvent = (deletedSessionId) => {
      if (deletedSessionId == id) {
        nav("/race-control");
      }
    };

    socket.on(
      "race-control:session-by-id:status-change",
      handleSessionStatusChange,
    );

    socket.on("race-control:session-by-id:updated", getSessionInfo);

    socket.on("session-end", handleSessionEnd);

    socket.on("race-session:deleted", handleSessionDeleteEvent);

    return () => {
      socket.off(
        "race-control:session-by-id:status-change",
        handleSessionStatusChange,
      );

      socket.off("race-control:session-by-id:updated", getSessionInfo);

      socket.off("session-end", handleSessionEnd);

      socket.off("race-session:deleted", handleSessionDeleteEvent);
    };
  }, [id]);

  // Start a session
  const handleSessionStart = async () => {
    if (!isLoading) {
      setLoadingState(() => true);
      const response = await raceControlSocket
        .timeout(500)
        .emitWithAck("race-control:start-session", id);
      setLoadingState(() => false);

      if (response.success) {
        setSessionData(response.sessionInfo);
      }

      // Get updated session info once session starts
      await getSessionInfo();
    }
  };

  // End session
  const endSession = async () => {
    raceControlSocket.timeout(500).emit("race-control:end-session", id);
    nav("/race-control");
  };

  // Handle race-mode change
  const handleRaceModeChangeBtnClick = async (newMode) => {
    if (!isLoading) {
      setLoadingState(() => true);

      const response = await raceControlSocket
        .timeout(500)
        .emitWithAck("race-flags:set-status", newMode);

      setLoadingState(() => false);

      if (response?.success) {
        setRaceMode(response.mode);
      }
    }
  };

  return (
    <div className="w-full">
      <p>Current session control:</p>
      {!isLoading ? (
        <>
          <div className="w-full grid grid-cols-10 pt-10">
            {/* Drivers list */}
            <div className="col-span-2">
              <p>List of drivers:</p>
              {drivers.map((item, i) => (
                <div className="w-full mt-3" key={item.uuid}>
                  <div className="flex justify-between items-center gap-x-5">
                    <p>#{i + 1}</p>
                    <p>{item.name}</p>
                    <p>Assigned to car: {item.car_assigned}</p>
                  </div>
                  <div className="divider my-0 py-0"></div>
                </div>
              ))}
            </div>

            {/* Timer until end of the race */}
            {remainingTime && sessionData.status !== "finished" ? (
              <div className="col-start-3 col-span-3 flex flex-col justify-start items-center">
                <p>Timer:</p>
                <span className="countdown font-mono text-2xl mt-5">
                  <span
                    style={{
                      "--value":
                        remainingTime && remainingTime.minutes
                          ? remainingTime.minutes
                          : 0,
                    }}
                    aria-live="polite"
                  >
                    {remainingTime && remainingTime.minutes
                      ? remainingTime.minutes
                      : 0}
                  </span>
                  m
                  <span
                    style={{
                      "--value":
                        remainingTime && remainingTime.seconds
                          ? remainingTime.seconds
                          : 0,
                    }}
                    aria-live="polite"
                  >
                    {remainingTime && remainingTime.seconds
                      ? remainingTime.seconds
                      : 0}
                  </span>
                  s
                </span>
              </div>
            ) : null}
          </div>

          {/* Option btns */}
          <p className="mt-10">Race controls:</p>

          {/* Race controls */}
          {sessionData ? (
            sessionData.status === "pending" ||
            sessionData.status === "editing" ? (
              <div className="w-full flex justify-start items-center mt-5">
                <button
                  onClick={handleSessionStart}
                  disabled={isSessionBusy}
                  className="btn btn-primary"
                >
                  {isSessionBusy
                    ? "Wait until receptionist will do final touches"
                    : "Start race"}
                </button>
              </div>
            ) : sessionData.status === "active" ? (
              <div className="w-full flex justify-start items-center mt-5 gap-x-5">
                <button
                  className={`btn ${raceMode === "safe" && "btn-secondary"}`}
                  disabled={isLoading || raceMode === "finish"}
                  onClick={() => handleRaceModeChangeBtnClick("safe")}
                >
                  Safe
                </button>
                <button
                  className={`btn ${raceMode === "hazard" && "btn-secondary"}`}
                  disabled={isLoading || raceMode === "finish"}
                  onClick={() => handleRaceModeChangeBtnClick("hazard")}
                >
                  Hazard
                </button>
                <button
                  className={`btn ${raceMode === "danger" && "btn-secondary"}`}
                  disabled={isLoading || raceMode === "finish"}
                  onClick={() => handleRaceModeChangeBtnClick("danger")}
                >
                  Danger
                </button>
                <button
                  className={`btn ${raceMode === "finish" && "btn-secondary"}`}
                  disabled={isLoading || raceMode === "finish"}
                  onClick={() => handleRaceModeChangeBtnClick("finish")}
                >
                  Finish
                </button>
              </div>
            ) : sessionData.status === "finished" ? (
              <div className="w-full flex justify-start items-center mt-5 gap-x-5">
                <button onClick={endSession} className="btn btn-primary">
                  End session
                </button>
              </div>
            ) : null
          ) : null}
        </>
      ) : (
        <span className="loading loading-spinner loading-xl"></span>
      )}
    </div>
  );
};

export default CurrentSessionControl;
