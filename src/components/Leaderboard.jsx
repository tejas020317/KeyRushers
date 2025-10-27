import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { getLeaderboard, getUserRank } from '../api/scores';
import { auth } from '../firebase';
import gsap from 'gsap';
import './Leaderboard.css';

const TIME_MODES = [
  { key: '15s', label: '15 Sec', seconds: 15 },
  { key: '30s', label: '30 Sec', seconds: 30 },
  { key: '60s', label: '1 Min', seconds: 60 },
  { key: '120s', label: '2 Min', seconds: 120 },
  { key: 'all', label: 'All Time', seconds: null }
];

const LEAGUES = {
  bronze: { name: 'Bronze', icon: '🟤', min: 0, max: 14, color: '#CD7F32' },
  silver: { name: 'Silver', icon: '⚪', min: 15, max: 29, color: '#C0C0C0' },
  gold: { name: 'Gold', icon: '🟡', min: 30, max: 44, color: '#FFD700' },
  platinum: { name: 'Platinum', icon: '🔷', min: 45, max: 59, color: '#E5E4E2' },
  diamond: { name: 'Diamond', icon: '💎', min: 60, max: 74, color: '#B9F2FF' },
  master: { name: 'Master', icon: '🔱', min: 75, max: 89, color: '#8A2BE2' },
  grandmaster: { name: 'Grandmaster', icon: '👑', min: 90, max: Infinity, color: '#FFD700' }
};

function getLeague(wpm, isTop100 = false) {
  if (isTop100 && wpm >= 75) return LEAGUES.grandmaster;
  for (const [key, league] of Object.entries(LEAGUES)) {
    if (key === 'grandmaster') continue;
    if (wpm >= league.min && wpm <= league.max) return league;
  }
  return LEAGUES.bronze;
}

const Leaderboard = forwardRef((props, ref) => {
  const [activeMode, setActiveMode] = useState('all');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  const userCardRef = useRef(null);
  const tableRef = useRef(null);

  useImperativeHandle(ref, () => ({
    refreshLeaderboard: loadLeaderboard
  }));

  useEffect(() => {
    loadLeaderboard();
  }, [activeMode]);

  useEffect(() => {
    const onRefresh = () => loadLeaderboard();
    window.addEventListener('leaderboard:refresh', onRefresh);
    return () => window.removeEventListener('leaderboard:refresh', onRefresh);
  }, [activeMode]);

  useEffect(() => {
    if (userCardRef.current) {
      gsap.fromTo(
        userCardRef.current,
        { y: -20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.4)' }
      );
    }
  }, [userRank]);

  useEffect(() => {
    if (tableRef.current) {
      const rows = tableRef.current.querySelectorAll('.leaderboard-row');
      gsap.fromTo(
        rows,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [leaderboardData]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const data = await getLeaderboard(activeMode, 100);
      setLeaderboardData(data);

      if (auth.currentUser) {
        const rankData = await getUserRank(activeMode);
        const league = getLeague(rankData.wpm, rankData.rank <= 100);
        setUserRank({
          ...rankData,
          league,
          isTop100: rankData.rank <= 100
        });
      } else {
        setUserRank(null);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
    setLoading(false);
  }

  function getRankIcon(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  const progressWidth = (rankWpm, league) => {
    if (!league) return '0%';
    const span = league.max - league.min;
    if (!Number.isFinite(span) || span <= 0) return '100%';
    const pct = ((rankWpm - league.min) / span) * 100;
    return `${Math.min(Math.max(pct, 0), 100)}%`;
  };

  const activeModeLabel = TIME_MODES.find(m => m.key === activeMode)?.label || 'All Time';

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <h1 className="leaderboard-title">🏆 Global Leaderboard</h1>

        {userRank && (
          <div ref={userCardRef} className="user-rank-card">
            <div className="rank-card-header">
              <div className="rank-badge">{getRankIcon(userRank.rank)}</div>
              <div className="user-info-section">
                <div className="user-avatar">
                  {userRank.avatar ? (
                    <img src={userRank.avatar} alt={userRank.displayName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {userRank.displayName?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <h3 className="user-name">{userRank.displayName || 'Anonymous'}</h3>
                  <div className="league-badge" style={{ borderColor: userRank.league.color }}>
                    <span className="league-icon">{userRank.league.icon}</span>
                    <span className="league-name">{userRank.league.name}</span>
                  </div>
                  {/* <div className="mode-chip">{activeModeLabel}</div> */}
                </div>
              </div>
            </div>

            <div className="rank-card-stats">
              <div className="stat-item">
                <span className="stat-label">Highest WPM</span>
                <span className="stat-value">{userRank.wpm}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg WPM</span>
                <span className="stat-value">{userRank.avgWpm ?? 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg Accuracy</span>
                <span className="stat-value">{userRank.avgAccuracy ?? 0}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Matches</span>
                <span className="stat-value">{userRank.matches ?? 0}</span>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: progressWidth(userRank.wpm, userRank.league),
                    background: `linear-gradient(90deg, ${userRank.league.color}, #8400ff)`
                  }}
                />
              </div>
              <p className="progress-text">
                {userRank.league.name !== 'Grandmaster'
                  ? `${Math.max(0, userRank.league.max - userRank.wpm + 1)} WPM to next league`
                  : 'Max League!'}
              </p>
            </div>
          </div>
        )}

        <div className="mode-tabs">
          {TIME_MODES.map(mode => (
            <button
              key={mode.key}
              className={`mode-tab ${activeMode === mode.key ? 'active' : ''}`}
              onClick={() => setActiveMode(mode.key)}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="leaderboard-table-container">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <p>Loading leaderboard...</p>
            </div>
          ) : (
            <>
              {/* <div className="table-info-bar">
                <p className="table-subtitle">
                  Showing stats for <strong>{activeModeLabel}</strong> mode
                </p>
              </div> */}
              <div ref={tableRef} className="leaderboard-table">
                <div className="table-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-player">Player</div>
                  <div className="col-league">League</div>
                  <div className="col-wpm">Highest WPM</div>
                  <div className="col-avgwpm">Avg WPM</div>
                  <div className="col-avgacc">Avg Accuracy</div>
                  <div className="col-matches">Matches</div>
                </div>
                {leaderboardData.length === 0 ? (
                  <div className="empty-state">
                    <p>No players found for this mode yet. Be the first!</p>
                  </div>
                ) : (
                  leaderboardData.map((entry, index) => {
                    const league = getLeague(entry.wpm, entry.rank <= 100);
                    return (
                      <div key={entry.userId || index} className="leaderboard-row">
                        <div className="col-rank">
                          <span className="rank-icon">{getRankIcon(entry.rank)}</span>
                        </div>
                        <div className="col-player">
                          <div className="player-avatar">
                            {entry.avatar ? (
                              <img src={entry.avatar} alt={entry.displayName} />
                            ) : (
                              <div className="avatar-placeholder-small">
                                {entry.displayName?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <span className="player-name">{entry.displayName || 'Anonymous'}</span>
                        </div>
                        <div className="col-league">
                          <div className="league-badge-small" style={{ borderColor: league.color }}>
                            <span className="league-icon-small">{league.icon}</span>
                          </div>
                        </div>
                        <div className="col-wpm">
                          <span className="wpm-value">{entry.wpm}</span>
                        </div>
                        <div className="col-avgwpm">
                          <span className="avgwpm-value">{entry.avgWpm ?? 0}</span>
                        </div>
                        <div className="col-avgacc">
                          <span className="avgacc-value">{entry.avgAccuracy ?? 0}%</span>
                        </div>
                        <div className="col-matches">
                          <span className="matches-value">{entry.matchesPlayed ?? 0}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default Leaderboard;
