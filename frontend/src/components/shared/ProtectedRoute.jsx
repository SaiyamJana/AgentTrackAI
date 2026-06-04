import { Navigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthContext();

  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;