import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api";

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

        return (
            (item.item_name || "").toLowerCase().includes(search) ||
            (item.description || "").toLowerCase().includes(search) ||
            (item.location || "").toLowerCase().includes(search)
        );
    });

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
            <div className="report-placeholder">
                <h2>Loading reports...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="report-placeholder">
                <h2>{error}</h2>

                <button type="button" onClick={loadReports}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="report-placeholder">
            <h1>Browse Reports</h1>

            <p>
                View lost and found items reported on CampusLoop.
            </p>

            {isAdmin && (
                <p className="admin-notice">
                    Administrator mode: You can manage reports.
                </p>
            )}

            <div className="dashboard-stats">
                <div className="stat-card lost-stat">
                    <h2>{lostCount}</h2>
                    <p>Lost Items</p>
                </div>

                <div className="stat-card found-stat">
                    <h2>{foundCount}</h2>
                    <p>Found Items</p>
                </div>

                <div className="stat-card returned-stat">
                    <h2>{returnedCount}</h2>
                    <p>Returned Items</p>
                </div>
            </div>

            <div className="report-tabs">
                <button
                    type="button"
                    className={activeTab === "lost" ? "active" : ""}
                    onClick={() => changeTab("lost")}
                >
                    Lost ({lostCount})
                </button>

                <button
                    type="button"
                    className={activeTab === "found" ? "active" : ""}
                    onClick={() => changeTab("found")}
                >
                    Found ({foundCount})
                </button>

                <button
                    type="button"
                    className={activeTab === "returned" ? "active" : ""}
                    onClick={() => changeTab("returned")}
                >
                    Returned ({returnedCount})
                </button>
            </div>

            <div className="reports-controls">
                <input
                    type="search"
                    className="reports-search"
                    placeholder="Search by item, description or location..."
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                    aria-label="Search reports"
                />

                <select
                    className="reports-filter"
                    value={sortOrder}
                    onChange={event => setSortOrder(event.target.value)}
                    aria-label="Sort reports"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
            </div>

            {actionMessage && (
                <p role="status" className="form-message">
                    {actionMessage}
                </p>
            )}

            <p>
                Showing {sortedItems.length} reports
            </p>

            {sortedItems.length === 0 ? (
                <p>
                    {activeTab === "lost"
                        ? "No lost items have been reported yet."
                        : activeTab === "found"
                        ? "No found items have been reported yet."
                        : "No returned items yet."}
                </p>
            ) : (
                <div className="reports-grid">
                    {sortedItems.map(item => (
                        <div className="report-card" key={item.id}>
                            <span
                                className={`report-badge ${item.report_type}`}
                            >
                                {activeTab === "returned"
                                    ? "Returned"
                                    : item.report_type === "lost"
                                    ? "Lost Item"
                                    : "Found Item"}
                            </span>

                            {item.image_path && (
                                <img
                                    src={`${API_URL}${item.image_path}`}
                                    alt={item.item_name}
                                    className="report-card-image"
                                />
                            )}

                            <h2>{item.item_name}</h2>

                            <p>{item.location}</p>

                            <p>{displayDate(item)}</p>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedItem(item);
                                    setActionMessage("");
                                }}
                            >
                                View Details
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {selectedItem && (
                <div
                    className="campusloop-modal-overlay"
                    onClick={() => {
                        if (!updating) setSelectedItem(null);
                    }}
                >
                    <div
                        className="campusloop-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-modal-title"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="campusloop-modal-header">
                            <h2 id="report-modal-title">
                                {selectedItem.item_name}
                            </h2>

                            <button
                                type="button"
                                className="campusloop-modal-close"
                                disabled={updating}
                                onClick={() => setSelectedItem(null)}
                            >
                                &times;
                            </button>
                        </div>

                        <span
                            className={`report-badge ${selectedItem.report_type}`}
                        >
                            {selectedItem.status === "Resolved"
                                ? "Returned"
                                : selectedItem.report_type === "lost"
                                ? "Lost Item"
                                : "Found Item"}
                        </span>

                        {selectedItem.image_path && (
                            <img
                                src={`${API_URL}${selectedItem.image_path}`}
                                alt={selectedItem.item_name}
                                className="report-modal-image"
                            />
                        )}

                        <div className="campusloop-modal-body">
                            <p>
                                <strong>Description:</strong>{" "}
                                {selectedItem.description || "Not provided"}
                            </p>

                            <p>
                                <strong>Location:</strong>{" "}
                                {selectedItem.location || "Not provided"}
                            </p>

                            <p>
                                <strong>Date:</strong>{" "}
                                {displayDate(selectedItem)}
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                {selectedItem.status === "Resolved"
                                    ? "Returned"
                                    : "Active"}
                            </p>
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
                                    {updating
                                        ? "Updating..."
                                        : "Mark as Returned"}
                                </button>
                            )}

                            {isAdmin && (
                                <button
                                    type="button"
                                    className="delete-report-button"
                                    onClick={deleteReport}
                                    disabled={updating}
                                >
                                    {updating
                                        ? "Please wait..."
                                        : "Delete Report"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BrowseReports;