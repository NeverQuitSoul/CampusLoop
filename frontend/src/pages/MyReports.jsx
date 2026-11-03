import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api";

function getImageUrl(imagePath) {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}${imagePath}`;
}

function formatDate(value) {
    if (!value) return "Not available";

    const datePart = String(value).slice(0, 10);
    const parts = datePart.split("-");
    if (parts.length !== 3) return datePart;

    const [year, month, day] = parts;
    if (!year || !month || !day) return datePart;
    return `${day}-${month}-${year}`;
}

function getStatusLabel(status) {
    if (status === "Resolved") return "Returned";
    if (status === "Expired") return "Expired";
    return "Active";
}

function MyReports() {
    const { token } = useAuth();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [renewingId, setRenewingId] = useState(null);

    const loadReports = useCallback(async () => {
        if (!token) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/api/items/mine`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not load your reports.");
            }

            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Could not load your reports.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const activeCount = items.filter(item => item.status === "Active").length;
    const expiredCount = items.filter(item => item.status === "Expired").length;
    const returnedCount = items.filter(item => item.status === "Resolved").length;

    const filteredItems = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return items.filter(item => {
            const matchesFilter =
                activeFilter === "all" ||
                (activeFilter === "active" && item.status === "Active") ||
                (activeFilter === "expired" && item.status === "Expired") ||
                (activeFilter === "returned" && item.status === "Resolved");

            const matchesSearch =
                !search ||
                (item.item_name || "").toLowerCase().includes(search) ||
                (item.description || "").toLowerCase().includes(search) ||
                (item.location || "").toLowerCase().includes(search);

            return matchesFilter && matchesSearch;
        });
    }, [items, activeFilter, searchTerm]);

    function changeFilter(filter) {
        setActiveFilter(filter);
        setSearchTerm("");
        setMessage("");
    }

    async function renewReport(item) {
        if (renewingId !== null || item.status !== "Expired") return;

        const confirmed = window.confirm(
            `Renew "${item.item_name}" for another 90 days?`
        );
        if (!confirmed) return;

        setRenewingId(item.id);
        setMessage("");
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/api/items/${item.id}/renew`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not renew this report.");
            }

            await loadReports();
            setMessage(data.message || "Your report has been renewed for 90 days.");
        } catch (err) {
            setError(err.message || "Could not renew this report.");
        } finally {
            setRenewingId(null);
        }
    }

    if (loading) {
        return (
            <main className="my-reports-page">
                <div className="my-reports-loading">
                    <div className="my-reports-loading-symbol">↻</div>
                    <h2>Loading your reports...</h2>
                    <p>Getting the latest updates from your CampusLoop account.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="my-reports-page">
            <section className="my-reports-heading">
                <div>
                    <span className="my-reports-eyebrow">YOUR CAMPUSLOOP ACTIVITY</span>
                    <h1>My <span>Reports</span></h1>
                    <p>
                        Keep track of the items you have reported and their current status.
                    </p>
                </div>
                <div className="my-reports-heading-sticker" aria-hidden="true">
                    <span>▤</span>
                    <small>My campus notes</small>
                </div>
            </section>

            <section className="my-reports-stats">
                <div className="my-report-stat stat-all">
                    <span className="my-report-stat-icon">▤</span>
                    <div><p>Total reports</p><strong>{items.length}</strong></div>
                </div>
                <div className="my-report-stat stat-active">
                    <span className="my-report-stat-icon">◷</span>
                    <div><p>Active</p><strong>{activeCount}</strong></div>
                </div>
                <div className="my-report-stat stat-expired">
                    <span className="my-report-stat-icon">⌛</span>
                    <div><p>Expired</p><strong>{expiredCount}</strong></div>
                </div>
                <div className="my-report-stat stat-returned">
                    <span className="my-report-stat-icon">✓</span>
                    <div><p>Returned</p><strong>{returnedCount}</strong></div>
                </div>
            </section>

            <section className="my-reports-list-section">
                <div className="my-reports-list-heading">
                    <div>
                        <span className="my-reports-eyebrow">YOUR SUBMISSIONS</span>
                        <h2>All your reports</h2>
                    </div>
                    <span className="my-reports-result-count">
                        {filteredItems.length} shown
                    </span>
                </div>

                <div className="my-reports-toolbar">
                    <div className="my-reports-tabs">
                        <button type="button" className={activeFilter === "all" ? "active" : ""} onClick={() => changeFilter("all")}>
                            All <span>{items.length}</span>
                        </button>
                        <button type="button" className={activeFilter === "active" ? "active" : ""} onClick={() => changeFilter("active")}>
                            Active <span>{activeCount}</span>
                        </button>
                        <button type="button" className={activeFilter === "expired" ? "active" : ""} onClick={() => changeFilter("expired")}>
                            Expired <span>{expiredCount}</span>
                        </button>
                        <button type="button" className={activeFilter === "returned" ? "active" : ""} onClick={() => changeFilter("returned")}>
                            Returned <span>{returnedCount}</span>
                        </button>
                    </div>

                    <input
                        type="search"
                        className="my-reports-search"
                        placeholder="Search your reports..."
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        aria-label="Search your reports"
                    />
                </div>

                {message && <p className="my-reports-message" role="status">{message}</p>}

                {error && (
                    <div className="my-reports-error" role="alert">
                        <p>{error}</p>
                        <button type="button" onClick={loadReports}>Try Again</button>
                    </div>
                )}

                {!error && filteredItems.length === 0 && (
                    <div className="my-reports-empty">
                        <div className="my-reports-empty-icon">▤</div>
                        <h3>
                            {items.length === 0
                                ? "You haven't submitted any reports yet"
                                : searchTerm
                                ? "No matching reports found"
                                : "No reports in this section"}
                        </h3>
                        <p>
                            {items.length === 0
                                ? "When you report a lost or found item, it will appear here."
                                : "Try another filter or search term."}
                        </p>
                        {items.length === 0 && (
                            <Link to="/report" className="my-reports-submit-link">Report an Item</Link>
                        )}
                    </div>
                )}

                {!error && filteredItems.length > 0 && (
                    <div className="my-reports-grid">
                        {filteredItems.map(item => {
                            const statusLabel = getStatusLabel(item.status);

                            return (
                                <article className="my-report-card" key={item.id}>
                                    <div className="my-report-image-wrap">
                                        {item.image_path ? (
                                            <img
                                                src={getImageUrl(item.image_path)}
                                                alt={item.item_name}
                                                className="my-report-image"
                                                onError={event => { event.currentTarget.style.display = "none"; }}
                                            />
                                        ) : (
                                            <div className="my-report-image-placeholder">
                                                <span>▧</span>
                                                <small>No image available</small>
                                            </div>
                                        )}
                                        <span className={`my-report-status status-${String(item.status || "Active").toLowerCase()}`}>
                                            {statusLabel}
                                        </span>
                                    </div>

                                    <div className="my-report-card-content">
                                        <div className="my-report-card-meta">
                                            <span>{item.report_type === "lost" ? "⌕ Lost item" : "✦ Found item"}</span>
                                            <span>{formatDate(item.item_date || item.created_at)}</span>
                                        </div>
                                        <h3>{item.item_name}</h3>
                                        <p className="my-report-description">
                                            {item.description || "No description provided."}
                                        </p>
                                        <p className="my-report-location">
                                            <span>📍</span>
                                            {item.location || "Location not provided"}
                                        </p>
                                        <div className="my-report-expiry">
                                            <span>EXPIRY DATE</span>
                                            <strong>{formatDate(item.expires_at)}</strong>
                                        </div>

                                        {item.status === "Expired" && (
                                            <button
                                                type="button"
                                                className="my-report-renew-button"
                                                onClick={() => renewReport(item)}
                                                disabled={renewingId !== null}
                                            >
                                                {renewingId === item.id ? "Renewing..." : "↻ Renew for 90 Days"}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}

export default MyReports;
