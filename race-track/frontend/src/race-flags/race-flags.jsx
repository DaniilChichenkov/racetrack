import { useEffect } from "react";
import { socket } from "../socket/socket";
import { useState } from "react";
import { Expand, Shrink } from "lucide-react";

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
  const [fullScreen, setFullScreen] = useState(false);
  const fullScreenClasses = "w-full h-full";

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
    <div className="w-dvw h-dvh flex justify-center items-center">
      <div
        className={`card bg-base-100 w-96 shadow-sm ${fullScreen && fullScreenClasses}`}
      >
        <div className="card-body">
          <div className="w-full flex justify-between items-center">
            <p className="text-xl font-bold">Race Flag: </p>
            <button
              onClick={() => setFullScreen((state) => !state)}
              className="btn btn-primary"
            >
              {fullScreen ? <Shrink /> : <Expand />}
            </button>
          </div>

          <div
            className={`w-full flex justify-center items-center ${fullScreen && "h-full"}`}
          >
            {flagToDisplay === "hazard" ? (
              <div
                className={`w-full h-40 bg-yellow-500 rounded-xl mt-10 ${fullScreen && "h-full"}`}
              ></div>
            ) : flagToDisplay === "danger" ? (
              <div
                className={`w-full h-40 bg-red-500 rounded-xl mt-10 ${fullScreen && "h-full"}`}
              ></div>
            ) : flagToDisplay === "finish" ? (
              <ChequeredFlag className="border border-blac rounded-xl" />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceFlags;
