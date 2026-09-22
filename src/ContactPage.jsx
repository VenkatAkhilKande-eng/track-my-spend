import React from "react";
import { useNavigate } from "react-router-dom";
import "./ContactPage.css";

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <div className="contact-page">
      {/* Header */}
      <header className="contact-header">
        <button className="contact-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="contact-title">Contact</h1>
      </header>

      {/* Main */}
      <main className="contact-container">
        <div className="contact-card">
          <h2>Let’s Connect 🤝</h2>
          <p className="contact-intro">
            Thanks for checking out <strong>Track My Spend</strong>.  
            I’d love to hear from you — whether it’s feedback, collaboration ideas, any suggestions on features to be included
            or just to say hi!
          </p>

          {/* Contact Info */}
          <div className="contact-info">
            <div className="contact-item">
              <span className="icon">📧</span>
              <a href="mailto:vak@example.com">vak@example.com</a>
            </div>
            <div className="contact-item">
              <span className="icon">🌐</span>
              <a href="https://github.com/" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
            <div className="contact-item">
              <span className="icon">💼</span>
              <a
                href="https://linkedin.com/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <form className="contact-form">
            <label>
              Name
              <input type="text" placeholder="Your name" required />
            </label>
            <label>
              Email
              <input type="email" placeholder="Your email" required />
            </label>
            <label>
              Message
              <textarea placeholder="Your message" rows="4" required></textarea>
            </label>
            <button type="submit" className="btn-primary">Send Message</button>
          </form>
        </div>
      </main>
    </div>
  );
}
