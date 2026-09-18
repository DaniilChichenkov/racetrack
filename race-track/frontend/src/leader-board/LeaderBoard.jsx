import { useEffect, useState, useRef } from "react";
import { socket } from "../socket/socket";
import { Shrink, Expand } from "lucide-react";
// import { getRemainingTime } from "../utils/getRemainingTime";
import { formatTime } from "../utils/formatTime";
import { getRemainingTime } from "../utils/getRemainingTime";

// Display laps count
function LapsCounter() {
  const [dataFromServer, setDataFromServer] = useState(null);

  const getLapsCount = async () => {
    const response = await socket
      .timeout(500)
      .emitWithAck("leader-board:get-laps-count");

    if (response.success) {
      setDataFromServer(response.laps);
    } else {
      setDataFromServer(null);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getLapsCount();

    socket.on("lap-line-observer:new-record", getLapsCount);

    return () => {
      socket.off("lap-line-observer:new-record", getLapsCount);
    };
  }, []);

  return (
    <ul className="list bg-base-100 rounded-box shadow-md">
      <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
        Laps per car
      </li>

      {dataFromServer &&
        dataFromServer.map((item) => (
          <li className="list-row" key={item.car_number}>
            <div className="text-4xl font-thin opacity-30 tabular-nums">
              {item.car_number}
            </div>
            <div className="list-col-grow">
              <div>Laps: {item.laps_count}</div>
            </div>
          </li>
        ))}
    </ul>
  );
}

// Display best lap times per car
function BestLapTimesPerCar() {
  const [isLoading, setLoadingState] = useState(false);
  const [dataFromServer, setDataFromServer] = useState(null);

  const getBestLaptTimesPerCarForThisSession = async () => {
    setLoadingState(() => true);
    const response = await socket
      .timeout(500)
      .emitWithAck("leader-board:get-best-lap-times-per-car");

    if (response.success) {
      setDataFromServer(response.lapTimes);
    } else {
      setDataFromServer(null);
    }
    setLoadingState(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getBestLaptTimesPerCarForThisSession();

    socket.on(
      "lap-line-observer:new-record",
      getBestLaptTimesPerCarForThisSession,
    );

    return () => {
      socket.off(
        "lap-line-observer:new-record",
        getBestLaptTimesPerCarForThisSession,
      );
    };
  }, []);

  return (
    <ul className="list bg-base-100 rounded-box shadow-md">
      <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
        Best lap times for each car
      </li>

      {dataFromServer &&
        dataFromServer.map((item) => (
          <li className="list-row" key={item.car_number}>
            <div className="text-4xl font-thin opacity-30 tabular-nums">
              {item.car_number}
            </div>
            <div className="list-col-grow">
              <div>Lap time : {formatTime(item.lap_time).seconds}s</div>
            </div>
          </li>
        ))}
    </ul>
  );
}

// Display flag
function ChequeredFlag({ rows = 4, cols = 6, className = "" }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={col}
            y={row}
            width="1"
            height="1"
            fill={(row + col) % 2 === 0 ? "currentColor" : "white"}
          />
        )),
      )}
    </svg>
  );
}
const RaceFlags = () => {
  const [flagToDisplay, setFlagToDisplay] = useState(null);

  // Get current flag status
  const getCurrentFlagStatus = async () => {
    const response = await socket
      .timeout(500)
      .emitWithAck("race-flags:get-status");

    if (response.success) {
      setFlagToDisplay(response.flag.mode);
    }
  };

  // Subscribe to events
  useEffect(() => {
    socket.on("race-flags:status-update", getCurrentFlagStatus);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    getCurrentFlagStatus();

    return () => {
      socket.off("race-flags:status-update", getCurrentFlagStatus);
    };
  }, []);

  return (
    <div className={`w-full flex justify-center items-center h-full`}>
      {flagToDisplay === "hazard" ? (
        <div
          className={`w-full bg-yellow-500 rounded-xl h-full min-h-20`}
        ></div>
      ) : flagToDisplay === "danger" ? (
        <div className={`w-full bg-red-500 rounded-xl min-h-20 h-full`}></div>
      ) : flagToDisplay === "finish" ? (
        <ChequeredFlag className="border border-blac rounded-xl" />
      ) : null}
    </div>
  );
};

// Display remaining time
const RemainingTime = () => {
  const [isLoading, setLoadingState] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [timeToDisplay, setTimeToDisplay] = useState(null);
  const timerRef = useRef();

  const getRemainingTimeOfAnActiveRace = async () => {
    if (!isLoading) {
      setLoadingState(() => true);

      const response = await socket
        .timeout(500)
        .emitWithAck("race-countdown:get-active-race-time");

      if (response.success) {
        setRemainingTime(response.startedAt);
      } else {
        setRemainingTime(null);
        clearInterval(timerRef.current);
        setTimeToDisplay(null);
      }

      setLoadingState(() => false);
    }
  };

  // Subscribe to events
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getRemainingTimeOfAnActiveRace();

    socket.on("race-started", getRemainingTimeOfAnActiveRace);
    socket.on("race-ended", getRemainingTimeOfAnActiveRace);

    return () => {
      socket.off("race-started", getRemainingTimeOfAnActiveRace);
      socket.off("race-ended", getRemainingTimeOfAnActiveRace);
      clearInterval(timerRef.current);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const time = getRemainingTime(remainingTime);
      setTimeToDisplay(() => {
        return {
          minutes: time.minutes,
          seconds: time.seconds,
        };
      });
    }, 1000);
  }, [remainingTime]);

  return isLoading ? (
    <div className="w-full flex justify-center py-5">
      <span className="loading loading-spinner loading-xl"></span>
    </div>
  ) : (
    <div className={`w-full flex justify-center items-center h-full`}>
      {remainingTime && timeToDisplay && (
        <span className="countdown font-mono text-4xl">
          <span style={{ "--value": timeToDisplay.minutes }} aria-live="polite">
            {timeToDisplay.minutes}
          </span>
          :
          <span
            style={{
              "--value": timeToDisplay.seconds,
              "--digits": 2,
            }}
            aria-live="polite"
          >
            {timeToDisplay.seconds}
          </span>
        </span>
      )}
    </div>
  );
};

// Display participants by fastest lap time
const LeaderBoardSortedByFastestTime = () => {
  const [isLoading, setLoadingState] = useState(false);
  const [dataFromServer, setDataFromServer] = useState(null);
  const [listToRender, setListToRender] = useState(null);

  const getCrossingsList = async () => {
    setLoadingState(() => true);
    const response = await socket
      .timeout(500)
      .emitWithAck("leader-board:get-crossings-list");

    if (response.success) {
      setDataFromServer({
        crossings: Array.from(response.crossings),
        sessionStarted: response.sessionStarted,
      });
    } else {
      setDataFromServer(null);
    }

    setLoadingState(() => false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getCrossingsList();

    socket.on("lap-line-observer:new-record", getCrossingsList);

    return () => {
      socket.off("lap-line-observer:new-record", getCrossingsList);
    };
  }, []);

  // Sort list by fastest time
  useEffect(() => {
    if (!dataFromServer) return;

    const sortedByTime = [...dataFromServer.crossings].sort(
      (a, b) => Number(a.lap_time) - Number(b.lap_time),
    );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setListToRender(sortedByTime);
  }, [dataFromServer]);

  return (
    <>
      {!isLoading && (
        <ul className="list bg-base-100 rounded-box shadow-md">
          {listToRender && (
            <>
              <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
                Fastest Time
              </li>

              {listToRender.map(
                (item, i) =>
                  item.lap_time && (
                    <li className="list-row" key={item.driver_name}>
                      <div className="text-4xl font-thin opacity-30 tabular-nums">
                        {i + 1}
                      </div>
                      <div className="list-col-grow">
                        <div>Driver: {item.driver_name}</div>
                        <div className="text-xs uppercase font-semibold opacity-60">
                          car: {item.driver_car_number}
                        </div>
                      </div>
                      <div>time: {formatTime(item.lap_time).seconds}s</div>
                    </li>
                  ),
              )}
            </>
          )}
        </ul>
      )}
    </>
  );
};

const LeaderBoard = () => {
  const [currentSecion, setSectionToShow] = useState("leaderboard");

  const [fullScreen, setScreenMode] = useState(false);
  const fullScreenClasses = "w-full h-full";

  const handleSectionToShowBtnClick = (section) => {
    setSectionToShow(section);
  };

  return (
    <div className="w-dvw h-dvh flex justify-center items-center">
      <div
        className={`card bg-base-100 w-8/12 shadow-sm ${fullScreen && fullScreenClasses}`}
      >
        <div className="card-body">
          <div className="w-full flex justify-between items-center">
            <p className="text-xl font-bold">Race Leaderboard: </p>
            <button
              onClick={() => setScreenMode((state) => !state)}
              className="btn btn-primary"
            >
              {fullScreen ? <Shrink /> : <Expand />}
            </button>
          </div>

          {/* Data display options */}
          <div className="w-full flex justify-around items-center mt-3 flex-wrap gap-5">
            <button
              onClick={() => handleSectionToShowBtnClick("leaderboard")}
              className={`btn ${currentSecion === "leaderboard" && "btn-primary"}`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => handleSectionToShowBtnClick("remainingTime")}
              className={`btn ${currentSecion === "remainingTime" && "btn-primary"}`}
            >
              Remaining Time
            </button>
            <button
              onClick={() => handleSectionToShowBtnClick("flag")}
              className={`btn ${currentSecion === "flag" && "btn-primary"}`}
            >
              Flag
            </button>
            <button
              onClick={() => handleSectionToShowBtnClick("fastestLapTimes")}
              className={`btn ${currentSecion === "fastestLapTimes" && "btn-primary"}`}
            >
              Fastest Lap Times
            </button>
            <button
              onClick={() => handleSectionToShowBtnClick("lapsCount")}
              className={`btn ${currentSecion === "lapsCount" && "btn-primary"}`}
            >
              Laps Count
            </button>
          </div>

          {/* Show data */}
          <div className="w-full h-full mt-5">
            {currentSecion === "leaderboard" ? (
              <LeaderBoardSortedByFastestTime />
            ) : currentSecion === "remainingTime" ? (
              <RemainingTime />
            ) : currentSecion === "flag" ? (
              <RaceFlags />
            ) : currentSecion === "fastestLapTimes" ? (
              <BestLapTimesPerCar />
            ) : currentSecion === "lapsCount" ? (
              <LapsCounter />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderBoard;
