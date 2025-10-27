import React, { useState } from "react";
import "./AboutUs.css";

const TEAM = [
  {
    name: "Avadhut Dhengale",
    image: "avadhut-dhengale.jpg", // Place this file in /public/assets/
    college: "PICT",
    department: "IT",
    github: "https://github.com/avadhut001xd",
    email: "adhengale16@gmail.com " // trailing space handled by .trim()
  },
  {
    name: "Tejas Tambe",
    image: "tejas-tambe.jpg", // Place this file in /public/assets/
    college: "PICT",
    department: "IT",
    github: "https://github.com/tejas020317",
    email: "tejastambe1742005@gmail.com"
  },
  {
    name: "Rudar Deshpande",
    image: "rudar-deshpande.jpg", // Place this file in /public/assets/
    college: "PICT",
    department: "IT",
    github: "https://github.com/rvdeshpande324-pixel",
    email: "rdtornado40@gmail.com"
  },
  {
    name: "Advita Sonawane",
    image: "advita-sonawane.jpg", // Place this file in /public/assets/
    college: "PICT",
    department: "IT",
    github: "https://github.com/dev4",
    email: "dev4@keyrushers.com"
  }
];

const INSTRUCTOR = {
  name: "Dr. A. M. Bagade",
  image: "dr-a-m-bagade.jpg", // Place this file in /public/assets/
  college: "PICT",
  department: "IT",
  appreciation:
    "Our mentor and guide whose expertise and encouragement made this project possible. Thank you for believing in us!",
  github: "https://github.com/instructor",
  email: "ambagade@pict.edu"
};

// Build a Gmail compose URL with prefilled fields
function buildGmailComposeUrl({
  to,
  subject = "",
  body = "",
  cc = "",
  bcc = "",
  accountSpecifier = "0" // can be "0", "1", or even "youremail@gmail.com"
}) {
  const params = new URLSearchParams();
  const toClean = (to || "").trim();
  if (toClean) params.set("to", toClean);
  if (cc) params.set("cc", cc);
  if (bcc) params.set("bcc", bcc);
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  params.set("tf", "cm"); // ensures compose window
  // account specifier: /u/0/ or /u/your@email.com/
  return `https://mail.google.com/mail/u/${encodeURIComponent(accountSpecifier)}/?${params.toString()}`;
} // Works in desktop browsers; on some mobile browsers it may only land in Inbox without opening compose [web:35][web:34].

// Avatar component with fallback initials if image fails to load
function Avatar({ name, image }) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="avatar-circle">
      {!imgError ? (
        <img
          src={require(`../assets/${image}`)}
          alt={name}
          className="avatar-img"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="avatar-initials">{initials}</span>
      )}
    </div>
  );
}

export default function AboutUs() {
  // Customize or leave blank
  const defaultSubject = "Hello from KeyRushers";
  const defaultBody = "Hi,\nI’d like to connect about KeyRushers.";

  // If you know which Gmail account index to target, set it here (e.g., "0" for first, "1" for second)
  const gmailAccountSpecifier = "0"; // can also be the email address to route correctly [web:35][web:42]

  return (
    <section className="aboutus">
      <div className="aboutus-hero">
        <div className="hero-content-box">
          <h1 className="aboutus-title">About KeyRushers</h1>
          <p className="aboutus-subtitle">
            KeyRushers is a typing application designed to help you improve your speed and accuracy through engaging practice and personalized feedback. Compete on the global leaderboard, hone your skills in practice mode with words tailored to your weaknesses, and track your progress over time! Built with a love for clean code, clean keycaps, and slightly unhealthy amounts of caffeine.
          </p>
          <p className="aboutus-credit">
            Proudly developed by PICT (Pune Institute of Computer Technology) IT students.
          </p>
        </div>
      </div>

      <div className="aboutus-grid">
        {TEAM.map((m, i) => (
          <article key={i} className="profile-card">
            <Avatar name={m.name} image={m.image} />

            <h3 className="profile-name">{m.name}</h3>
            <p className="profile-info">
              <span className="college-name">{m.college}</span>
              <span className="department">Department: {m.department}</span>
            </p>

            <div className="profile-links">
              <a
                href={m.github}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="GitHub"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href={buildGmailComposeUrl({
                  to: m.email,
                  subject: defaultSubject,
                  body: defaultBody,
                  accountSpecifier: gmailAccountSpecifier
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Email"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            </div>
          </article>
        ))}

        <article className="profile-card instructor">
          <Avatar name={INSTRUCTOR.name} image={INSTRUCTOR.image} />
          <h3 className="profile-name">{INSTRUCTOR.name}</h3>
          <p className="profile-info">
            <span className="college-name">{INSTRUCTOR.college}</span>
            <span className="department">
              Department: {INSTRUCTOR.department}
            </span>
          </p>
          <p className="instructor-appreciation">
            {INSTRUCTOR.appreciation}
          </p>
          <div className="profile-links">
            <a
              href={INSTRUCTOR.github}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label="GitHub"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href={buildGmailComposeUrl({
                to: INSTRUCTOR.email,
                subject: defaultSubject,
                body: defaultBody,
                accountSpecifier: gmailAccountSpecifier
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label="Email"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
          </div>
        </article>
      </div>

      <div className="aboutus-extras">
        <div className="features-section">
          <h2 className="features-title">Why Choose KeyRushers?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <h3 className="feature-heading">Gamified Experience</h3>
              <p className="feature-text">
                Compete on global leaderboards and track your progress with detailed analytics
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3 className="feature-heading">Smart Practice</h3>
              <p className="feature-text">
                AI-powered word selection focuses on your weakest keys for faster improvement
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-heading">Real-time Feedback</h3>
              <p className="feature-text">
                Instant WPM, accuracy metrics, and personalized recommendations after every test
              </p>
            </div>
          </div>
        </div>

        <div className="funny-row">
          <div className="funny-card">
            💡 <strong>Pro Tip:</strong> Our smart mode learns which keys you struggle with. It's like having a typing coach who never sleeps.
          </div>
          <div className="funny-card">
            🎯 <strong>Fun Fact:</strong> The average user improves by 15 WPM in their first month. Ready to beat that?
          </div>
          <div className="funny-card">
            🚀 <strong>Did You Know?</strong> Top typists on KeyRushers reach 90+ WPM. Your keyboard is capable of greatness.
          </div>
        </div>

        <div className="cta-row">
          <a className="cta-btn" href="/practice">Start Your Journey</a>
          <a className="cta-btn ghost" href="/leaderboard">See Top Typists</a>
        </div>
      </div>
    </section>
  );
}
