import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";
import { useAuth } from "../context/AuthContext";

function AdminDashboard() {
    const { token } = useAuth();
    const [data, setData] = useState({ stats: {}, users: [], reports: [] });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/overview`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Could not load dashboard.");
            setData(result);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    async function updateReport(id, action) {
        const label = action === "resolve" ? "mark this item as returned" : "delete this report";
        if (!window.confirm(`Are you sure you want to ${label}?`)) return;
        try {
            const response = await fetch(`${API_URL}/api/items/${id}${action === "resolve" ? "/resolve" : ""}`, {
                method: action === "resolve" ? "PUT" : "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Action failed.");
            setMessage(result.message);
            await loadDashboard();
        } catch (error) {
            setMessage(error.message);
        }
    }

    const reports = data.reports.filter(report => {
        const term = search.trim().toLowerCase();
        const matchesSearch = !term || [report.item_name, report.location, report.reporter_name, report.reporter_email]
            .some(value => String(value || "").toLowerCase().includes(term));
        return matchesSearch && (status === "all" || String(report.status).toLowerCase() === status);
    });

    if (loading) return <main className="admin-dashboard-page"><p>Loading administrator dashboard...</p></main>;

    return (
        <main className="admin-dashboard-page">
            <section className="reports-heading">
                <div>
                    <span className="section-eyebrow">CAMPUSLOOP CONTROL CENTER</span>
                    <h1>Admin <span>Dashboard</span></h1>
                    <p>Monitor reports, review student accounts and manage returned items.</p>
                </div>
                <button className="market-primary-button" onClick={loadDashboard}>↻ Refresh</button>
            </section>

            {message && <p className="form-message" role="status">{message}</p>}

            <section className="admin-stat-grid">
                <article className="admin-stat-card"><span>Total reports</span><strong>{Number(data.stats.totalReports || 0)}</strong></article>
                <article className="admin-stat-card"><span>Active reports</span><strong>{Number(data.stats.activeReports || 0)}</strong></article>
                <article className="admin-stat-card"><span>Returned items</span><strong>{Number(data.stats.returnedReports || 0)}</strong></article>
                <article className="admin-stat-card"><span>Registered users</span><strong>{data.users.length}</strong></article>
            </section>

            <section className="admin-panel">
                <div className="admin-panel-heading">
                    <div><span className="section-eyebrow">REPORT MANAGEMENT</span><h2>Campus reports</h2></div>
                    <span>{reports.length} shown</span>
                </div>
                <div className="admin-toolbar">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item, location or reporter..." aria-label="Search reports and reporters" />
                    <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by status">
                        <option value="all">All statuses</option><option value="active">Active</option><option value="expired">Expired</option><option value="resolved">Returned</option>
                    </select>
                </div>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>Item</th><th>Type</th><th>Reporter</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {reports.map(report => <tr key={report.id}>
                                <td><Link to={`/reports/${report.id}`}>{report.item_name}</Link></td>
                                <td>{report.report_type}</td>
                                <td>{report.reporter_name || "Unknown"}<small>{report.reporter_email || ""}</small></td>
                                <td>{report.location || "—"}</td>
                                <td><span className={`admin-status status-${String(report.status).toLowerCase()}`}>{report.status}</span></td>
                                <td className="admin-actions">
                                    {report.status !== "Resolved" && <button onClick={() => updateReport(report.id, "resolve")}>Mark returned</button>}
                                    <button className="admin-delete" onClick={() => updateReport(report.id, "delete")}>Delete</button>
                                </td>
                            </tr>)}
                            {reports.length === 0 && <tr><td colSpan="6">No reports match these filters.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="admin-panel">
                <div className="admin-panel-heading"><div><span className="section-eyebrow">CAMPUS COMMUNITY</span><h2>Registered users</h2></div><span>Latest 100 accounts</span></div>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                        <tbody>{data.users.map(person => <tr key={person.id}><td>{person.name}</td><td>{person.email}</td><td>{person.role}</td></tr>)}</tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}

export default AdminDashboard;
