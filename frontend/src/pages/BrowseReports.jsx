
import { useEffect, useState } from "react";

function BrowseReports() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");

    useEffect(() => {
        fetch("http://localhost:5000/api/items")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load reports.");
                }
                return response.json();
            })
            .then((data) => {
                setItems(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Could not load reports. Please check the backend.");
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!selectedItem) return;

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setSelectedItem(null);
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedItem]);

    const filteredItems = items.filter((item) => {
        const matchesSearch =
            (item.item_name || "")
                .toLowerCase()
                .includes(searchTerm.trim().toLowerCase()) ||
            (item.description || "")
                .toLowerCase()
                .includes(searchTerm.trim().toLowerCase()) ||
            (item.location || "")
                .toLowerCase()
                .includes(searchTerm.trim().toLowerCase());

        const matchesType =
            filterType === "all" || item.report_type === filterType;

        return matchesSearch && matchesType;
    });

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
            </div>
        );
    }

    return (
        <div className="report-placeholder">
            <h1>Browse Reports</h1>
            <p>View lost and found items reported on CampusLoop.</p>

            <div className="reports-controls">
                <input
                    type="search"
                    className="reports-search"
                    placeholder="Search by item, description or location..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label="Search reports"
                />

                <select
                    className="reports-filter"
                    value={filterType}
                    onChange={(event) => setFilterType(event.target.value)}
                    aria-label="Filter reports by type"
                >
                    <option value="all">All Reports</option>
                    <option value="lost">Lost Items</option>
                    <option value="found">Found Items</option>
                </select>
            </div>

            <p>
                Showing {filteredItems.length} of {items.length} reports
            </p>

            {filteredItems.length === 0 ? (
                <p>No matching reports found. Try another search or filter.</p>
            ) : (
                <div className="reports-grid">
                    {filteredItems.map((item) => (
                        <div className="report-card" key={item.id}>
                            <span
                                className={`report-badge ${item.report_type}`}
                            >
                                {item.report_type === "lost"
                                    ? "Lost Item"
                                    : "Found Item"}
                            </span>

                            <h2>{item.item_name}</h2>

                            <button
                                type="button"
                                onClick={() => setSelectedItem(item)}
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
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="campusloop-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-modal-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="campusloop-modal-header">
                            <h2 id="report-modal-title">
                                {selectedItem.item_name}
                            </h2>

                            <button
                                type="button"
                                className="campusloop-modal-close"
                                aria-label="Close details"
                                onClick={() => setSelectedItem(null)}
                            >
                                &times;
                            </button>
                        </div>

                        <span
                            className={`report-badge ${selectedItem.report_type}`}
                        >
                            {selectedItem.report_type === "lost"
                                ? "Lost Item"
                                : "Found Item"}
                        </span>

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
                                {selectedItem.item_date
                                    ? String(selectedItem.item_date).slice(0, 10)
                                    : "Not provided"}
                            </p>

                            <p>
                                <strong>Contact:</strong>{" "}
                                {selectedItem.contact || "Not provided"}
                            </p>
                        </div>

                        <div className="campusloop-modal-footer">
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BrowseReports;
