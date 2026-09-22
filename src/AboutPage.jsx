import React from "react";
import { useNavigate } from "react-router-dom";
import "./AboutPage.css";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <header className="about-header">
        <button className="about-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="about-title">A Note from the Author</h1>
      </header>

      <main className="about-container">
        <article className="about-card">
          <section className="author-note">
            <p className="greeting">
              Hi — I’m <strong>VAK</strong>{" "}
              <span className="wave" role="img" aria-label="waving hand">👋</span>
            </p>
            <p>
              I built <em>Track My Spend</em> as a focused, friendly tool to help
              people actually see where their money goes, not just log it.
              I’ve tried dozens of apps; many were powerful, but most felt heavy,
              distracting, or over‑engineered for simple daily tracking. This mini
              project is my attempt at the opposite: clean, quick, and genuinely
              useful.
            </p>
            <p>
              My intention was to combine a lightweight UI with just‑enough
              intelligence: budget alerts, fast stats, and a small AI helper
              that answers questions and nudges you when it matters.
              If it helps you save a little more each month—or simply reduces
              stress—that’s a win.
            </p>
          </section>

          <section className="about-now">
            <h2>What’s here today</h2>
            <ul>
              <li>💸 Budget alerts for categories you care about</li>
              <li>📊 Instant insights (top categories, totals, quick trends)</li>
              <li>🔔 Smart notifications (daily / weekly / monthly)</li>
              <li>🤖 Built‑in AI assistant for tips & quick actions</li>
              <li>🌍 Multi‑currency with automatic conversion</li>
              <li>📂 Data export (CSV / JSON / ZIP)</li>
            </ul>
          </section>

          <section className="about-future">
            <h2>Future mini projects (and experiments)</h2>
            <ul>
              <li>🧾 Receipt‑to‑expense micro‑app (camera → OCR → one‑tap add)</li>
              <li>🏷️ Rule‑based auto‑categorizer (tiny local rules engine)</li>
              <li>📈 Savings coach bot (weekly challenges, gentle nudges)</li>
              <li>📬 Email digest generator (beautiful weekly snapshot)</li>
              <li>🌓 Theme lab (accessible dark modes + high‑contrast pack)</li>
              <li>🔐 Local‑first “vault” prototype with simple sync</li>
            </ul>
            <p className="small">
              I keep these intentionally small in scope so they’re easy to build,
              test, and learn from—then either ship or discard quickly.
            </p>
          </section>

          <section className="about-tech">
            <h2>Under the hood</h2>
            <p>
              This project is a React SPA with clean, component‑first styling and
              a focus on fast interactions. It leans on simple patterns so it’s
              easy to read, tweak, and extend.
            </p>
          </section>

          <section className="about-closing">
            <p>
              Thanks for checking this out. If you have ideas, feature requests,
              or you just want to say hi—reach out. Building in public is more
              fun with company.
            </p>
            <p className="signature">— VAK</p>

            <div className="about-actions">
              <button className="btn-outline" onClick={() => navigate("/contact")}>
                Contact
              </button>
              <button className="btn-primary" onClick={() => navigate("/")}>
                Go to Home
              </button>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
