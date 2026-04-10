import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/design-system.css';

const TopHeader = () => {
  const { user } = useContext(AuthContext);

  return (
    <header className="top-header">
      {/* Barre de recherche */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Rechercher..."
        />
      </div>

      {/* Menu utilisateur */}
      <div className="user-menu">
        {/* Notifications */}
        <button className="notification-bell">
          <span className="bell-icon">🔔</span>
          <span className="notification-badge">3</span>
        </button>

        {/* Avatar utilisateur */}
        <div className="user-avatar">
          <div className="avatar-circle">
            {user?.prenoms?.[0] || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.prenoms} {user?.nom}</div>
            <div className="user-role">
              {user?.type || user?.type_utilisateur}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .top-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 9999px;
          padding: 0.5rem 1rem;
          width: 400px;
          transition: all 250ms ease-in-out;
        }

        .search-bar:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px #dbeafe;
          background: white;
        }

        .search-icon {
          color: #9ca3af;
          margin-right: 0.5rem;
          font-size: 1rem;
        }

        .search-input {
          border: none;
          background: none;
          outline: none;
          flex: 1;
          font-size: 0.875rem;
          color: #374151;
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .notification-bell {
          position: relative;
          background: #f3f4f6;
          border: none;
          padding: 0.5rem;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 250ms ease-in-out;
        }

        .notification-bell:hover {
          background: #e5e7eb;
        }

        .bell-icon {
          font-size: 1.2rem;
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: white;
          font-size: 0.625rem;
          padding: 2px 6px;
          border-radius: 9999px;
          font-weight: 600;
        }

        .user-avatar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 250ms ease-in-out;
        }

        .user-avatar:hover {
          background: #f3f4f6;
        }

        .avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.2;
        }

        .user-role {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.2;
        }

        @media (max-width: 768px) {
          .top-header {
            padding: 1rem;
          }
          
          .search-bar {
            width: 200px;
          }
          
          .user-info {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default TopHeader;
