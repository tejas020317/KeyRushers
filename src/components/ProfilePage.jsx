import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faCalendarAlt,
  faCheckCircle,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { getMe, updateMe, getUserRank } from '../api/scores';
import './ProfilePage.css';

// Preset avatars using DiceBear API
const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/notionists/svg?seed=Blitz&backgroundColor=ffb6b9',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sunny&backgroundColor=fce38a',
  'https://api.dicebear.com/7.x/micah/svg?seed=Kai&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Aria&backgroundColor=ffc3a0',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ash&backgroundColor=a8e6cf',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Nova&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/micah/svg?seed=Riven&backgroundColor=f9c6c9',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Orion&backgroundColor=c5e4a5',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Midnight&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jasper&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/micah/svg?seed=Skye&backgroundColor=74b9ff',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Vega&backgroundColor=ffdfbf',
];

const LEAGUES = {
  bronze: { name: 'Bronze', icon: '🥉', min: 0, max: 14, color: '#CD7F32' },
  silver: { name: 'Silver', icon: '🥈', min: 15, max: 29, color: '#C0C0C0' },
  gold: { name: 'Gold', icon: '🥇', min: 30, max: 44, color: '#FFD700' },
  platinum: { name: 'Platinum', icon: '💎', min: 45, max: 59, color: '#E5E4E2' },
  diamond: { name: 'Diamond', icon: '💠', min: 60, max: 74, color: '#B9F2FF' },
  master: { name: 'Master', icon: '👑', min: 75, max: 89, color: '#8A2BE2' },
  grandmaster: { name: 'Grandmaster', icon: '⚡', min: 90, max: Infinity, color: '#FFD700' },
};

function getLeague(wpm, isTop100 = false) {
  if (isTop100 && wpm >= 75) return LEAGUES.grandmaster;
  for (const [key, league] of Object.entries(LEAGUES)) {
    if (key === 'grandmaster') continue;
    if (wpm >= league.min && wpm <= league.max) return league;
  }
  return LEAGUES.bronze;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Form fields (initialize as empty strings to avoid undefined length)
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('');
  const [avatar, setAvatar] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const fileInputRef = useRef(null);
  const previousPath = location.state?.from;

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!profile) return;
    const changed =
      (displayName ?? '') !== (profile.displayName ?? '') ||
      (bio ?? '') !== (profile.bio ?? '') ||
      (birthdate ?? '') !== (profile.birthdate ?? '') ||
      (gender ?? '') !== (profile.gender ?? '') ||
      (avatar ?? '') !== (profile.avatar ?? '');
    setHasChanges(changed);
  }, [displayName, bio, birthdate, gender, avatar, profile]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getMe();
      setProfile(data);
      // Coalesce to empty strings to keep inputs controlled and length safe
      setDisplayName(data.displayName ?? '');
      setBio(data.bio ?? '');
      setBirthdate(data.birthdate ?? '');
      setGender(data.gender ?? '');
      setAvatar(data.avatar ?? '');

      // Fetch user rank
      const rankData = await getUserRank('all');
      const league = getLeague(rankData.wpm, rankData.rank <= 100);
      setUserRank({ ...rankData, league, isTop100: rankData.rank <= 100 });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError('');
      await updateMe({ displayName, bio, birthdate, gender, avatar });
      setSuccess('Profile updated successfully!');
      setHasChanges(false);
      setTimeout(() => {
        setSuccess('');
        navigate(previousPath || '/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    navigate(previousPath || '/');
  };

  const handleAvatarChange = (newAvatar) => {
    setAvatar(newAvatar);
    setShowAvatarPicker(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB. Please choose a smaller image or use preset avatars.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result || '';
      if ((base64?.length ?? 0) > 100000) {
        setError('Image is too large after encoding. Please choose a smaller image or use preset avatars.');
        return;
      }
      handleAvatarChange(base64);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-content">
          <h1 className="profile-title">My Profile</h1>

          {error && (
            <div className="profile-error">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              {error}
            </div>
          )}

          {success && (
            <div className="profile-success">
              <FontAwesomeIcon icon={faCheckCircle} />
              {success}
            </div>
          )}

          <div className="profile-form">
            {/* Avatar Section */}
            <div className="avatar-section">
              <div className="avatar-display-large">
                {avatar ? (
                  <img src={avatar} alt="Profile" />
                ) : (
                  <div className="avatar-placeholder-large">
                    {displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <button
                  className="avatar-edit-btn-large"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  type="button"
                >
                  <FontAwesomeIcon icon={faCamera} />
                </button>
              </div>

              {showAvatarPicker && (
                <div className="avatar-picker-card">
                  <h3>Choose Your Avatar</h3>
                  <button
                    className="upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <FontAwesomeIcon icon={faCamera} /> Upload from Device
                  </button>
                  <div className="upload-info">Max size: 100KB • Supported: JPG, PNG, GIF</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <div className="preset-avatars">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        className={`preset-avatar ${avatar === url ? 'selected' : ''}`}
                        onClick={() => handleAvatarChange(url)}
                        type="button"
                      >
                        <img src={url} alt={`Avatar ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Stats - League & Rank */}
            {userRank && (
              <div className="profile-stats">
                <div className="stat-card league-card">
                  <span className="league-icon-large" style={{ color: userRank.league.color }}>
                    {userRank.league.icon}
                  </span>
                  <div>
                    <span className="stat-label">League</span>
                    <span className="stat-value" style={{ color: userRank.league.color }}>
                      {userRank.league.name}
                    </span>
                  </div>
                </div>
                <div className="stat-card rank-card">
                  <div>
                    <span className="stat-label">Global Rank</span>
                    <span className="stat-value">{userRank.rank}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Display Name */}
            <div className="form-row">
              <label className="field-label">Display Name</label>
              <input
                type="text"
                className="field-input"
                value={displayName ?? ''}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
              />
            </div>

            {/* Email (Non-editable) */}
            <div className="form-row">
              <label className="field-label">Email</label>
              <div className="field-locked-wrapper">
                <input
                  type="email"
                  className="field-input locked"
                  value={profile?.email || 'No email'}
                  disabled
                />
                <span className="lock-icon">🔒</span>
              </div>
            </div>

            {/* Bio */}
            <div className="form-row">
              <label className="field-label">Bio</label>
              <textarea
                className="field-textarea"
                value={bio ?? ''}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={500}
              />
              <div className="char-count">{(bio?.length ?? 0)}/500</div>
            </div>

            {/* Birthdate */}
            <div className="form-row">
              <label className="field-label">Birthdate</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  className="field-input date-input"
                  value={birthdate ?? ''}
                  onChange={(e) => setBirthdate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Gender */}
            <div className="form-row">
              <label className="field-label">Gender</label>
              <select
                className="field-select"
                value={gender ?? ''}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button className="btn-cancel" onClick={handleCancel} type="button">
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSaveAll}
                disabled={!hasChanges || saving}
                type="button"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
