import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { createBrowserRouter, redirect } from "react-router";
import { RouterProvider } from "react-router/dom";

// Sockets
import { isFrontDesSocketConnected } from "./socket/frontDeskSocket";
import { isRaceControlSocketConnected } from "./socket/raceControlSocket";

// Front desk routes
import FrontDesk from "./front-desk/FrontDesk";
import NewSession from "./front-desk/NewSession";
import EditSession from "./front-desk/EditSession";

// Race control routes
import RaceControl from "./race-control/RaceControl";
import SessionInQueue from "./race-control/SessionInQueue";
import CurrentSessionControl from "./race-control/CurrentSessionControl";

// Race flags routes
import RaceFlags from "./race-flags/race-flags";

// Next race display
import NextRace from "./next-race/NextRace";

// Race countdown
import RaceCountdown from "./race-countdown/RaceCountdown";

// Leader board
import LeaderBoard from "./leader-board/LeaderBoard";

// Lap Line observer
import LapLineTracker from "./lap-line-tracker/LapLineTracker";

// Login forms
import LoginLayout from "./login/LoginLayout";
import FrontDeskLoginForm from "./login/FrontDeskLoginForm";
import RaceControlLoginForm from "./login/RaceControlLoginForm";
import LapLineObserverLoginForm from "./login/LapLineObserverLoginForm";
import { isLapLineObserverConnected } from "./socket/lapLineObserverSocket";

const router = createBrowserRouter([
  {
    index: true,
    loader: () => {
      return redirect('/front-desk')
    },
    element: <div>Welcome to race track</div>,
  },

  // Receptionist routes
  {
    path: "/front-desk",
    element: <FrontDesk />,
    loader: () => {
      // Check if user is authorized
      if (!isFrontDesSocketConnected()) {
        throw redirect("/login/front-desk");
      }
      return null;
    },
    children: [
      // Add new session
      {
        path: "new-session",
        element: <NewSession />,
      },

      // Edit session by id
      {
        path: "session/:sessionId",
        element: <EditSession />,
      },
    ],
  },

  // Safety official route
  {
    path: "/race-control",
    element: <RaceControl />,
    loader: () => {
      if (!isRaceControlSocketConnected()) {
        throw redirect("/login/race-control");
      }
      return null;
    },
    children: [
      // Just look info about other sessions
      {
        path: "session-in-queue/:id",
        element: <SessionInQueue />,
      },

      // Control of current session (Sessions are started subsequently)
      {
        path: "current-session/:id",
        element: <CurrentSessionControl />,
      },
    ],
  },

  // Race flags
  {
    path: "/race-flags",
    element: <RaceFlags />,
  },

  // Next race
  {
    path: "/next-race",
    element: <NextRace />,
  },

  // Countdown
  {
    path: "/race-countdown",
    element: <RaceCountdown />,
  },

  // Leader board
  {
    path: "/leader-board",
    element: <LeaderBoard />,
  },

  // Lap line observer
  {
    loader: () => {
      if (!isLapLineObserverConnected()) {
        throw redirect("/login/lap-line-observer");
      }
      return null;
    },
    path: "/lap-line-tracker",
    element: <LapLineTracker />,
  },

  // Login forms
  {
    path: "/login",
    element: <LoginLayout />,
    children: [
      {
        path: "front-desk",
        element: <FrontDeskLoginForm />,
      },
      {
        path: "race-control",
        element: <RaceControlLoginForm />,
      },
      {
        path: "lap-line-observer",
        element: <LapLineObserverLoginForm />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
