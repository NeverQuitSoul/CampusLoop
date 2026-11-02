
import { Link } from "react-router-dom";

function Home() {
    return (
        <main className="home-page scrapbook-home">

            {/* HERO SECTION */}
            <section className="campus-hero">
                <div className="hero-paper">
                    <div className="paper-tape"></div>

                    <span className="campus-kicker">
                        ✿ A LITTLE CAMPUS COMMUNITY PROJECT
                    </span>

                    <h1>
                        Lost something
                        <br />
                        around <span>campus?</span>
                    </h1>

                    <p className="campus-intro">
                        Don't worry. Somewhere on campus, someone
                        might have found it. Let's help your belongings
                        find their way back home.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/report" className="btn btn-primary">
                            + Pin a Report
                        </Link>

                        <Link to="/reports" className="btn btn-secondary">
                            Explore the Board ↗
                        </Link>
                    </div>

                    <div className="hero-handwritten">
                        "One small post can make someone's day."
                    </div>

                    <span className="paper-flower flower-one">✿</span>
                    <span className="paper-flower flower-two">✳</span>
                </div>

                <div className="noticeboard-scene">
                    <div className="board-heading">
                        <span>THE CAMPUS NOTICEBOARD</span>
                        <span className="board-live">● COMMUNITY BOARD</span>
                    </div>

                    <div className="board-main">
                        <div className="board-note note-lavender">
                            <span className="note-pin pin-purple"></span>
                            <span className="note-small">LOST & FOUND</span>
                            <span className="note-emoji">🎒</span>
                            <h3>Every item deserves a way home.</h3>
                            <p>Let's make it happen together.</p>
                        </div>

                        <div className="board-note note-peach">
                            <span className="note-pin pin-orange"></span>
                            <span className="note-emoji">🔎</span>
                            <h3>Looking for something?</h3>
                            <p>Check the community reports.</p>
                        </div>

                        <div className="board-note note-mint">
                            <span className="note-pin pin-green"></span>
                            <span className="note-emoji">🤝</span>
                            <h3>Found something?</h3>
                            <p>Be someone's good news today.</p>
                        </div>

                        <div className="board-doodle doodle-one">✳</div>
                        <div className="board-doodle doodle-two">♡</div>
                        <div className="board-caption">
                            A CAMPUS THAT CARES
                        </div>
                    </div>

                    <div className="board-footer">
                        <span>NOTICE BOARD NO. 01</span>
                        <span>MADE FOR OUR CAMPUS ✿</span>
                    </div>
                </div>
            </section>

            {/* CAMPUS ACTIVITY STRIP */}
            <section className="campus-activity">
                <div className="activity-heading">
                    <span className="activity-sparkle">✳</span>
                    <div>
                        <span className="activity-eyebrow">
                            THE LITTLE THINGS THAT MATTER
                        </span>
                        <h2>Three ways to make a difference.</h2>
                    </div>
                </div>

                <div className="activity-items">
                    <div className="activity-item activity-lost">
                        <span className="activity-icon">🧳</span>
                        <div>
                            <h3>Lost</h3>
                            <p>Tell the campus what is missing.</p>
                        </div>
                        <span className="activity-arrow">↗</span>
                    </div>

                    <div className="activity-item activity-found">
                        <span className="activity-icon">🪴</span>
                        <div>
                            <h3>Found</h3>
                            <p>Share something you discovered.</p>
                        </div>
                        <span className="activity-arrow">↗</span>
                    </div>

                    <div className="activity-item activity-returned">
                        <span className="activity-icon">💌</span>
                        <div>
                            <h3>Reunited</h3>
                            <p>Help an item reach its owner.</p>
                        </div>
                        <span className="activity-arrow">↗</span>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="campus-how">
                <div className="how-heading">
                    <span className="activity-eyebrow">
                        YOUR CAMPUS, YOUR COMMUNITY
                    </span>
                    <h2>
                        It's as easy as <span>one, two, three.</span>
                    </h2>
                    <p>
                        A simple little space to connect lost belongings
                        with the people looking for them.
                    </p>
                </div>

                <div className="scrapbook-features">
                    <article className="scrapbook-card scrapbook-card-one">
                        <span className="feature-sticker">01</span>
                        <div className="scrapbook-icon icon-peach">📌</div>
                        <span className="card-category">FIRST THINGS FIRST</span>
                        <h3>Pin a report</h3>
                        <p>
                            Lost something or found an item?
                            Add its details so other students can see it.
                        </p>
                        <Link to="/report">Create a report ↗</Link>
                    </article>

                    <article className="scrapbook-card scrapbook-card-two">
                        <span className="feature-sticker">02</span>
                        <div className="scrapbook-icon icon-lavender">🔍</div>
                        <span className="card-category">TAKE A LOOK</span>
                        <h3>Explore the board</h3>
                        <p>
                            Browse reports, search for belongings
                            and discover what other students have found.
                        </p>
                        <Link to="/reports">Explore reports ↗</Link>
                    </article>

                    <article className="scrapbook-card scrapbook-card-three">
                        <span className="feature-sticker">03</span>
                        <div className="scrapbook-icon icon-mint">💚</div>
                        <span className="card-category">THE HAPPY PART</span>
                        <h3>Make a connection</h3>
                        <p>
                            Help someone reconnect with a missing
                            belonging through the campus community.
                        </p>
                        <Link to="/reports">Find an item ↗</Link>
                    </article>
                </div>
            </section>

            {/* CLOSING NOTICE */}
            <section className="campus-final-note">
                <div className="final-note-decoration">✿</div>

                <div className="final-note-content">
                    <span className="activity-eyebrow">
                        A SMALL ACT OF KINDNESS
                    </span>

                    <h2>
                        Found something?
                        <br />
                        You could be someone's <span>happy ending.</span>
                    </h2>

                    <p>
                        Put it on the board. Your little effort
                        might mean a lot to another student.
                    </p>

                    <Link to="/report" className="btn btn-primary">
                        Share what you found ↗
                    </Link>
                </div>

                <div className="final-note-art">
                    <span className="final-heart">♡</span>
                    <span className="final-flower">🌼</span>
                    <span className="final-star">✳</span>
                </div>
            </section>

        </main>
    );
}

export default Home;
