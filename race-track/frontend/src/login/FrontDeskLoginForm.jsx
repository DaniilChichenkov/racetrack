import { useState } from "react";
import { connectFrontDesk } from "../socket/frontDeskSocket";
import { useNavigate } from "react-router";

const FrontDeskLoginForm = () => {
  const [accessKeyValue, handleAccessKeyInput] = useState("");
  const [errorText, setErrorText] = useState("");
  const nav = useNavigate();

  const handleSocketConnect = () => {
    if (accessKeyValue && accessKeyValue.length) {
      const frontDeskSocket = connectFrontDesk(accessKeyValue);

      // Once connected -> Navigate to 'front-desk'
      frontDeskSocket.once("connect", () => {
        nav("/front-desk");
      });

      frontDeskSocket.once("connect_error", () => {
        setErrorText("Invalid access key");
      });
    }
  };

  return (
    <div className="w-full p-4 flex flex-col items-end gap-y-3">
      <fieldset className="fieldset w-full">
        <legend className="fieldset-legend">Front desk access key:</legend>
        <input
          onChange={(e) => handleAccessKeyInput(e.target.value)}
          type="text"
          className="input w-full"
          placeholder="Type here"
        />
        {errorText && errorText.length && (
          <p className="label text-red-500 font-bold">{errorText}</p>
        )}
      </fieldset>
      <button onClick={handleSocketConnect} className="btn btn-primary">
        Confirm
      </button>
    </div>
  );
};

export default FrontDeskLoginForm;
