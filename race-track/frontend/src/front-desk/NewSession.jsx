import { Plus, Trash } from "lucide-react";
import { useState } from "react";
import { Form, useNavigate } from "react-router";
import { v4 } from "uuid";
import { getFrontDeskSocket } from "../socket/frontDeskSocket";
import { socket } from "../socket/socket";

const NewSession = () => {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setLoadingState] = useState(false);
  const nav = useNavigate();
  const frontDeskSocket = getFrontDeskSocket();

  // Available cars (8)
  let availableCars = [1, 2, 3, 4, 5, 6, 7, 8];
  const takenCars = drivers.map((item) => +item.car);
  availableCars = availableCars.filter((car) => !takenCars.includes(car));

  const handleNewDriverBtnClick = () => {
    if (drivers.length < 8) {
      setDrivers((state) => [...state, { name: "", uuid: v4(), car: null }]);
    }
  };

  const handleInput = (driver, value) => {
    setDrivers((state) =>
      state.map((item) =>
        item.uuid == driver.uuid ? { ...item, name: value } : item,
      ),
    );
  };

  const handleCarSelect = (driver, car) => {
    if (car === "clear") {
      setDrivers((state) =>
        state.map((item) =>
          item.uuid == driver.uuid ? { ...item, car: null } : item,
        ),
      );
    } else {
      setDrivers((state) =>
        state.map((item) =>
          item.uuid == driver.uuid ? { ...item, car } : item,
        ),
      );
    }
  };

  const deleteDriverInput = (driver) => {
    setDrivers((state) => state.filter((item) => item.uuid != driver.uuid));
  };

  const handleSubmit = async (e) => {
    if (drivers.length) {
      e.preventDefault();

      // Assign car to driver without it
      const carsAvailableForAssign = [...availableCars];
      const driversToSubmit = drivers.map((driver) =>
        !driver.car ? { ...driver, car: carsAvailableForAssign.pop() } : driver,
      );

      // Emit submit event
      setLoadingState(true);
      const response = await frontDeskSocket
        .timeout(500)
        .emitWithAck("race-session:create", JSON.stringify(driversToSubmit));
      setLoadingState(false);

      if (response.success) {
        nav("/front-desk");
      } else {
        console.log("Failed to create a session");
      }
    }
  };

  return (
    <Form className="w-full" onSubmit={handleSubmit}>
      <div className="flex justify-start items-center gap-x-10">
        <p>New Session Form</p>
        <button disabled={!drivers.length} className="btn btn-primary">
          Confirm
        </button>
      </div>

      {!isLoading ? (
        <>
          <div className="w-full mt-5">
            {drivers.map((item, i) => (
              <div className="w-full" key={item.uuid}>
                <div className="flex justify-start items-end gap-x-5">
                  <p>#{i + 1}</p>
                  <fieldset className="fieldset py-0">
                    <label className="label" htmlFor={item.uuid}>
                      Name
                    </label>
                    <input
                      type="text"
                      id={item.uuid}
                      className="input"
                      placeholder="Name"
                      value={item.name}
                      onChange={(e) => handleInput(item, e.target.value)}
                      required
                    />
                  </fieldset>

                  {/* Car selector */}
                  <fieldset className="fieldset py-0">
                    <legend className="fieldset-legend pt-0">
                      Assign a car
                    </legend>
                    <select
                      onChange={(e) => handleCarSelect(item, e.target.value)}
                      value={item.car ? item.car : "Car selector"}
                      className="select"
                    >
                      <option disabled={true}>Car selector</option>

                      {/* Render selected car */}
                      {item.car && <option value={item.car}>{item.car}</option>}

                      {/* List of available cars */}
                      {availableCars.map((car) => (
                        <option key={`${item}-${car}`} value={car}>
                          {car}
                        </option>
                      ))}

                      {/* Clear selected car */}
                      {item.car && <option value="clear">Clear</option>}
                    </select>
                  </fieldset>

                  {/* Delete driver input */}
                  <button
                    onClick={() => deleteDriverInput(item)}
                    className="btn btn-error text-white"
                  >
                    <Trash />
                  </button>
                </div>
                <div className="divider my-0 py-0"></div>
              </div>
            ))}
          </div>

          <button
            onClick={handleNewDriverBtnClick}
            disabled={drivers.length >= 8}
            className="btn mt-5"
            type="button"
          >
            <Plus /> Driver
          </button>
        </>
      ) : (
        <span className="loading loading-spinner loading-xl"></span>
      )}
    </Form>
  );
};

export default NewSession;
