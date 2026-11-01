import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, role }) {
    const { user, authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="report-placeholder">
                <h2>Checking login...</h2>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role && user.role !== role) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;