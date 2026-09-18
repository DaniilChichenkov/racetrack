/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { socket } from "../socket/socket";
import { useParams } from "react-router";
import { v4 } from "uuid";

const SessionControl = () => {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setLoadingState] = useState(true);
  const { id } = useParams();

  // Get session data
  const getSessionInfo = async () => {
    setLoadingState(true);

    const response = await socket
      .timeout(500)
      .emitWithAck("race-session:get-by-id", id);

    if (response.success) {
      setLoadingState(false);
      setDrivers(
        response.drivers.map((item) => {
          return {
            ...item,
            car: item.car_assigned,
            uuid: v4(),
          };
        }),
      );
    }
  };

  useEffect(() => {
    // Emit edit-hearthbeat event so other people will not be able to start / edit session
    // socket.emit("race-session:edit-hearthbeat", id);
    // const hearthBeat = setInterval(() => {
    //   socket.emit("race-session:edit-hearthbeat", id);
    // }, 5000);

    // Get session data
    getSessionInfo();

    // return () => {
    //   clearInterval(hearthBeat);
    // };
  }, [id]);

  return (
    <div className="w-full">
      <p>List of drivers:</p>

      {/* List of drivers */}
      {!isLoading ? (
        <>
          <div className="w-full mt-5">
            {drivers.map((item, i) => (
              <div className="w-full" key={item.uuid}>
                <div className="flex justify-start items-center gap-x-5">
                  <p>#{i + 1}</p>
                  <p>{item.name}</p>
                  <p>Assigned to car: {item.car_assigned}</p>
                </div>
                <div className="divider my-0 py-0"></div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <span className="loading loading-spinner loading-xl"></span>
      )}
    </div>
  );
};

export default SessionControl;
