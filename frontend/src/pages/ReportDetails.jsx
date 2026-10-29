
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function ReportDetails() {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:5000/api/items/${id}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Report not found.");
                }
                return response.json();
            })
            .then((data) => {
                setItem(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Could not load this report.");
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="report-placeholder"><h2>Loading...</h2></div>;
    if (error) return <div className="report-placeholder"><h2>{error}</h2><Link to="/reports">Back to Reports</Link></div>;

    return (
        <div className="report-placeholder">
            <h1>Report Details</h1>
            <div className="report-card">
                <h2>{item.item_name}</h2>
                <p><strong>Type:</strong> {item.report_type}</p>
                <p><strong>Description:</strong> {item.description}</p>
                <p><strong>Location:</strong> {item.location}</p>
                <p><strong>Date:</strong> {String(item.item_date).slice(0, 10)}</p>
                <p><strong>Contact:</strong> {item.contact}</p>
            </div>
            <p><Link to="/reports">← Back to Reports</Link></p>
        </div>
    );
}

export default ReportDetails;
