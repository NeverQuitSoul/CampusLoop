import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import BrowseReports from "./pages/BrowseReports";
import ReportItem from "./pages/ReportItem";
import ReportDetails from "./pages/ReportDetails";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import MyReports from "./pages/MyReports";
import AdminDashboard from "./pages/AdminDashboard";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {
    const { user, logout } = useAuth();

    return (
        <div className="app">
            <nav className="navbar">
                <Link to="/" className="logo">CampusLoop</Link>

                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/reports">Browse Reports</Link>

                    {user?.role === "admin" && <Link to="/admin/dashboard">Admin Dashboard</Link>}

                    {user?.role === "student" && (
                        <>
                            <Link to="/report">Report an Item</Link>
                            <Link to="/my-reports">My Reports</Link>
                        </>
                    )}

                    {!user && (
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                            <Link to="/admin/login">Admin Login</Link>
                        </>
                    )}

                    {user && (
                        <>
                            <span className="nav-user">{user.name}</span>
                            <button
                                type="button"
                                className="nav-logout"
                                onClick={logout}
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/reports" element={<BrowseReports />} />
                <Route
                    path="/report"
                    element={
                        <ProtectedRoute role="student">
                            <ReportItem />
                        </ProtectedRoute>
                    }
                />
                <Route path="/reports/:id" element={<ReportDetails />} />
                <Route
                    path="/my-reports"
                    element={
                        <ProtectedRoute role="student">
                            <MyReports />
                        </ProtectedRoute>
                    }
                />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            </Routes>

            <footer>CampusLoop © 2026 | Helping our campus reconnect</footer>
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
