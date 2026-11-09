import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import { useAuth } from "../context/AuthContext";

function Login() {
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
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            login(data.token, data.user);
            navigate("/");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Student Login</h1>

                <p>Login to your CampusLoop account.</p>

                <form onSubmit={handleSubmit}>
                    <label>College Email</label>

                    <input
                        type="email"
                        placeholder="Enter your college email"
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        required
                    />

                    <label>Password</label>

                    <div style={{ position: "relative" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            required
                            style={{ paddingRight: "65px" }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(value => !value)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                border: "none",
                                background: "transparent",
                                padding: "4px",
                                cursor: "pointer",
                                color: "inherit",
                                fontSize: "13px"
                            }}
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                {message && (
                    <p className="form-message">{message}</p>
                )}

                <p>
                    Don't have an account?{" "}
                    <Link to="/register">Register</Link>
                </p>

                <p>
                    Administrator?{" "}
                    <Link to="/admin/login">Admin Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;