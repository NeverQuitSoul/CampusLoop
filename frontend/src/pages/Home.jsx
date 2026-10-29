
function Home() {
  return (
    <>
      <section className="hero" id="home">
        <p className="tagline">YOUR CAMPUS, CONNECTED</p>

        <h1>
          Lost something?
          <br />
          <span>Let's find it together.</span>
        </h1>

        <p className="description">
          CampusLoop helps students report lost items and share
          found belongings. One campus, one community, helping
          things find their way home.
        </p>

        <div className="hero-buttons">
          <a href="/report" className="btn btn-primary">
            Report an Item
          </a>
          <a href="/reports" className="btn btn-secondary">
            Browse Reports
          </a>
        </div>
      </section>

      <section className="features">
        <h2>How CampusLoop Works</h2>

        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-icon">📢</div>
            <h3>Report an Item</h3>
            <p>Share details about something you lost or found on campus.</p>
          </article>

          <article className="feature-card">
            <div className="feature-icon">🔎</div>
            <h3>Browse Reports</h3>
            <p>Explore reports to search for your missing belongings.</p>
          </article>

          <article className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Reconnect</h3>
            <p>Help belongings find their way back to their owners.</p>
          </article>
        </div>
      </section>
    </>
  );
}

export default Home;
