// src/api/scores.js
import { auth } from '../firebase';

const API_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  'https://keyrushers-py.onrender.com';

export async function submitScore({
  wpm,
  accuracy,
  actualAccuracy,
  durationSec,
  words,
  chars,
  mode,
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}/api/scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      wpm,
      accuracy,
      actualAccuracy,
      durationSec,
      words,
      chars,
      mode,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Submit failed (${res.status})`);
  }
  return res.json();
}

export async function getLeaderboard(mode = 'all', limit = 100) {
  const res = await fetch(`${API_BASE}/api/scores/leaderboard?mode=${mode}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load leaderboard');
  return res.json();
}

export async function getLeaderboardStats(mode = 'all') {
  const res = await fetch(`${API_BASE}/api/scores/stats?mode=${mode}`);
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}

export async function getUserRank(mode = 'all') {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  
  const res = await fetch(`${API_BASE}/api/scores/user-rank?mode=${mode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load user rank');
  return res.json();
}

export async function getMe() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load profile');
  return res.json();
}

export async function updateMe(patch) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}/api/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}
