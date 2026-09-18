import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { socket } from "../socket/socket";

const FrontDesk = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setLoadingState] = useState(true);
  const { pathname } = useLocation();

  // Subscribe to events
  useEffect(() => {
    // Get sessions list
    const getSessionsList = async () => {
      const sessionsList = await socket
        .timeout(500)
        .emitWithAck("race-sessions:list");

      if (sessionsList.success) {
        setSessions(sessionsList.sessions);
      }

      setLoadingState(false);
    };
    getSessionsList();

    socket.on(`race-session:list-update`, getSessionsList);

    return () => {
      socket.off("race-session:list-update", getSessionsList);
    };
  }, [pathname]);

  return (
    <div className="w-dvw h-dvh bg-base-300 p-8">
      <div className="w-full h-full bg-base-100 rounded-lg shadow-md shadow-gray-300 p-4 overflow-y-scroll">
        <header>
          <h1 className="text-xl">Front Desk</h1>
        </header>

        <div className="w-full grid grid-cols-10 mt-5">
          {/* List of sessions */}
          <div className="col-span-1 flex flex-col items-start gap-y-3">
            {isLoading ? (
              <span className="loading loading-spinner loading-xl"></span>
            ) : (
              sessions.map((item) => (
                <NavLink
                  key={item.id}
                  to={`/front-desk/session/${item.id}`}
                  className={({ isActive }) =>
                    `btn ${isActive && "btn-secondary"} ${item.status !== "pending" && "btn-disabled"}`
                  }
                  end
                >
                  Session - #{item.id}
                </NavLink>
              ))
            )}

            {/* Link to new session UI */}
            <Link
              to="/front-desk/new-session"
              className="btn btn-primary w-full mt-10"
            >
              Add Session
            </Link>
          </div>

          <div className="col-start-3 col-span-9">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontDesk;
