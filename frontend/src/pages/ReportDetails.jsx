
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_URL } from "../api";

function ReportDetails() {
    const { id } = useParams();

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
                    <img
                        className="report-details-image"
                        src={`${API_URL}${item.image_path}`}
                        alt={item.item_name}
                    />
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
                        {item.status === "Resolved" ? "Returned" : "Active"}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ReportDetails;
