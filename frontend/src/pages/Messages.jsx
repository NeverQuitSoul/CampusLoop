import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";
import { useAuth } from "../context/AuthContext";

function Messages() {
    const { token } = useAuth();
    const [folder, setFolder] = useState("inbox");
    const [inbox, setInbox] = useState([]);
    const [sent, setSent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [replyingId, setReplyingId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    const loadMessages = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const headers = { Authorization: "Bearer " + token };
            const [inboxResponse, sentResponse] = await Promise.all([
                fetch(API_URL + "/api/messages/inbox", { headers }),
                fetch(API_URL + "/api/messages/sent", { headers })
            ]);
            const [inboxData, sentData] = await Promise.all([inboxResponse.json(), sentResponse.json()]);
            if (!inboxResponse.ok) throw new Error(inboxData.message || "Could not load inbox.");
            if (!sentResponse.ok) throw new Error(sentData.message || "Could not load sent messages.");
            setInbox(inboxData);
            setSent(sentData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadMessages(); }, [loadMessages]);

    async function sendReply(event, id) {
        event.preventDefault();
        if (!replyText.trim() || sendingReply) return;
        setSendingReply(true);
        setError("");
        try {
            const response = await fetch(API_URL + "/api/messages/" + id + "/reply", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                body: JSON.stringify({ message: replyText })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not send reply.");
            setReplyText("");
            setReplyingId(null);
            await loadMessages();
        } catch (err) {
            setError(err.message);
        } finally {
            setSendingReply(false);
        }
    }

    async function markRead(id) {
        try {
            const response = await fetch(API_URL + "/api/messages/" + id + "/read", {
                method: "PUT",
                headers: { Authorization: "Bearer " + token }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not update message.");
            setInbox(current => current.map(message => message.id === id ? { ...message, is_read: 1 } : message));
        } catch (err) {
            setError(err.message);
        }
    }

    const messages = folder === "inbox" ? inbox : sent;
    return (
        <main className="messages-page">
            <header className="reports-heading">
                <div><span className="section-eyebrow">CAMPUS COMMUNITY</span><h1>Your <span>Messages</span></h1><p>Communicate privately with students about reported items.</p></div>
                <button className="market-primary-button" onClick={loadMessages}>↻ Refresh</button>
            </header>
            <div className="message-tabs">
                <button className={folder === "inbox" ? "active" : ""} onClick={() => setFolder("inbox")}>Inbox ({inbox.length})</button>
                <button className={folder === "sent" ? "active" : ""} onClick={() => setFolder("sent")}>Sent ({sent.length})</button>
            </div>
            {error && <p className="profile-alert error">{error}</p>}
            {loading ? <p>Loading messages...</p> : messages.length === 0 ? (
                <section className="messages-empty"><span>✉</span><h2>{folder === "inbox" ? "Your inbox is empty" : "No sent messages yet"}</h2><p>Use Contact Reporter on a report to start a conversation.</p><Link to="/reports">Browse reports</Link></section>
            ) : (
                <section className="messages-list">
                    {messages.map(message => <article className={"message-card " + (folder === "inbox" && !message.is_read ? "unread" : "")} key={message.id}>
                        <div className="message-card-top"><strong>{folder === "inbox" ? "From: " + message.sender_name : "To: " + message.recipient_name}</strong><time>{message.created_at ? new Date(message.created_at).toLocaleString() : ""}</time></div>
                        <p className="message-item-label">Regarding: {message.item_name}</p>
                        <p>{message.message}</p>
                        <div className="message-card-actions">
                            <Link to={"/reports/" + message.item_id}>View report</Link>
                            {folder === "inbox" && !message.is_read && <button onClick={() => markRead(message.id)}>Mark as read</button>}
                            {folder === "inbox" && <button onClick={() => { setReplyingId(replyingId === message.id ? null : message.id); setReplyText(""); }}>Reply</button>}
                        </div>
                        {folder === "inbox" && replyingId === message.id && (
                            <form className="message-reply-form" onSubmit={event => sendReply(event, message.id)}>
                                <textarea rows="3" maxLength="1500" value={replyText} onChange={event => setReplyText(event.target.value)} placeholder="Write your reply..." required />
                                <button type="submit" disabled={sendingReply}>{sendingReply ? "Sending..." : "Send Reply"}</button>
                            </form>
                        )}
                    </article>)}
                </section>
            )}
        </main>
    );
}
export default Messages;
