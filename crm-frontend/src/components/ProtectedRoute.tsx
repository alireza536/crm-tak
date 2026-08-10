import { Navigate } from "react-router-dom";
import { getSession, type UserRole } from "../utils/auth";

type Props = {
  children: React.ReactNode;
  roles?: UserRole[];
};

export default function ProtectedRoute({ children, roles }: Props) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(session.user.role)) return <Navigate to="/" replace />;
  return children;
}
