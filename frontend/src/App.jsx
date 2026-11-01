
import {
    BrowserRouter,
    Routes,
    Route,
    Link
} from "react-router-dom";

import Home from "./pages/Home";
import BrowseReports from "./pages/BrowseReports";
import ReportItem from "./pages/ReportItem";
import ReportDetails from "./pages/ReportDetails";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function AppContent() {
    const { user, logout, authLoading } = useAuth();

    return (
        <div className="app">
            <nav className="navbar">
                <Link to="/" className="logo">
                    CampusLoop
                </Link>

                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/reports">Browse Reports</Link>

                    {user?.role === "student" && (
                        <Link to="/report">Report an Item</Link>
                    )}

                    {!authLoading && !user && (
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}

                    {user && (
                        <>
                            <span className="nav-user">
                                {user.name}
                                {user.role === "admin" && " (Admin)"}
                            </span>

                            <button
                                type="button"
                                className="nav-logout"
                                onClick={logout}
                            >
                                Logout
                            </button>
                        </>
                    )}

                    {!authLoading && !user && (
                        <Link to="/admin/login">Admin</Link>
                    )}
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />

                <Route
                    path="/reports"
                    element={<BrowseReports />}
                />

                <Route
                    path="/report"
                    element={
                        <ProtectedRoute role="student">
                            <ReportItem />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/reports/:id"
                    element={<ReportDetails />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/admin/login"
                    element={<AdminLogin />}
                />
            </Routes>

            <footer>
                <p>
                    CampusLoop © 2026 | Helping our campus reconnect
                </p>
            </footer>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter basename="/CampusLoop">
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
