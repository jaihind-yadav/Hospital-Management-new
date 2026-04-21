import { Navigate } from "react-router-dom";
import { getStoredUser, roleHomeRoute } from "../utils/auth";

const DashboardPage = () => {
  const user = getStoredUser();
  return <Navigate to={roleHomeRoute(user?.role)} replace />;
};

export default DashboardPage;
