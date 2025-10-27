// src/components/ProfileDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faRightFromBracket, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './ProfileDropdown.css';

export default function ProfileDropdown({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button 
        className="profile-trigger fx-slide-in" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Profile menu"
      >
        <div className="profile-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.displayName || 'User'} />
          ) : (
            <div className="avatar-initials">
              {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <FontAwesomeIcon 
          icon={faChevronDown} 
          className={`chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="dropdown-header">
            <div className="user-info">
              <div className="user-name">{user?.displayName || 'Anonymous'}</div>
            </div>
          </div>
          
          <div className="dropdown-divider" />
          
          <button className="dropdown-item" onClick={handleProfileClick}>
            <FontAwesomeIcon icon={faUser} />
            <span>My Profile</span>
          </button>
          
          <button className="dropdown-item logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}