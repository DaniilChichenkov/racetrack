import { useEffect } from "react";
import { socket } from "../socket/socket";
import { useState } from "react";
import { Shrink, Expand } from "lucide-react";

const NextRace = () => {
  const [dataToRender, setDataToRender] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreenMode, setDisplayMode] = useState(false);
  const fullScreenClasses = "w-full h-full";

  // Get race data on mount
  const getNextRaceData = async () => {
    if (!isLoading) {
      setIsLoading(() => true);

      const response = await socket
        .timeout(500)
        .emitWithAck("next-race:get-data");

      setIsLoading(() => false);

      if (response?.success) {
        setDataToRender(response.data);
      } else {
        setDataToRender(null);
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getNextRaceData();

    socket.on("next-race:update", getNextRaceData);
    socket.on("race-session:deleted", getNextRaceData);
    socket.on("race-session:created", getNextRaceData);

    return () => {
      socket.off("next-race:update", getNextRaceData);
      socket.off("race-session:deleted", getNextRaceData);
      socket.off("race-session:created", getNextRaceData);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-dvw h-dvh flex justify-center items-center">
      <div
        className={`card bg-base-100 w-96 shadow-sm ${isFullScreenMode && fullScreenClasses}`}
      >
        <div className="card-body">
          <div className="w-full flex justify-between items-center">
            <p className="text-xl font-bold">Next Race: </p>
            <button
              onClick={() => setDisplayMode((state) => !state)}
              className="btn btn-primary"
            >
              {isFullScreenMode ? <Shrink /> : <Expand />}
            </button>
          </div>
          {dataToRender && (
            <ul className="list bg-base-100 rounded-box shadow-md">
              <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
                Next session drivers:
              </li>

              {dataToRender.drivers &&
                dataToRender.drivers.map((item) => (
                  <li className="list-row" key={item.id}>
                    <div className="text-4xl font-thin opacity-30 tabular-nums">
                      01
                    </div>
                    <div className="list-col-grow">
                      <div>{item.name}</div>
                      <div className="text-xs uppercase font-semibold opacity-60">
                        Car - {item.car_assigned}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NextRace;
