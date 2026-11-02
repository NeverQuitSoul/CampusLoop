
import { Link } from "react-router-dom";

function Home() {
    return (
        <main className="home-page">
            <section className="hero">
                <div className="hero-content">
                    <span className="tagline">
                        ✦ YOUR CAMPUS, CONNECTED
                    </span>

                    <h1>
                        Lost something?
                        <br />
                        <span>Let's find it together.</span>
                    </h1>

                    <p className="description">
                        Your campus community is here to help.
                        Report lost belongings, discover found items
                        and reconnect with what matters.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/report" className="btn btn-primary">
                            + Report an Item
                        </Link>

                        <Link to="/reports" className="btn btn-secondary">
                            Explore Marketplace ↗
                        </Link>
                    </div>

                    <div className="hero-note">
                        <span>✦</span>
                        A little help from your campus community goes a long way.
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="hero-decoration decoration-one"></div>
                    <div className="hero-decoration decoration-two"></div>

                    <div className="hero-main-card">
                        <div className="hero-card-top">
                            <span className="hero-card-label">
                                CAMPUS MARKETPLACE
                            </span>
                            <span className="hero-card-dot">●</span>
                        </div>

                        <div className="hero-illustration">
                            <div className="illustration-circle">
                                <span>🎒</span>
                            </div>
                            <div className="illustration-star star-one">✦</div>
                            <div className="illustration-star star-two">✧</div>
                        </div>

                        <div className="hero-card-bottom">
                            <div>
                                <h3>Every item has a way home.</h3>
                                <p>Connect. Discover. Reunite.</p>
                            </div>
                            <span className="hero-arrow">↗</span>
                        </div>
                    </div>

                    <div className="floating-note note-top">
                        <span className="floating-icon">🔎</span>
                        <div>
                            <strong>Looking for something?</strong>
                            <small>Browse campus reports</small>
                        </div>
                    </div>

                    <div className="floating-note note-bottom">
                        <span className="floating-icon">🤝</span>
                        <div>
                            <strong>Community first</strong>
                            <small>Helping items find owners</small>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-stats">
                <div>
                    <span className="home-stat-icon">⌕</span>
                    <div>
                        <h3>Lost</h3>
                        <p>Report missing belongings</p>
                    </div>
                </div>

                <div>
                    <span className="home-stat-icon">✦</span>
                    <div>
                        <h3>Found</h3>
                        <p>Share items you discover</p>
                    </div>
                </div>

                <div>
                    <span className="home-stat-icon">✓</span>
                    <div>
                        <h3>Reunited</h3>
                        <p>Help belongings find their way home</p>
                    </div>
                </div>
            </section>

            <section className="features">
                <div className="features-heading">
                    <span className="section-eyebrow">
                        SIMPLE. USEFUL. COMMUNITY-POWERED.
                    </span>

                    <h2>
                        How CampusLoop <span>works</span>
                    </h2>

                    <p>
                        Three simple ways to make your campus a more connected place.
                    </p>
                </div>

                <div className="feature-grid">
                    <article className="feature-card">
                        <div className="feature-icon">📢</div>
                        <span className="feature-number">01</span>
                        <h3>Report an Item</h3>
                        <p>
                            Lost something? Share its details and help
                            other students identify it.
                        </p>
                        <Link to="/report">Create a report ↗</Link>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon">🔎</div>
                        <span className="feature-number">02</span>
                        <h3>Explore Reports</h3>
                        <p>
                            Browse lost and found belongings shared
                            by your campus community.
                        </p>
                        <Link to="/reports">Browse items ↗</Link>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon">🤝</div>
                        <span className="feature-number">03</span>
                        <h3>Reconnect</h3>
                        <p>
                            Help belongings return to their rightful
                            owners through community support.
                        </p>
                        <Link to="/reports">Find an item ↗</Link>
                    </article>
                </div>
            </section>

            <section className="home-cta">
                <div>
                    <span className="section-eyebrow">
                        BE PART OF THE COMMUNITY
                    </span>

                    <h2>
                        Someone might be looking for
                        <br />
                        what you've found.
                    </h2>

                    <p>
                        Take a moment to report it. It could make someone's day.
                    </p>
                </div>

                <Link to="/report" className="btn btn-primary">
                    Report an Item ↗
                </Link>
            </section>
        </main>
    );
}

export default Home;
