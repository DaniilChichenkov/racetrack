import { useRef, useState } from "react";
import { useEffect } from "react";
import { socket } from "../socket/socket";
import { Shrink, Expand } from "lucide-react";
import { getRemainingTime } from "../utils/getRemainingTime";

const RaceCountdown = () => {
  const [isLoading, setLoadingState] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [timeToDisplay, setTimeToDisplay] = useState(null);
  const timerRef = useRef();

  const [fullScreen, setFullScreen] = useState(false);
  const fullScreenClasses = "w-full h-full";

  // Get remaining time of an active race on component`s mount
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

  return (
    <div className="w-dvw h-dvh flex justify-center items-center">
      <div
        className={`card bg-base-100 w-96 shadow-sm ${fullScreen && fullScreenClasses}`}
      >
        <div className="card-body">
          <div className="w-full flex justify-between items-center">
            <p className="text-xl font-bold">Race Countdown: </p>
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
            {remainingTime && timeToDisplay && (
              <span className="countdown font-mono text-4xl">
                <span
                  style={{ "--value": timeToDisplay.minutes }}
                  aria-live="polite"
                >
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
        </div>
      </div>
    </div>
  );
};

export default RaceCountdown;
