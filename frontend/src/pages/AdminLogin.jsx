import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import { useAuth } from "../context/AuthContext";

function PasswordEye({ visible }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {!visible && <path d="m3 3 18 18" />}
        </svg>
    );
}

function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
            navigate("/admin/dashboard");
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

                    <div className="password-field">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter administrator password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            required
                            
                        >
                            <PasswordEye visible={showPassword} />
                        </button>
                    </div>

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