/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { socket } from "../socket/socket";
import { NavLink, Outlet } from "react-router";

const RaceControl = () => {
  const [sessionsList, setSessionsList] = useState([]);
  const [isLoading, setLoadingState] = useState(true);

  const [currentSession, setCurrentSession] = useState();

  // Get sessions list (Current race and subsequent races)
  const getSessionsList = async () => {
    const sessions = await socket
      .timeout(500)
      .emitWithAck("race-sessions:race-control-sessions-list");

    if (sessions.success) {
      setSessionsList(sessions.sessionsInQueue);
      setCurrentSession(sessions.currentSession);
    }

    setLoadingState(false);
  };

  useEffect(() => {
    getSessionsList();

    socket.on(`race-session:race-control-list-update`, getSessionsList);

    return () => {
      socket.off("race-session:race-control-list-update", getSessionsList);
    };
  }, []);

  return (
    <div className="w-dvw h-dvh bg-base-300 p-8">
      <div className="w-full h-full bg-base-100 rounded-lg shadow-md shadow-gray-300 p-4 overflow-y-scroll">
        <header>
          <h1 className="text-xl">Race Control</h1>
        </header>

        <div className="w-full grid grid-cols-10 mt-5">
          {/* List of sessions */}
          <div className="col-span-1 flex flex-col items-start gap-y-3">
            <p>Current session:</p>
            {isLoading ? (
              <span className="loading loading-spinner loading-xl"></span>
            ) : (
              <div>
                {currentSession ? (
                  <NavLink
                    key={currentSession.id}
                    to={`/race-control/current-session/${currentSession.id}`}
                    className={({ isActive }) =>
                      `btn ${isActive && "btn-secondary"}`
                    }
                    end
                  >
                    Session - #{currentSession.id}
                  </NavLink>
                ) : null}
              </div>
            )}

            <div className="divider"></div>
            <p>Sessions in queue:</p>
            {isLoading ? (
              <span className="loading loading-spinner loading-xl"></span>
            ) : (
              sessionsList.map((item) => (
                <NavLink
                  key={item.id}
                  to={`/race-control/session-in-queue/${item.id}`}
                  className={({ isActive }) =>
                    `btn ${isActive && "btn-secondary"}`
                  }
                  end
                >
                  Session - #{item.id}
                </NavLink>
              ))
            )}
          </div>

          <div className="col-start-3 col-span-9">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceControl;
