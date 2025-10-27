// frontend/src/components/ResultsModal.js
import React, { useState } from "react";
import { FingerAccuracyChart, FingerConfusionChart, FINGER_NAMES } from "./analytics";
import "./ResultsModal.css";

// Define which fingers belong to which hand
const LEFT_HAND_FINGERS = ['L_PINKY', 'L_RING', 'L_MIDDLE', 'L_INDEX'];
const RIGHT_HAND_FINGERS = ['R_INDEX', 'R_MIDDLE', 'R_RING', 'R_PINKY'];

export default function ResultsModal({
  isOpen,
  wpm,
  accuracy,
  onNext,
  onClose,
  fingerStats,
}) {
  const [hoveredFinger, setHoveredFinger] = useState(null);
  
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Determine performance level for dynamic styling
  const getPerformanceLevel = () => {
    if (accuracy >= 95 && wpm >= 60) return 'excellent';
    if (accuracy >= 85 && wpm >= 40) return 'good';
    if (accuracy >= 75 && wpm >= 25) return 'average';
    return 'practice';
  };

  const performanceLevel = getPerformanceLevel();

  const performanceMessages = {
    excellent: { emoji: '🏆', text: 'Outstanding Performance!', color: '#10b981' },
    good: { emoji: '🎯', text: 'Great Job!', color: '#3b82f6' },
    average: { emoji: '📈', text: 'Keep Practicing!', color: '#f59e0b' },
    practice: { emoji: '💪', text: 'Room for Improvement', color: '#ef4444' }
  };

  const message = performanceMessages[performanceLevel];

  // Helper function to get color based on accuracy
  const getFingerColor = (accuracy) => {
    if (accuracy >= 95) return '#10b981';
    if (accuracy >= 85) return '#3b82f6';
    if (accuracy >= 75) return '#f59e0b';
    return '#ef4444';
  };

  // Helper function to calculate hand stats
  const getHandStats = (fingerIds) => {
    if (!fingerStats) return { fingers: [], totalChars: 0, avgAccuracy: 0 };

    let totalCorrect = 0;
    let totalChars = 0;
    const fingerData = fingerIds.map(id => {
      const stats = fingerStats[id];
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

  const leftHandData = fingerStats ? getHandStats(LEFT_HAND_FINGERS) : null;
  const rightHandData = fingerStats ? getHandStats(RIGHT_HAND_FINGERS) : null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        {/* Close button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* Performance badge */}
        <div className="performance-badge" style={{ '--badge-color': message.color }}>
          <span className="badge-emoji">{message.emoji}</span>
          <span className="badge-text">{message.text}</span>
        </div>

        <h2 className="modal-title">Test Results</h2>

        {/* Enhanced Summary Cards */}
        <div className="results-summary">
          <div className="result-card result-card-wpm">
            <div className="result-icon">⚡</div>
            <div className="result-content">
              <span className="result-value">{wpm}</span>
              <span className="result-label">Words Per Minute</span>
            </div>
            <div className="result-sparkle"></div>
          </div>
          
          <div className="result-card result-card-accuracy">
            <div className="result-icon">🎯</div>
            <div className="result-content">
              <span className="result-value">{accuracy}%</span>
              <span className="result-label">Accuracy</span>
            </div>
            <div className="result-sparkle"></div>
          </div>
        </div>

        {/* Progress ring visualization */}
        <div className="progress-rings">
          <div className="progress-ring-wrapper">
            <svg className="progress-ring" viewBox="0 0 120 120">
              <circle className="progress-ring-bg" cx="60" cy="60" r="52" />
              <circle 
                className="progress-ring-fill" 
                cx="60" cy="60" r="52"
                style={{
                  strokeDasharray: `${(wpm / 100) * 326.73} 326.73`,
                  stroke: '#3b82f6'
                }}
              />
              <text x="60" y="55" className="progress-ring-text">{wpm}</text>
              <text x="60" y="70" className="progress-ring-label">WPM</text>
            </svg>
          </div>
          
          <div className="progress-ring-wrapper">
            <svg className="progress-ring" viewBox="0 0 120 120">
              <circle className="progress-ring-bg" cx="60" cy="60" r="52" />
              <circle 
                className="progress-ring-fill" 
                cx="60" cy="60" r="52"
                style={{
                  strokeDasharray: `${(accuracy / 100) * 326.73} 326.73`,
                  stroke: message.color
                }}
              />
              <text x="60" y="55" className="progress-ring-text">{accuracy}%</text>
              <text x="60" y="70" className="progress-ring-label">Accuracy</text>
            </svg>
          </div>
        </div>

        {/* Analytics charts section - only show if fingerStats exists */}
        {fingerStats && (
          <div className="analytics-section">
            <div className="section-divider">
              <span className="divider-text">📊 Detailed Analysis</span>
            </div>
            
            {/* Hand Visualizations */}
            <div className="hands-wrapper-modal">
              {/* Left Hand */}
              <div className="hand-column-modal">
                <div className="hand-header-modal">
                  <h4>✋ Left</h4>
                  <span className="hand-accuracy-modal">{leftHandData.avgAccuracy}%</span>
                </div>
                
                <div className="hand-visual-modal">
                  <div className="hand-image-container-modal">
                    <svg viewBox="0 0 200 300" className="hand-illustration-modal">
                      <defs>
                        <linearGradient id="skin-left-modal" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#ffdbac', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#f1c27d', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                      <ellipse cx="100" cy="220" rx="55" ry="65" fill="url(#skin-left-modal)" stroke="#d4a574" strokeWidth="2"/>
                      <ellipse cx="35" cy="195" rx="18" ry="32" fill="url(#skin-left-modal)" stroke="#d4a574" strokeWidth="2" transform="rotate(-20 35 195)"/>
                      <rect x="35" y="60" width="16" height="95" rx="8" fill="url(#skin-left-modal)" stroke="#d4a574" strokeWidth="2"/>
                      <rect x="65" y="40" width="18" height="115" rx="9" fill="url(#skin-left-modal)" stroke="#d4a574" strokeWidth="2"/>
                      <rect x="97" y="30" width="20" height="125" rx="10" fill="url(#skin-left-modal)" stroke="#d4a574" strokeWidth="2"/>
                      <rect x="131" y="45" width="18" height="110" rx="9" fill="url(#skin-left-modal)" stroke="#d4a574" strokeWidth="2"/>
                    </svg>
                    
                    <div className="finger-overlays-modal left">
                      {leftHandData.fingers.map((finger, idx) => (
                        <div 
                          key={finger.id}
                          className={`finger-overlay-modal finger-${idx} ${hoveredFinger === finger.id ? 'hovered' : ''}`}
                          style={{ '--finger-color': finger.color }}
                          onMouseEnter={() => setHoveredFinger(finger.id)}
                          onMouseLeave={() => setHoveredFinger(null)}
                        >
                          <div className="finger-bubble-modal">
                            <span className="bubble-accuracy-modal" style={{ color: finger.color }}>{finger.accuracy}%</span>
                            <span className="bubble-name-modal">{finger.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="finger-list-modal">
                  {leftHandData.fingers.map(finger => (
                    <div 
                      key={finger.id}
                      className="finger-item-modal"
                      onMouseEnter={() => setHoveredFinger(finger.id)}
                      onMouseLeave={() => setHoveredFinger(null)}
                      style={{ borderColor: hoveredFinger === finger.id ? finger.color : undefined }}
                    >
                      <span className="finger-item-name">{finger.name}</span>
                      <span className="finger-item-accuracy" style={{ color: finger.color }}>{finger.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Hand */}
              <div className="hand-column-modal">
                <div className="hand-header-modal">
                  <h4>Right 🤚</h4>
                  <span className="hand-accuracy-modal">{rightHandData.avgAccuracy}%</span>
                </div>
                
                <div className="hand-visual-modal">
                  <div className="hand-image-container-modal">
                    <svg viewBox="0 0 200 300" className="hand-illustration-modal">
                      <defs>
                        <linearGradient id="skin-right-modal" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#ffdbac', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#f1c27d', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                      <ellipse cx="100" cy="220" rx="55" ry="65" fill="url(#skin-right-modal)" stroke="#d4a574" strokeWidth="2"/>
                      <ellipse cx="165" cy="195" rx="18" ry="32" fill="url(#skin-right-modal)" stroke="#d4a574" strokeWidth="2" transform="rotate(20 165 195)"/>
                      <rect x="51" y="45" width="18" height="110" rx="9" fill="url(#skin-right-modal)" stroke="#d4a574" strokeWidth="2"/>
                      <rect x="83" y="30" width="20" height="125" rx="10" fill="url(#skin-right-modal)" stroke="#d4a574" strokeWidth="2"/>
                      <rect x="117" y="40" width="18" height="115" rx="9" fill="url(#skin-right-modal)" stroke="#d4a574" strokeWidth="2"/>
                      <rect x="149" y="60" width="16" height="95" rx="8" fill="url(#skin-right-modal)" stroke="#d4a574" strokeWidth="2"/>
                    </svg>
                    
                    <div className="finger-overlays-modal right">
                      {rightHandData.fingers.map((finger, idx) => (
                        <div 
                          key={finger.id}
                          className={`finger-overlay-modal finger-${idx} ${hoveredFinger === finger.id ? 'hovered' : ''}`}
                          style={{ '--finger-color': finger.color }}
                          onMouseEnter={() => setHoveredFinger(finger.id)}
                          onMouseLeave={() => setHoveredFinger(null)}
                        >
                          <div className="finger-bubble-modal">
                            <span className="bubble-accuracy-modal" style={{ color: finger.color }}>{finger.accuracy}%</span>
                            <span className="bubble-name-modal">{finger.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="finger-list-modal">
                  {rightHandData.fingers.map(finger => (
                    <div 
                      key={finger.id}
                      className="finger-item-modal"
                      onMouseEnter={() => setHoveredFinger(finger.id)}
                      onMouseLeave={() => setHoveredFinger(null)}
                      style={{ borderColor: hoveredFinger === finger.id ? finger.color : undefined }}
                    >
                      <span className="finger-item-name">{finger.name}</span>
                      <span className="finger-item-accuracy" style={{ color: finger.color }}>{finger.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced action button */}
        <div className="modal-buttons">
          <button className="modal-btn modal-btn-primary" onClick={onNext}>
            <span className="btn-icon">▶️</span>
            <span className="btn-text">Next Test</span>
          </button>
        </div>
      </div>
    </div>
  );
}