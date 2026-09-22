import React from "react";
import { useNavigate } from "react-router-dom";
import logo from './assets/Track My.png';
import "./WelcomePage.css";


export default function WelcomePage() {
  const navigate = useNavigate();
  // at the top of WelcomePage.jsx (inside the component)
  const bursterRef = React.useRef(null);
  const handleCoinBurst = () => {
    const el = bursterRef.current;
    if (!el) return;
    el.classList.remove("burst");       // reset if clicked rapidly
    void el.offsetWidth;                // reflow to restart CSS animation
    el.classList.add("burst");
    // Navigate after a short delay so the burst is visible
    setTimeout(() => navigate('/register'), 500);
  };


  return (
    <div className="welcome-page">
      {/* Header */}
      <header className="welcome-header">
        <div className="logo-section">
          <img src={logo} alt="Track My Logo" className="header-logo" />
        </div>
        <div className="header-buttons">
          <button onClick={() => navigate("/login")} className="btn btn-login">
            Login
          </button>
          <button onClick={() => navigate("/register")} className="btn btn-register">
            Register
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="welcome-container">
        <div className="welcome-card">
          <h2 className="welcome-title">💰 Welcome to Track My Spend</h2>
          <p className="welcome-tagline">
            Your personal assistant to track spending, set smart alerts, and make better financial decisions.
          </p>

          {/* 🔥 Trendy Slogan */}
          <div className="slogan-block">
            <div className="slogan-badge">New</div>
            <h3 className="slogan">Spend smarter. Stress less.</h3>
            <p className="slogan-sub">Track today. Own tomorrow.</p>
          </div>

          <div className="divider"></div>

          {/* Why section */}
          <div className="welcome-reason">
            <h3>Why I Built This</h3>
            <p>
              Managing expenses can be overwhelming, especially when you have multiple categories
              and no clear overview. I wanted a simple, visual, and interactive tool to help people:
            </p>
            <ul>
              <li>Track daily, monthly, and yearly spending with ease.</li>
              <li>Set alerts when nearing budget limits to avoid overspending.</li>
              <li>Get weekly, monthly, and yearly summaries for quick insights.</li>
              <li>View spending trends and top categories instantly.</li>
            </ul>
            <p>
              This mini project combines real-time expense tracking, CSV integration, and smart notifications
              to create a friendly financial companion that works anywhere.
            </p>
          </div>

          {/* 🚀 Coming soon / future improvements */}
          <section className="coming-soon">
            <h3 className="coming-title">What’s Coming Next</h3>
            <ul className="coming-list">
              <li>🔗 Bank sync & auto-categorization</li>
              <li>🧾 Receipt scan (OCR) from phone</li>
              <li>🌓 Dark mode & custom themes</li>
              <li>📈 AI insights & savings tips</li>
              <li>🌎 Multi-currency support</li>
              <li>👥 Shared budgets with family</li>
              <li>📬 Daily/weekly email summaries</li>
            </ul>
            <p className="coming-cta">
              Have an idea? Tell us what you want next — we’re building it live.
            </p>
          </section>
          
          {/* 💡 Feature Highlights with Icons */}
          <section className="features">
            <h3 className="features-title">Highlights<span className="live-badge">Live</span></h3>
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-emoji" aria-hidden>💸</div>
                <h4>Budget Alerts</h4>
                <p>Get notified when a category nears or exceeds your set limit.</p>
              </div>

              <div className="feature-item">
                <div className="feature-emoji" aria-hidden>📊</div>
                <h4>Instant Insights</h4>
                <p>View top categories, totals, and trends at a glance.</p>
              </div>

              <div className="feature-item">
                <div className="feature-emoji" aria-hidden>🔔</div>
                <h4>Smart Notifications</h4>
                <p>Stay on top with customizable daily, weekly, and monthly alerts.</p>
              </div>

              <div className="feature-item">
                <div className="feature-emoji" aria-hidden>📱</div>
                <h4>Mobile-Friendly</h4>
                <p>Responsive design that works great on any device.</p>
              </div>

              <div className="feature-item">
                <div className="feature-emoji" aria-hidden>🌎</div>
                <h4>Multi-Currency</h4>
                <p>Choose USD, INR, or EUR and see your expenses converted automatically.</p>
              </div>

              <div className="feature-item">
                <div className="feature-emoji" aria-hidden>📈</div>
                <h4>Usage Stats</h4>
                <p>Track logins, time spent, and activity history in your profile.</p>
              </div>

              <div className="feature-item">
                <div className="feature-emoji" aria-hidden>📂</div>
                <h4>Data Export</h4>
                <p>Download your expenses anytime in CSV, JSON, or ZIP format.</p>
              </div>

              <div className="feature-item">
                <div className="feature-emoji" aria-hidden>🗂️</div>
                <h4>Expense Management</h4>
                <p>Add, view, filter, and delete expenses with ease.</p>
              </div>

              <div className="feature-item">
                <div className="feature-emoji" aria-hidden>🤖</div>
                <h4>AI Assistant</h4>
                <p>Chat with the built-in bot for tips, summaries, and setting alerts instantly.</p>
              </div>
            </div>
          </section>

          {/* 💬 Testimonials / Quotes */}
          <section className="testimonials">
            <h3 className="testimonials-title">What users say</h3>
            <div className="testimonials-grid">
              <figure className="testimonial-card">
                <blockquote>
                  “I saved <strong>$200</strong> in my first month using Track My Spend!”
                </blockquote>
                <figcaption>— Alex P.</figcaption>
              </figure>
              <figure className="testimonial-card">
                <blockquote>
                  “The alerts are a game changer. I finally stayed within my grocery budget.”
                </blockquote>
                <figcaption>— Priya S.</figcaption>
              </figure>
              <figure className="testimonial-card">
                <blockquote>
                  “Clean, simple, and surprisingly powerful. Love the quick summaries.”
                </blockquote>
                <figcaption>— Jordan M.</figcaption>
              </figure>
            </div>
          </section>
        </div>
      </main>

      {/* Mascot micro‑scene */}
      <button
        className="mascot"
        aria-label="Open savings helper"
        title="Open savings helper"
        onClick={() => {navigate('/register')}}
      >
        <span className="mascot-shadow" aria-hidden="true"></span>

        {/* pig body */}
        <span className="pig" role="img" aria-label="piggy bank">
          🐖
        </span>

        {/* orbiting coins */}
        <span className="coin coin-a" aria-hidden="true">🪙</span>
        <span className="coin coin-b" aria-hidden="true">🪙</span>
        <span className="coin coin-c" aria-hidden="true">🪙</span>

        {/* sparkles */}
        <span className="sparkle s1" aria-hidden="true"></span>
        <span className="sparkle s2" aria-hidden="true"></span>
        <span className="sparkle s3" aria-hidden="true"></span>

        {/* hover tooltip */}
        <span className="mascot-tip" aria-hidden="true">
          Save more with Track My Spend
        </span>
      </button>

      {/* Footer */}
      <footer className="welcome-footer">
        <p>
          A Mini Project by <strong>VAK</strong>
        </p>
        <div className="footer-links">
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </div>
        <p className="footer-note">
          © {new Date().getFullYear()} Track My Spend. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
