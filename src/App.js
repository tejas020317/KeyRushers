// frontend/src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './components/ThemeContext';
import TypingBox from './components/TypingBox'; // For /compete
import PracticeBox from './components/PracticeBox'; // For /practice
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import Leaderboard from './components/Leaderboard';
import StatsPage from './components/StatsPage'; // Import StatsPage
import Galaxy from './components/Galaxy';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase'; // Ensure firebase config is correct
import { onAuthStateChanged } from 'firebase/auth';
import './index.css'; // Global styles
import Page from './components/Page'; // Page transition wrapper
import AboutUs from './components/AboutUs'; // About Us page

// Component to protect routes that require login
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/compete" replace />;
  }
  return children;
}

// Main content component managing auth state and routing
function AppContent() {
  const [user, setUser] = useState(undefined); // undefined until auth resolves
  const [authReady, setAuthReady] = useState(false);
  const leaderboardRef = useRef(null);

  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser || null);
        setAuthReady(true);
      },
      (error) => {
        console.error('Auth listener error:', error);
        setAuthReady(true);
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Show loading indicator until Firebase auth check is done
  if (!authReady) {
    return (
      <div
        className="app-root"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', color: 'var(--text)' }}
      >
        Loading Application...
      </div>
    );
  }

  // --- Main Application Structure ---
  return (
    <Router>
      <div className="app-root">
        {/* Background Galaxy effect */}
        <Galaxy transparent={true} hueShift={140} twinkleIntensity={0.3} />

        {/* Navigation Bar */}
        <Navbar
          user={user}
          onLogout={async () => {
            try {
              await auth.signOut();
              console.log('User logged out successfully');
              window.location.href = '/compete'; // 🔥 Redirect to typing box page after logout
            } catch (error) {
              console.error('Logout failed:', error);
            }
          }}
        />

        {/* --- Application Routes --- */}
        <Routes>
          {/* Default route redirects to /compete */}
          <Route path="/" element={<Navigate to="/compete" replace />} />

          {/* Compete Route - Uses LOCAL word generation */}
          <Route
            path="/compete"
            element={
              <Page animKey={user ? 'in' : 'out'}>
                <TypingBox key={`compete-${user ? user.uid : 'guest'}`} />
              </Page>
            }
          />

          {/* Practice Route - Uses PYTHON BACKEND */}
          <Route
            path="/practice"
            element={
              <ProtectedRoute user={user}>
                <Page>
                  <PracticeBox key="practice" />
                </Page>
              </ProtectedRoute>
            }
          />

          {/* User Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user}>
                <Page>
                  <ProfilePage />
                </Page>
              </ProtectedRoute>
            }
          />

          {/* Stats Route */}
          <Route
            path="/stats"
            element={
              <ProtectedRoute user={user}>
                <Page>
                  <StatsPage />
                </Page>
              </ProtectedRoute>
            }
          />

          {/* Leaderboard Route */}
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute user={user}>
                <Page>
                  <Leaderboard ref={leaderboardRef} />
                </Page>
              </ProtectedRoute>
            }
          />

          {/* About Us Route - now renders the new component */}
          <Route
            path="/about"
            element={
              <Page>
                <AboutUs />
              </Page>
            }
          />

          {/* Login Route */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/compete" replace />
              ) : (
                <Page>
                  <LoginPage />
                </Page>
              )
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/compete" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

// Root App component applies the ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
