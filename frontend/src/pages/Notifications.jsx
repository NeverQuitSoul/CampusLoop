import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";
import { useAuth } from "../context/AuthContext";

function Notifications() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadNotifications = useCallback(async () => {
        try {
            const response = await fetch(API_URL + "/api/notifications", {
                headers: { Authorization: "Bearer " + token }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not load notifications.");
            setNotifications(data);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadNotifications(); }, [loadNotifications]);

    async function markRead(id) {
        try {
            const response = await fetch(API_URL + "/api/notifications/" + id + "/read", {
                method: "PUT",
                headers: { Authorization: "Bearer " + token }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not update notification.");
            setNotifications(current => current.map(item => item.id === id ? { ...item, is_read: 1 } : item));
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <main className="notifications-page">
            <div className="reports-heading">
                <div><span className="section-eyebrow">CAMPUSLOOP UPDATES</span><h1>Your <span>Notifications</span></h1><p>Updates about your reports and possible item matches.</p></div>
                <button className="market-primary-button" onClick={loadNotifications}>↻ Refresh</button>
            </div>
            {error && <p className="form-message">{error}</p>}
            {loading ? <p>Loading notifications...</p> : notifications.length === 0 ? (
                <section className="notifications-empty"><span>✉</span><h2>You’re all caught up</h2><p>When a possible match is found or an administrator updates your report, it will appear here.</p><Link to="/reports">Browse reports</Link></section>
            ) : (
                <section className="notifications-list">
                    {notifications.map(notice => <article className={"notification-card " + (notice.is_read ? "is-read" : "is-unread")} key={notice.id}>
                        <div className="notification-symbol">{notice.title.toLowerCase().includes("match") ? "✦" : "✓"}</div>
                        <div className="notification-copy"><h2>{notice.title}</h2><p>{notice.message}</p><small>{notice.created_at ? new Date(notice.created_at).toLocaleString() : ""}</small>
                            {notice.item_id && <Link to={"/reports/" + notice.item_id}>View related report ↗</Link>}
                        </div>
                        {!notice.is_read && <button onClick={() => markRead(notice.id)}>Mark as read</button>}
                    </article>)}
                </section>
            )}
        </main>
    );
}
export default Notifications;
