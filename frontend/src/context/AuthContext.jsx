import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import { API_URL } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(
        localStorage.getItem("campusloop_token")
    );

    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        async function verifyLogin() {
            if (!token) {
                setUser(null);
                setAuthLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error("Session expired.");
                }

                setUser(data.user);
            } catch (error) {
                localStorage.removeItem("campusloop_token");
                setToken(null);
                setUser(null);
            } finally {
                setAuthLoading(false);
            }
        }

        verifyLogin();
    }, [token]);

    function login(loginToken, loginUser) {
        localStorage.setItem("campusloop_token", loginToken);
        setToken(loginToken);
        setUser(loginUser);
    }

    function logout() {
        localStorage.removeItem("campusloop_token");
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                authLoading,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}