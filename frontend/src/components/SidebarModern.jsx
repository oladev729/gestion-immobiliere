import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/design-system.css';

const SidebarModern = () => {
  const { user, logout } = React.useContext(AuthContext);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const ownerLinks = [
    { 
      name: 'Tableau de bord', 
      path: '/owner-dashboard', 
      icon: '🏠',
      description: 'Vue d\'ensemble'
    },
    { 
      name: 'Mes Biens', 
      path: '/owner/properties', 
      icon: '🏢',
      description: 'Gérer vos propriétés'
    },
    { 
      name: 'Contrats', 
      path: '/owner/contracts', 
      icon: '📄',
      description: 'Baux locatifs'
    },
    { 
      name: 'Maintenance', 
      path: '/owner/maintenance', 
      icon: '🔧',
      description: 'Demandes de maintenance'
    },
    { 
      name: 'Visites', 
      path: '/owner/visits', 
      icon: '📅',
      description: 'Demandes de visite'
    },
    { 
      name: 'Paiements', 
      path: '/owner/payments', 
      icon: '💰',
      description: 'Suivi des loyers'
    },
  ];

  const tenantLinks = [
    { 
      name: 'Recherche', 
      path: '/tenant/properties', 
      icon: '🔍',
      description: 'Trouver un bien'
    },
    { 
      name: 'Mes Locations', 
      path: '/tenant/rentals', 
      icon: '🔑',
      description: 'Mes contrats'
    },
    { 
      name: 'Signaler', 
      path: '/tenant/report', 
      icon: '⚠️',
      description: 'Problèmes et maintenance'
    },
    { 
      name: 'Paiements', 
      path: '/tenant/payment', 
      icon: '💳',
      description: 'Payer mon loyer'
    },
  ];

  const links = user?.type === 'proprietaire' || user?.type_utilisateur === 'proprietaire' 
    ? ownerLinks 
    : tenantLinks;

  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={`sidebar-modern ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo-section">
          <div className="logo-icon">
            🏢
          </div>
          {!isCollapsed && (
            <div className="logo-text animate-fade-in">
              <h1 className="logo-title">ImmoGest</h1>
              <p className="logo-subtitle">Gestion Immobilière</p>
            </div>
          )}
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Développer" : "Réduire"}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          {!isCollapsed && (
            <div className="nav-section-title">
              {user?.type === 'proprietaire' || user?.type_utilisateur === 'proprietaire' 
                ? 'Propriétaire' 
                : 'Locataire'
              }
            </div>
          )}
          <ul className="nav-list">
            {links.map((link, index) => {
              const isActive = isActiveLink(link.path);
              
              return (
                <li key={index} className="nav-item">
                  <NavLink
                    to={link.path}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? `${link.name} - ${link.description}` : ''}
                  >
                    <span className="nav-icon">
                      {link.icon}
                    </span>
                    {!isCollapsed && (
                      <div className="nav-content">
                        <span className="nav-text">{link.name}</span>
                        <span className="nav-description">{link.description}</span>
                      </div>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="nav-indicator" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User Section */}
      <div className="sidebar-footer">
        <div className="user-section">
          <div className="user-avatar">
            <div className="avatar-circle">
              {user?.prenoms?.[0] || 'U'}
            </div>
          </div>
          {!isCollapsed && (
            <div className="user-info animate-fade-in">
              <div className="user-name">{user?.prenoms} {user?.nom}</div>
              <div className="user-role">
                {user?.type || user?.type_utilisateur}
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={logout}
          className="logout-btn"
          title={isCollapsed ? "Se déconnecter" : ""}
        >
          🚪 {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>

      <style jsx>{`
        .sidebar-modern {
          width: ${isCollapsed ? '80px' : '280px'};
          height: 100vh;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border-right: 1px solid var(--gray-200);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 1000;
          transition: width 250ms ease-in-out;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--gray-200);
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 80px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .logo-icon {
          flex-shrink: 0;
          font-size: 2rem;
        }

        .logo-text {
          flex: 1;
        }

        .logo-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #3b82f6;
          margin: 0;
          line-height: 1.2;
        }

        .logo-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          margin-top: 2px;
        }

        .collapse-btn {
          background: none;
          border: none;
          padding: 0.5rem;
          border-radius: 0.5rem;
          color: #9ca3af;
          cursor: pointer;
          transition: all 250ms ease-in-out;
          flex-shrink: 0;
          font-size: 1.2rem;
        }

        .collapse-btn:hover {
          background: #f3f4f6;
          color: #4b5563;
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .nav-section {
          margin-bottom: 1.5rem;
        }

        .nav-section-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
          padding: 0 0.5rem;
        }

        .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .nav-item {
          margin-bottom: 0.25rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: 0.75rem;
          text-decoration: none;
          color: #6b7280;
          transition: all 250ms ease-in-out;
          position: relative;
          min-height: 44px;
        }

        .nav-link:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .nav-link.active {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          color: #1d4ed8;
          font-weight: 500;
        }

        .nav-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          font-size: 1.2rem;
        }

        .nav-content {
          flex: 1;
          min-width: 0;
        }

        .nav-text {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.2;
        }

        .nav-description {
          display: block;
          font-size: 0.75rem;
          color: #9ca3af;
          line-height: 1.2;
          margin-top: 2px;
        }

        .nav-indicator {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 20px;
          background: #2563eb;
          border-radius: 9999px;
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--gray-200);
          margin-top: auto;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .user-avatar {
          flex-shrink: 0;
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
          flex: 1;
          min-width: 0;
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

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.75rem;
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 250ms ease-in-out;
          justify-content: center;
        }

        .logout-btn:hover {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar-modern {
            transform: translateX(-100%);
          }
          
          .sidebar-modern.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SidebarModern;
