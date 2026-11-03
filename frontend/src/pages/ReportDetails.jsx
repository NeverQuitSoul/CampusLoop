
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api";
import ImagePreview from "../components/ImagePreview";

function getImageUrl(imagePath) {
    if (!imagePath) return "";

    if (imagePath.startsWith("http")) {
        return imagePath;
    }

    return `${API_URL}${imagePath}`;
}

function ReportDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [actionMessage, setActionMessage] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);
    const [contactMessage, setContactMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDetails() {
            try {
                const response = await fetch(`${API_URL}/api/items/${id}`);
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Could not load report."
                    );
                }

                setItem(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadDetails();
    }, [id]);

    async function handleAdminAction(action) {
        if (!item || !isAdmin || actionLoading) return;
        const label = action === "return" ? "mark this item as returned" : "permanently delete this report";
        if (!window.confirm("Are you sure you want to " + label + "?")) return;

        setActionLoading(true);
        setActionMessage("");
        try {
            const response = await fetch(
                action === "return"
                    ? API_URL + "/api/items/" + id + "/resolve"
                    : API_URL + "/api/items/" + id,
                {
                    method: action === "return" ? "PUT" : "DELETE",
                    headers: { Authorization: "Bearer " + token }
                }
            );
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Could not update this report.");
            if (action === "delete") {
                navigate("/reports", { replace: true });
                return;
            }
            setItem(current => ({ ...current, status: "Resolved" }));
            setActionMessage(result.message || "Item marked as returned.");
        } catch (err) {
            setActionMessage(err.message);
        } finally {
            setActionLoading(false);
        }
    }

    async function sendReporterMessage(event) {
        event.preventDefault();
        if (!token || !item || sendingMessage) return;
        setSendingMessage(true);
        setActionMessage("");
        try {
            const response = await fetch(API_URL + "/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                body: JSON.stringify({ itemId: item.id, message: contactMessage })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Could not send your message.");
            setContactMessage("");
            setContactOpen(false);
            setActionMessage("Message sent. You can follow replies from the Messages page.");
        } catch (err) {
            setActionMessage(err.message);
        } finally {
            setSendingMessage(false);
        }
    }

    function displayDate(dateValue) {
        if (!dateValue) return "Not provided";

        const dateString = String(dateValue).slice(0, 10);
        const [year, month, day] = dateString.split("-");

        if (!year || !month || !day) return dateString;

        return `${day}-${month}-${year}`;
    }

    if (loading) {
        return <div className="report-placeholder">Loading report...</div>;
    }

    if (error || !item) {
        return (
            <div className="report-placeholder">
                <h2>Report not found</h2>
                <p>{error}</p>
                <Link to="/reports">Back to Browse Reports</Link>
            </div>
        );
    }

    return (
        <div className="report-details-page">
            <Link to="/reports" className="back-link">
                ← Back to Browse Reports
            </Link>

            <div className="report-details-card">
                {item.image_path && (
                    <ImagePreview className="report-details-image" src={getImageUrl(item.image_path)} alt={item.item_name} />
                )}

                <div className="report-details-content">
                    <span className={`report-badge ${item.report_type}`}>
                        {item.report_type === "lost"
                            ? "Lost Item"
                            : "Found Item"}
                    </span>

                    <h1>{item.item_name}</h1>

                    <p>
                        <strong>Description:</strong>{" "}
                        {item.description || "Not provided"}
                    </p>

                    <p>
                        <strong>Location:</strong>{" "}
                        {item.location || "Not provided"}
                    </p>

                    <p>
                        <strong>Date:</strong>{" "}
                        {displayDate(item.item_date || item.date)}
                    </p>

                    <p>
                        <strong>Contact:</strong>{" "}
                        {item.contact || "Not provided"}
                    </p>

                    <p>
                        <strong>Status:</strong>{" "}
                        {item.status === "Resolved" ? "Returned" : item.status === "Expired" ? "Expired" : "Active"}
                    </p>

                    <section className="report-tracking">
                        <h2>Report progress</h2>
                        <div className="tracking-step complete"><span>✓</span><div><strong>Report submitted</strong><small>{displayDate(item.created_at)}</small></div></div>
                        <div className={"tracking-step " + (item.status === "Active" ? "current" : "complete")}><span>{item.status === "Active" ? "●" : "✓"}</span><div><strong>Visible to campus</strong><small>{item.status === "Active" ? "Students can contact the reporter." : "This report is no longer active."}</small></div></div>
                        <div className={"tracking-step " + (item.status === "Resolved" || item.status === "Expired" ? "complete" : "pending")}><span>{item.status === "Resolved" ? "✓" : item.status === "Expired" ? "⌛" : "○"}</span><div><strong>{item.status === "Resolved" ? "Marked as returned" : item.status === "Expired" ? "Report expired" : "Awaiting an update"}</strong><small>{item.status === "Expired" ? "The report has reached its expiry date." : item.status === "Resolved" ? "The item has been marked as returned." : "The report remains open."}</small></div></div>
                    </section>

                    {user?.role === "student" && item.status !== "Expired" && (
                        <div className="report-contact-actions">
                            <button type="button" className="market-primary-button" onClick={() => setContactOpen(value => !value)}>✉ Contact Reporter</button>
                            <Link to="/messages" className="report-messages-link">Open Messages</Link>
                        </div>
                    )}
                    {!user && item.status !== "Expired" && <p className="report-login-contact"><Link to="/login">Log in</Link> as a student to contact the reporter.</p>}
                    {contactOpen && (
                        <form className="contact-reporter-form" onSubmit={sendReporterMessage}>
                            <label htmlFor="reporter-message">Your message to the reporter</label>
                            <textarea id="reporter-message" rows="4" minLength="2" maxLength="1500" value={contactMessage} onChange={event => setContactMessage(event.target.value)} placeholder="Introduce yourself and explain why you're contacting them..." required />
                            <small>Your message is sent privately. Your email address is not displayed publicly.</small>
                            <div><button type="button" onClick={() => setContactOpen(false)}>Cancel</button><button type="submit" disabled={sendingMessage}>{sendingMessage ? "Sending..." : "Send Message"}</button></div>
                        </form>
                    )}
                    {actionMessage && <p className="form-message" role="status">{actionMessage}</p>}

                    {isAdmin && (
                        <div className="report-details-admin-actions">
                            {item.status !== "Resolved" && (
                                <button type="button" className="market-primary-button" disabled={actionLoading} onClick={() => handleAdminAction("return")}>
                                    {actionLoading ? "Please wait..." : "✓ Mark as Returned"}
                                </button>
                            )}
                            <button type="button" className="admin-detail-delete" disabled={actionLoading} onClick={() => handleAdminAction("delete")}>
                                Delete Report
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ReportDetails;
