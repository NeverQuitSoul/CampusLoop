
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

function BrowseReports() {
    const { token, user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [items, setItems] = useState([]);
    const [returnedItems, setReturnedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("lost");
    const [sortOrder, setSortOrder] = useState("newest");
    const [locationFilter, setLocationFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [updating, setUpdating] = useState(false);
    const [actionMessage, setActionMessage] = useState("");

    useEffect(() => {
        loadReports();
    }, []);

    async function loadReports() {
        setLoading(true);

        try {
            const [activeResponse, returnedResponse] = await Promise.all([
                fetch(`${API_URL}/api/items`),
                fetch(`${API_URL}/api/items/completed`)
            ]);

            if (!activeResponse.ok || !returnedResponse.ok) {
                throw new Error("Failed to load reports.");
            }

            const activeData = await activeResponse.json();
            const returnedData = await returnedResponse.json();

            setItems(
                activeData.filter(item => item.status !== "Resolved")
            );

            setReturnedItems(returnedData);
            setError("");
        } catch (err) {
            setError("Could not load reports. Please check the backend.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!selectedItem) return;

        function handleKeyDown(event) {
            if (event.key === "Escape" && !updating) {
                setSelectedItem(null);
                setActionMessage("");
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedItem, updating]);

    async function markAsReturned() {
        if (!selectedItem || updating || !isAdmin) return;

        const confirmed = window.confirm(
            `Has "${selectedItem.item_name}" been returned or received?`
        );

        if (!confirmed) return;

        setUpdating(true);
        setActionMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/items/${selectedItem.id}/resolve`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not update report.");
            }

            const updatedItem = {
                ...selectedItem,
                status: "Resolved"
            };

            setItems(currentItems =>
                currentItems.filter(item => item.id !== selectedItem.id)
            );

            setReturnedItems(currentItems => [
                updatedItem,
                ...currentItems
            ]);

            setSelectedItem(null);
            setActionMessage("Item successfully moved to Returned!");

        } catch (err) {
            setActionMessage(err.message || "Failed to update report.");
        } finally {
            setUpdating(false);
        }
    }

    async function deleteReport() {
        if (!selectedItem || updating || !isAdmin) return;

        const confirmed = window.confirm(
            `Are you sure you want to permanently delete "${selectedItem.item_name}"?`
        );

        if (!confirmed) return;

        setUpdating(true);
        setActionMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/items/${selectedItem.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not delete report.");
            }

            setItems(currentItems =>
                currentItems.filter(item => item.id !== selectedItem.id)
            );

            setReturnedItems(currentItems =>
                currentItems.filter(item => item.id !== selectedItem.id)
            );

            setSelectedItem(null);
            setActionMessage("Report deleted successfully!");

        } catch (err) {
            setActionMessage(err.message || "Failed to delete report.");
        } finally {
            setUpdating(false);
        }
    }

    const lostCount = items.filter(
        item => item.report_type === "lost"
    ).length;

    const foundCount = items.filter(
        item => item.report_type === "found"
    ).length;

    const returnedCount = returnedItems.length;

    const currentItems =
        activeTab === "returned"
            ? returnedItems
            : items.filter(item => item.report_type === activeTab);

    const filteredItems = currentItems.filter(item => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch = !search || (
            String(item.item_name || "").toLowerCase().includes(search) ||
            String(item.description || "").toLowerCase().includes(search) ||
            String(item.location || "").toLowerCase().includes(search)
        );
        const matchesLocation = locationFilter === "all" || String(item.location || "").toLowerCase() === locationFilter;
        const reportDate = new Date(item.item_date || item.created_at || item.date);
        const daysOld = Number.isNaN(reportDate.getTime()) ? Infinity : (Date.now() - reportDate.getTime()) / 86400000;
        const matchesDate = dateFilter === "all" ||
            (dateFilter === "today" && daysOld < 1) ||
            (dateFilter === "week" && daysOld <= 7) ||
            (dateFilter === "month" && daysOld <= 30);
        return matchesSearch && matchesLocation && matchesDate;
    });

    const availableLocations = [...new Set(currentItems.map(item => String(item.location || "").trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b));

    const sortedItems = [...filteredItems].sort((a, b) => {
        const dateA = new Date(
            a.created_at || a.date || a.item_date || 0
        );

        const dateB = new Date(
            b.created_at || b.date || b.item_date || 0
        );

        return sortOrder === "newest"
            ? dateB - dateA
            : dateA - dateB;
    });

    function changeTab(tab) {
        setActiveTab(tab);
        setSearchTerm("");
        setSelectedItem(null);
        setActionMessage("");
    }

    function displayDate(item) {
        const reportDate = item.item_date || item.date;

        if (!reportDate) return "Not provided";

        const dateString = String(reportDate).slice(0, 10);
        const [year, month, day] = dateString.split("-");

        if (!year || !month || !day) return dateString;

        return `${day}-${month}-${year}`;
    }

    if (loading) {
        return (
            <div className="reports-page">
                <div className="reports-loading">
                    <div className="loading-symbol">↻</div>
                    <h2>Finding campus reports...</h2>
                    <p>Just a moment while we load the latest updates.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="reports-page">
                <div className="reports-loading">
                    <div className="empty-icon">!</div>
                    <h2>Something went wrong</h2>
                    <p>{error}</p>
                    <button
                        type="button"
                        className="market-primary-button"
                        onClick={loadReports}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="reports-page">
            <section className="reports-heading">
                <div>
                    <span className="section-eyebrow">
                        CAMPUS COMMUNITY MARKETPLACE
                    </span>

                    <h1>
                        Find what’s <span>yours.</span>
                    </h1>

                    <p>
                        Browse lost and found belongings shared by your
                        campus community.
                    </p>
                </div>

                <div className="reports-heading-icon">
                    <span>⌕</span>
                    <small>Search. Connect. Reunite.</small>
                </div>
            </section>

            {isAdmin && (
                <div className="admin-notice">
                    <span>⚙</span>
                    Administrator mode is active. You can manage campus reports.
                </div>
            )}

            <section className="dashboard-stats">
                <div className="stat-card lost-stat">
                    <div className="stat-icon">⌕</div>
                    <div>
                        <p>Lost items</p>
                        <h2>{lostCount}</h2>
                        <span>Waiting to be found</span>
                    </div>
                </div>

                <div className="stat-card found-stat">
                    <div className="stat-icon">✦</div>
                    <div>
                        <p>Found items</p>
                        <h2>{foundCount}</h2>
                        <span>Reported by students</span>
                    </div>
                </div>

                <div className="stat-card returned-stat">
                    <div className="stat-icon">✓</div>
                    <div>
                        <p>Returned items</p>
                        <h2>{returnedCount}</h2>
                        <span>Successfully reunited</span>
                    </div>
                </div>
            </section>

            <section className="marketplace-section">
                <div className="marketplace-topline">
                    <div>
                        <span className="section-eyebrow">EXPLORE THE MARKETPLACE</span>
                        <h2>Campus belongings</h2>
                    </div>

                    <span className="report-total">
                        {sortedItems.length} results
                    </span>
                </div>

                <div className="marketplace-toolbar">
                    <div className="report-tabs">
                        <button
                            type="button"
                            className={activeTab === "lost" ? "active" : ""}
                            onClick={() => changeTab("lost")}
                        >
                            <span>⌕</span> Lost
                            <span className="tab-count">{lostCount}</span>
                        </button>

                        <button
                            type="button"
                            className={activeTab === "found" ? "active" : ""}
                            onClick={() => changeTab("found")}
                        >
                            <span>✦</span> Found
                            <span className="tab-count">{foundCount}</span>
                        </button>

                        <button
                            type="button"
                            className={activeTab === "returned" ? "active" : ""}
                            onClick={() => changeTab("returned")}
                        >
                            <span>✓</span> Returned
                            <span className="tab-count">{returnedCount}</span>
                        </button>
                    </div>

                    <div className="reports-controls">
                        <div className="search-wrapper">
                            <span>⌕</span>
                            <input
                                type="search"
                                className="reports-search"
                                placeholder="Search items or locations..."
                                value={searchTerm}
                                onChange={event => setSearchTerm(event.target.value)}
                                aria-label="Search reports"
                            />
                        </div>

                        <select
                            className="reports-filter"
                            value={sortOrder}
                            onChange={event => setSortOrder(event.target.value)}
                            aria-label="Sort reports"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                        </select>
                        <select className="reports-filter" value={locationFilter} onChange={event => setLocationFilter(event.target.value)} aria-label="Filter by location">
                            <option value="all">All locations</option>
                            {availableLocations.map(location => <option key={location} value={location.toLowerCase()}>{location}</option>)}
                        </select>
                        <select className="reports-filter" value={dateFilter} onChange={event => setDateFilter(event.target.value)} aria-label="Filter by report date">
                            <option value="all">Any date</option><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option>
                        </select>
                    </div>
                </div>

                {actionMessage && (
                    <p role="status" className="form-message">
                        {actionMessage}
                    </p>
                )}

                {sortedItems.length === 0 ? (
                    <div className="marketplace-empty">
                        <div className="empty-icon">⌕</div>
                        <h3>
                            {searchTerm
                                ? "No matching items found"
                                : activeTab === "lost"
                                ? "No lost items yet"
                                : activeTab === "found"
                                ? "No found items yet"
                                : "No returned items yet"}
                        </h3>
                        <p>
                            {searchTerm
                                ? "Try another item name, description or location."
                                : "New reports shared by students will appear here."}
                        </p>
                        {searchTerm && (
                            <button
                                type="button"
                                className="market-secondary-button"
                                onClick={() => setSearchTerm("")}
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="reports-grid marketplace-grid">
                        {sortedItems.map(item => (
                            <article className="report-card marketplace-card" key={item.id}>
                                <div className="marketplace-image-wrap">
                                    {item.image_path ? (
                                        <ImagePreview src={getImageUrl(item.image_path)} alt={item.item_name} className="report-card-image" />
                                    ) : (
                                        <div className="report-image-placeholder">
                                            <span>▧</span>
                                            <small>No image available</small>
                                        </div>
                                    )}

                                    <span
                                        className={`report-badge ${item.status === "Resolved" ? "returned" : item.report_type}`}
                                    >
                                        {item.status === "Resolved"
                                            ? "✓ Returned"
                                            : item.report_type === "lost"
                                            ? "⌕ Lost item"
                                            : "✦ Found item"}
                                    </span>
                                </div>

                                <div className="marketplace-card-content">
                                    <div className="marketplace-card-meta">
                                        <span>📍 {item.location || "Location not provided"}</span>
                                        <span>{displayDate(item)}</span>
                                    </div>

                                    <h2>{item.item_name}</h2>

                                    <p className="marketplace-description">
                                        {item.description || "No description provided."}
                                    </p>

                                    <div className="marketplace-card-actions">
                                        <Link to={`/reports/${item.id}`} className="market-view-button market-view-link">
                                            View Details <span>↗</span>
                                        </Link>
                                        <button
                                            type="button"
                                            className="market-view-button market-view-secondary"
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setActionMessage("");
                                            }}
                                        >
                                            Quick View
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {selectedItem && (
                <div
                    className="campusloop-modal-overlay"
                    onClick={() => {
                        if (!updating) setSelectedItem(null);
                    }}
                >
                    <div
                        className="campusloop-modal marketplace-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-modal-title"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="campusloop-modal-header">
                            <div>
                                <span className="section-eyebrow">REPORT DETAILS</span>
                                <h2 id="report-modal-title">
                                    {selectedItem.item_name}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="campusloop-modal-close"
                                disabled={updating}
                                onClick={() => setSelectedItem(null)}
                                aria-label="Close details"
                            >
                                &times;
                            </button>
                        </div>

                        <span
                            className={`report-badge ${selectedItem.status === "Resolved" ? "returned" : selectedItem.report_type}`}
                        >
                            {selectedItem.status === "Resolved"
                                ? "✓ Returned"
                                : selectedItem.report_type === "lost"
                                ? "⌕ Lost item"
                                : "✦ Found item"}
                        </span>

                        {selectedItem.image_path && (
                            <img
                                src={getImageUrl(selectedItem.image_path)}
                                alt={selectedItem.item_name}
                                className="report-modal-image"
                                onError={event => {
                                    event.currentTarget.style.display = "none";
                                }}
                            />
                        )}

                        <div className="campusloop-modal-body">
                            <div className="detail-info-row">
                                <span>DESCRIPTION</span>
                                <p>{selectedItem.description || "Not provided"}</p>
                            </div>

                            <div className="detail-info-row">
                                <span>LOCATION</span>
                                <p>{selectedItem.location || "Not provided"}</p>
                            </div>

                            <div className="detail-info-row">
                                <span>DATE</span>
                                <p>{displayDate(selectedItem)}</p>
                            </div>

                            <div className="detail-info-row">
                                <span>STATUS</span>
                                <p>
                                    {selectedItem.status === "Resolved"
                                        ? "Returned"
                                        : "Active"}
                                </p>
                            </div>
                        </div>

                        <div className="campusloop-modal-footer">
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                                disabled={updating}
                            >
                                Close
                            </button>

                            {isAdmin && selectedItem.status !== "Resolved" && (
                                <button
                                    type="button"
                                    onClick={markAsReturned}
                                    disabled={updating}
                                >
                                    {updating ? "Updating..." : "✓ Mark as Returned"}
                                </button>
                            )}

                            {isAdmin && (
                                <button
                                    type="button"
                                    className="delete-report-button"
                                    onClick={deleteReport}
                                    disabled={updating}
                                >
                                    {updating ? "Please wait..." : "Delete Report"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default BrowseReports;
