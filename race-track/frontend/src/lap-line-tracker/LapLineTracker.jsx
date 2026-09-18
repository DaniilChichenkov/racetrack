/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { socket } from "../socket/socket";
import { getLapLineObserverSocket } from "../socket/lapLineObserverSocket";

const LapLineTracker = () => {
  const [isLoading, setLoadingState] = useState(false);
  const [dataToRender, setDataToRender] = useState(null);
  const lapLineSocket = getLapLineObserverSocket();

  const getActiveRace = async () => {
    setLoadingState(() => true);

    const response = await socket
      .timeout(500)
      .emitWithAck("lap-line-observer:get-active-session");

    if (response.success) {
      setDataToRender({
        sessionId: response.sessionId,
        status: response.status,
        drivers: response.drivers,
      });
    } else {
      setDataToRender(null);
    }

    setLoadingState(() => false);
  };

  const handleRecordLapBtnClick = (carNumber) => {
    lapLineSocket.timeout(500).emit("lap-line-observer:car-crossed", carNumber);
  };

  useEffect(() => {
    getActiveRace();

    socket.on("race-started", getActiveRace);
    socket.on("session-deleted", getActiveRace);
    socket.on("session-end", getActiveRace);
    socket.on("race-ended", getActiveRace);

    return () => {
      socket.off("race-started", getActiveRace);
      socket.off("session-deleted", getActiveRace);
      socket.off("session-end", getActiveRace);
      socket.off("race-ended", getActiveRace);
    };
  }, []);

  return (
    <div className="w-dvw h-dvh flex justify-center items-center">
      <div className="w-8/12 h-8/12 p-4 shadow-sm shadow-black rounded-lg">
        {isLoading ? (
          <div className="w-full h-full flex justify-center items-center">
            <span className="loading loading-spinner loading-xl"></span>
          </div>
        ) : dataToRender ? (
          <div className="w-full h-full">
            <ul className="w-full bg-base-100 rounded-box shadow-md gap-y-5 grid grid-cols-2 gap-10 p-5">
              {dataToRender.drivers
                .sort((a, b) => a.car_assigned - b.car_assigned)
                .map((driver) => (
                  <li className="list-row" key={driver.id}>
                    <div className="text-4xl font-thin opacity-30 tabular-nums">
                      {driver.car_assigned}
                    </div>

                    <button
                      onClick={() =>
                        handleRecordLapBtnClick(driver.car_assigned)
                      }
                      className="btn btn-primary btn-square btn-wide"
                    >
                      Crossed
                    </button>
                  </li>
                ))}
            </ul>
            {/* {dataToRender.drivers.map(driver => )} */}
          </div>
        ) : (
          <div className="w-full h-full flex justify-center items-center">
            <p className="text-xl font-bold">No active session found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LapLineTracker;
