// frontend/src/components/StatsPage.js
import React, { useState, useEffect } from 'react';
import { loadPracticeFingerStats, FINGER_NAMES } from './analytics';
import './StatsPage.css';

// Define which fingers belong to which hand
const LEFT_HAND_FINGERS = ['L_PINKY', 'L_RING', 'L_MIDDLE', 'L_INDEX'];
const RIGHT_HAND_FINGERS = ['R_INDEX', 'R_MIDDLE', 'R_RING', 'R_PINKY'];

export default function StatsPage() {
  const [cumulativeStats, setCumulativeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredFinger, setHoveredFinger] = useState(null);

  // Load PRACTICE stats when the component mounts
  useEffect(() => {
    console.log("StatsPage: Loading PRACTICE cumulative stats...");
    const stats = loadPracticeFingerStats();
    console.log("StatsPage: Loaded PRACTICE stats:", stats);
    setCumulativeStats(stats);
    setLoading(false);
  }, []);

  // Helper function to get color based on accuracy
  const getFingerColor = (accuracy) => {
    if (accuracy >= 95) return '#10b981';
    if (accuracy >= 85) return '#3b82f6';
    if (accuracy >= 75) return '#f59e0b';
    return '#ef4444';
  };

  // Helper function to calculate and format stats for display
  const getHandStats = (fingerIds) => {
    if (!cumulativeStats) return { fingers: [], totalChars: 0, avgAccuracy: 0 };

    let totalCorrect = 0;
    let totalChars = 0;
    const fingerData = fingerIds.map(id => {
      const stats = cumulativeStats[id];
      const accuracy = (stats && stats.total > 0) ? Math.round((stats.correct / stats.total) * 100) : 0;
      const chars = stats ? stats.total : 0;
      totalCorrect += stats ? stats.correct : 0;
      totalChars += chars;
      return {
        id: id,
        name: FINGER_NAMES[id]?.replace('Left ', '').replace('Right ', '') || 'Unknown',
        accuracy: accuracy,
        chars: chars,
        color: getFingerColor(accuracy)
      };
    });

    const avgAccuracy = totalChars > 0 ? Math.round((totalCorrect / totalChars) * 100) : 0;
    return { fingers: fingerData, totalChars, avgAccuracy };
  };

  // Get processed data for each hand
  const leftHandData = getHandStats(LEFT_HAND_FINGERS);
  const rightHandData = getHandStats(RIGHT_HAND_FINGERS);

  // Calculate overall stats
  const totalChars = leftHandData.totalChars + rightHandData.totalChars;
  const overallAccuracy = totalChars > 0 
    ? Math.round(((leftHandData.avgAccuracy * leftHandData.totalChars + rightHandData.avgAccuracy * rightHandData.totalChars) / totalChars))
    : 0;

  // Get all fingers for overall chart
  const allFingers = [...leftHandData.fingers, ...rightHandData.fingers];

  // Show loading indicator
  if (loading) {
    return <div className="stats-loading">Loading stats...</div>;
  }

  return (
    <div className="stats-page">
      <h1><span className="emoji">📊</span> Overall Practice Stats</h1>

      
      {/* Overview Stats Cards */}
      <div className="overview-cards">
        <div className="stat-card stat-card-primary">
          <div className="stat-card-icon">🎯</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{overallAccuracy}%</div>
            <div className="stat-card-label">Overall Accuracy</div>
            <div className="stat-card-progress">
              <div 
                className="stat-card-progress-bar" 
                style={{ width: `${overallAccuracy}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-card-secondary">
          <div className="stat-card-icon">📝</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{totalChars}</div>
            <div className="stat-card-label">Total Characters</div>
            <div className="stat-card-subtitle">Keep practicing!</div>
          </div>
        </div>

        <div className="stat-card stat-card-tertiary">
          <div className="stat-card-icon">📈</div>
          <div className="stat-card-content">
            <div className="stat-card-value">
              {leftHandData.avgAccuracy > rightHandData.avgAccuracy ? 'Left' : rightHandData.avgAccuracy > leftHandData.avgAccuracy ? 'Right' : 'Even'}
            </div>
            <div className="stat-card-label">Stronger Hand</div>
            <div className="stat-card-subtitle">
              L: {leftHandData.avgAccuracy}% | R: {rightHandData.avgAccuracy}%
            </div>
          </div>
        </div>
      </div>

      {/* Hand Analysis with Images */}
      <div className="stats-container hand-analysis-container">
        <h2>Hand Analysis (Practice Accuracy)</h2>
        <p className="analysis-subtitle">Visualize your cumulative typing accuracy for each hand and finger in Practice Mode.</p>

        <div className="hands-wrapper">
          {/* Left Hand Column */}
          <div className="hand-column">
            <div className="hand-header">
              <h3>✋ Left Hand</h3>
              <span className="hand-avg-accuracy">{leftHandData.avgAccuracy}%</span>
              <span className="hand-total-chars">({leftHandData.totalChars} chars)</span>
            </div>
            
            {/* Hand Image with Overlays */}
            <div className="hand-visualization-wrapper">
              <div className="hand-image-container">
                {/* Hand Image - Using emoji/placeholder, replace with actual image */}
                <div className="hand-image left-hand">
                  <svg viewBox="0 0 200 300" className="hand-illustration">
                    {/* Left Hand Illustration */}
                    <defs>
                      <linearGradient id="skin-gradient-left" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#ffdbac', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#f1c27d', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* Palm */}
                    <ellipse cx="100" cy="220" rx="55" ry="65" fill="url(#skin-gradient-left)" stroke="#d4a574" strokeWidth="2"/>
                    {/* Thumb */}
                    <ellipse cx="35" cy="195" rx="18" ry="32" fill="url(#skin-gradient-left)" stroke="#d4a574" strokeWidth="2" transform="rotate(-20 35 195)"/>
                    {/* Fingers with positioning for left hand */}
                    <rect x="35" y="60" width="16" height="95" rx="8" fill="url(#skin-gradient-left)" stroke="#d4a574" strokeWidth="2"/>
                    <rect x="65" y="40" width="18" height="115" rx="9" fill="url(#skin-gradient-left)" stroke="#d4a574" strokeWidth="2"/>
                    <rect x="97" y="30" width="20" height="125" rx="10" fill="url(#skin-gradient-left)" stroke="#d4a574" strokeWidth="2"/>
                    <rect x="131" y="45" width="18" height="110" rx="9" fill="url(#skin-gradient-left)" stroke="#d4a574" strokeWidth="2"/>
                  </svg>
                </div>
                
                {/* Finger Accuracy Overlays */}
                <div className="finger-overlays left">
                  {leftHandData.fingers.map((finger, idx) => (
                    <div 
                      key={finger.id}
                      className={`finger-overlay finger-${idx} ${hoveredFinger === finger.id ? 'hovered' : ''}`}
                      style={{ '--finger-color': finger.color }}
                      onMouseEnter={() => setHoveredFinger(finger.id)}
                      onMouseLeave={() => setHoveredFinger(null)}
                    >
                      <div className="finger-bubble">
                        <span className="bubble-accuracy" style={{ color: finger.color }}>{finger.accuracy}%</span>
                        <span className="bubble-name">{finger.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="finger-stats-grid">
              {leftHandData.fingers.map(finger => (
                <div 
                  className="finger-stat-item" 
                  key={finger.id}
                  onMouseEnter={() => setHoveredFinger(finger.id)}
                  onMouseLeave={() => setHoveredFinger(null)}
                  style={{ 
                    borderColor: hoveredFinger === finger.id ? finger.color : undefined,
                    transform: hoveredFinger === finger.id ? 'translateY(-2px)' : 'translateY(0)'
                  }}>
                  <div className="finger-name">{finger.name}</div>
                  <div className="finger-accuracy" style={{ color: finger.color }}>{finger.accuracy}%</div>
                  <div className="finger-chars">{finger.chars} chars</div>
                  <div className="finger-progress-bar">
                    <div 
                      className="finger-progress-fill" 
                      style={{ 
                        width: `${finger.accuracy}%`,
                        backgroundColor: finger.color 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Hand Column */}
          <div className="hand-column">
             <div className="hand-header">
              <h3>Right Hand 🤚</h3>
              <span className="hand-avg-accuracy">{rightHandData.avgAccuracy}%</span>
              <span className="hand-total-chars">({rightHandData.totalChars} chars)</span>
            </div>

            {/* Hand Image with Overlays */}
            <div className="hand-visualization-wrapper">
              <div className="hand-image-container">
                <div className="hand-image right-hand">
                  <svg viewBox="0 0 200 300" className="hand-illustration">
                    {/* Right Hand Illustration */}
                    <defs>
                      <linearGradient id="skin-gradient-right" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#ffdbac', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#f1c27d', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* Palm */}
                    <ellipse cx="100" cy="220" rx="55" ry="65" fill="url(#skin-gradient-right)" stroke="#d4a574" strokeWidth="2"/>
                    {/* Thumb */}
                    <ellipse cx="165" cy="195" rx="18" ry="32" fill="url(#skin-gradient-right)" stroke="#d4a574" strokeWidth="2" transform="rotate(20 165 195)"/>
                    {/* Fingers with positioning for right hand */}
                    <rect x="51" y="45" width="18" height="110" rx="9" fill="url(#skin-gradient-right)" stroke="#d4a574" strokeWidth="2"/>
                    <rect x="83" y="30" width="20" height="125" rx="10" fill="url(#skin-gradient-right)" stroke="#d4a574" strokeWidth="2"/>
                    <rect x="117" y="40" width="18" height="115" rx="9" fill="url(#skin-gradient-right)" stroke="#d4a574" strokeWidth="2"/>
                    <rect x="149" y="60" width="16" height="95" rx="8" fill="url(#skin-gradient-right)" stroke="#d4a574" strokeWidth="2"/>
                  </svg>
                </div>
                
                {/* Finger Accuracy Overlays */}
                <div className="finger-overlays right">
                  {rightHandData.fingers.map((finger, idx) => (
                    <div 
                      key={finger.id}
                      className={`finger-overlay finger-${idx} ${hoveredFinger === finger.id ? 'hovered' : ''}`}
                      style={{ '--finger-color': finger.color }}
                      onMouseEnter={() => setHoveredFinger(finger.id)}
                      onMouseLeave={() => setHoveredFinger(null)}
                    >
                      <div className="finger-bubble">
                        <span className="bubble-accuracy" style={{ color: finger.color }}>{finger.accuracy}%</span>
                        <span className="bubble-name">{finger.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="finger-stats-grid">
              {rightHandData.fingers.map(finger => (
                <div 
                  className="finger-stat-item" 
                  key={finger.id}
                  onMouseEnter={() => setHoveredFinger(finger.id)}
                  onMouseLeave={() => setHoveredFinger(null)}
                  style={{ 
                    borderColor: hoveredFinger === finger.id ? finger.color : undefined,
                    transform: hoveredFinger === finger.id ? 'translateY(-2px)' : 'translateY(0)'
                  }}>
                  <div className="finger-name">{finger.name}</div>
                  <div className="finger-accuracy" style={{ color: finger.color }}>{finger.accuracy}%</div>
                  <div className="finger-chars">{finger.chars} chars</div>
                  <div className="finger-progress-bar">
                    <div 
                      className="finger-progress-fill" 
                      style={{ 
                        width: `${finger.accuracy}%`,
                        backgroundColor: finger.color 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {leftHandData.totalChars === 0 && rightHandData.totalChars === 0 && (
          <p className="no-stats-message">
            No practice data recorded yet. Complete some tests in <strong>Practice Mode</strong> to see your stats here!
          </p>
        )}
      </div>
    </div>
  );
}