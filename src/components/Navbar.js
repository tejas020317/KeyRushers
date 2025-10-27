// src/components/Navbar.jsx (Updated)
import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import AnimatedButton from './AnimatedButton';
import ProfileDropdown from './ProfileDropdown';
import { gsap } from 'gsap';
import logoFiltered from '../assets/logo-filtered.png';
import logoOriginal from '../assets/logo.png';
import { getMe } from '../api/scores';
import './Navbar.css';

export default function Navbar({ user, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const logoSrc = theme === 'dark' ? logoFiltered : logoOriginal;

  const stripRef = useRef(null);
  const rowRef = useRef(null);
  const rightRef = useRef(null);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile when logged in
  useEffect(() => {
    if (user) {
      getMe()
        .then((profile) => setUserProfile(profile))
        .catch(() => setUserProfile(null));
    } else {
      setUserProfile(null);
    }
  }, [user]);

  // Helper: left-to-right slide for any .fx-slide-in
  const animateSlideIn = (root, delay = 0) => {
    if (!root) return;
    const items = root.querySelectorAll('.fx-slide-in');
    if (!items.length) return;
    gsap.fromTo(
      items,
      { x: -16, opacity: 0, scale: 0.98 },
      { x: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out', stagger: 0.05, delay }
    );
  };

  useEffect(() => {
    if (user) {
      gsap.fromTo(stripRef.current, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
    }
    animateSlideIn(rowRef.current, user ? 0.05 : 0);
    animateSlideIn(rightRef.current, user ? 0.08 : 0);
  }, [user]);

  return (
    <>
      <div ref={stripRef} className={`navbar-strip ${user ? 'logged-in' : ''}`}></div>

      <div ref={rowRef} className="logo-row">
        <div className="logo-container">
          <div className="logo-wrap fx-slide-in">
            <img src={logoSrc} alt="KeyRushers" className="logo-image" />
          </div>
          {!user && <span className="site-name fx-slide-in">KeyRushers</span>}
        </div>

        {user && (
          <nav className="logo-side-links" aria-label="Primary">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'ls-link active fx-slide-in' : 'ls-link fx-slide-in')}>
              <span className="ls-ico">⚡</span>
              <span className="ls-text">Compete</span>
            </NavLink>
            <NavLink to="/practice" className={({ isActive }) => (isActive ? 'ls-link active fx-slide-in' : 'ls-link fx-slide-in')}>
              <span className="ls-ico">📝</span>
              <span className="ls-text">Practice</span>
            </NavLink>
            <NavLink to="/stats" className={({ isActive }) => (isActive ? 'ls-link active fx-slide-in' : 'ls-link fx-slide-in')}>
              <span className="ls-ico">📊</span>
              <span className="ls-text">Stats</span>
            </NavLink>
            <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? 'ls-link active fx-slide-in' : 'ls-link fx-slide-in')}>
              <span className="ls-ico">🏆</span>
              <span className="ls-text">Leaderboard</span>
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'ls-link active fx-slide-in' : 'ls-link fx-slide-in')}>
              <span className="ls-ico">ℹ️</span>
              <span className="ls-text">About Us</span>
            </NavLink>
          </nav>
        )}
      </div>

      <div ref={rightRef} style={floatingStyle}>
        {user ? (
          <>
            <ProfileDropdown user={userProfile || user} onLogout={onLogout} />
            <AnimatedButton variant="theme" onClick={toggleTheme} aria-label="Toggle theme" className="fx-slide-in">
              {theme === 'dark' ? '🌙' : '☀️'}
            </AnimatedButton>
          </>
        ) : (
          <>
            <Link to="/login" style={{ textDecoration: 'none' }} className="fx-slide-in">
              <AnimatedButton variant="primary">Login</AnimatedButton>
            </Link>
            <AnimatedButton variant="theme" onClick={toggleTheme} aria-label="Toggle theme" className="fx-slide-in">
              {theme === 'dark' ? '🌙' : '☀️'}
            </AnimatedButton>
          </>
        )}
      </div>
    </>
  );
}

const floatingStyle = {
  position: 'fixed',
  top: '28px',
  right: '26px',
  display: 'flex',
  gap: '0.8rem',
  zIndex: 1200,
  alignItems: 'center',
};
