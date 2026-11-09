import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../api";

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

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");

        if (formData.password !== formData.confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            alert("Account created successfully! Please log in.");
            navigate("/login");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }

    const visibilityButtonStyle = {
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        border: "none",
        background: "transparent",
        padding: "4px",
        cursor: "pointer",
        color: "inherit",
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Student Registration</h1>

                <p>Create your CampusLoop student account.</p>

                <form onSubmit={handleSubmit}>
                    <label>Full Name</label>

                    <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

                    <label>College Email</label>

                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your college email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <small>Use your @nbkrist.org email address.</small>

                    <label>Password</label>

                    <div style={{ position: "relative" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            minLength="8"
                            required
                            style={{ paddingRight: "44px" }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(value => !value)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            style={visibilityButtonStyle}
                        >
                            <PasswordEye visible={showPassword} />
                        </button>
                    </div>

                    <label>Confirm Password</label>

                    <div style={{ position: "relative" }}>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Enter password again"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            minLength="8"
                            required
                            style={{ paddingRight: "65px" }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(value => !value)}
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            style={visibilityButtonStyle}
                        >
                            <PasswordEye visible={showConfirmPassword} />
                        </button>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating Account..." : "Register"}
                    </button>
                </form>

                {message && (
                    <p className="form-message">{message}</p>
                )}

                <p>
                    Already have an account?{" "}
                    <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;