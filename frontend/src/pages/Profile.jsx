import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { useAuth } from "../context/AuthContext";

function Profile() {
    const { token, user, updateUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [name, setName] = useState(user?.name || "");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadProfile() {
            try {
                const response = await fetch(API_URL + "/api/profile", {
                    headers: { Authorization: "Bearer " + token }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Could not load profile.");
                setProfile(data);
                setName(data.name || "");
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [token]);

    async function saveProfile(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");
        try {
            const response = await fetch(API_URL + "/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not update profile.");
            setProfile(current => ({ ...current, ...data.user }));
            updateUser(data.user);
            setMessage(data.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <main className="profile-page"><p>Loading your profile...</p></main>;

    return (
        <main className="profile-page">
            <header className="profile-heading">
                <span className="section-eyebrow">YOUR ACCOUNT</span>
                <h1>Student <span>Profile</span></h1>
                <p>Manage your CampusLoop account details and view your activity.</p>
            </header>
            {error && <p className="profile-alert error">{error}</p>}
            {message && <p className="profile-alert success">{message}</p>}
            {profile && <>
                <section className="profile-card">
                    <div className="profile-avatar">{(profile.name || "S").charAt(0).toUpperCase()}</div>
                    <div><h2>{profile.name}</h2><p>{profile.email}</p><span className="profile-role">{profile.role}</span></div>
                </section>
                <section className="profile-stats">
                    <article><span>Total reports</span><strong>{profile.totalReports || 0}</strong></article>
                    <article><span>Active reports</span><strong>{profile.activeReports || 0}</strong></article>
                    <article><span>Returned items</span><strong>{profile.returnedReports || 0}</strong></article>
                </section>
                <form className="profile-edit-card" onSubmit={saveProfile}>
                    <h2>Edit profile</h2>
                    <label htmlFor="profile-name">Display name</label>
                    <input id="profile-name" value={name} onChange={event => setName(event.target.value)} minLength="2" maxLength="100" required />
                    <label>Email address</label>
                    <input value={profile.email} readOnly />
                    <small>Your registered college email cannot be changed here.</small>
                    <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                </form>
            </>}
        </main>
    );
}
export default Profile;
