import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import { useAuth } from "../context/AuthContext";

function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/auth/admin-login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Administrator login failed."
                );
            }

            login(data.token, data.user);
            navigate("/reports");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Administrator Login</h1>

                <p>Authorized CampusLoop administrators only.</p>

                <form onSubmit={handleSubmit}>
                    <label>Administrator Email</label>

                    <input
                        type="email"
                        placeholder="Enter administrator email"
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        required
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Enter administrator password"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Admin Login"}
                    </button>
                </form>

                {message && (
                    <p className="form-message">{message}</p>
                )}

                <p>
                    <Link to="/login">Back to Student Login</Link>
                </p>
            </div>
        </div>
    );
}

export default AdminLogin;