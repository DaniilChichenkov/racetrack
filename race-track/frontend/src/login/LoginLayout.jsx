import { Outlet } from "react-router";

const LoginLayout = () => {
  return (
    <div className="w-dvw h-dvh flex justify-center items-center">
      <div className="card bg-base-100 w-11/12 md:w-7/12 lg:w-5/12 xl:w-3/12 shadow-sm">
        <Outlet />
      </div>
    </div>
  );
};

export default LoginLayout;
