import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/design-system.css';

const SidebarModern = ({ user: propUser }) => {
  const { user: contextUser } = React.useContext(AuthContext);
  const user = propUser || contextUser;
  const location = useLocation();

  const ownerLinks = [
    { name: 'Tableau de bord', path: '/owner-dashboard' },
    { name: 'Mes Biens', path: '/owner/properties' },
    { name: 'Visites', path: '/owner/visits' },
    { name: 'Paiements', path: '/owner/payments' },
    { name: 'Documents', path: '/owner/documents' },
    { name: 'Alertes', path: '/owner/alertes' },
    { name: 'Messagerie', path: '/messaging' },
    { name: 'Inviter Locataire', path: '/owner/inviter-locataire' },
  ];

  const tenantLinks = [
    { name: 'Recherche', path: '/tenant/properties' },
    { name: 'Mes Locations', path: '/tenant/rentals' },
    { name: 'Entretien', path: '/tenant/entretien' },
    { name: 'Messagerie', path: '/tenant/messaging' },
    { name: 'Signaler', path: '/tenant/report' },
    { name: 'Paiements', path: '/tenant/payment' },
  ];

  const role = user?.type || user?.type_utilisateur;
  const links = role === 'proprietaire' ? ownerLinks : tenantLinks;

  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="sidebar-modern">
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo-section">
          <div className="logo-text animate-fade-in">
            <h1 className="logo-immogest">ImmoGest</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">
            {user?.type === 'proprietaire' || user?.type_utilisateur === 'proprietaire' 
              ? 'Propriétaire' 
              : 'Locataire'
            }
          </div>
          <ul className="nav-list">
            {links.map((link, index) => {
              const isActive = isActiveLink(link.path);
              
              return (
                <li key={index} className="nav-item">
                  <NavLink
                    to={link.path}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    style={{ textDecoration: 'none', outline: 'none', border: 'none' }}
                  >
                    <div className="nav-content">
                      {link.icon ? (
                        <i className="bi bi-bell nav-icon"></i>
                      ) : (
                        <span className="nav-text">{link.name}</span>
                      )}
                    </div>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <style>{`
        .sidebar-modern {
          width: 200px;
          height: 100vh;
          background: #1a202c;
          border-right: 1px solid #2d3748;
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
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #2d3748;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 50px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .logo-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          line-height: 1.1;
        }

        .logo-subtitle {
          font-size: 0.6rem;
          color: #a0aec0;
          margin: 0;
          margin-top: 0px;
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

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 0.4rem;
        }

        .nav-section {
          margin-bottom: 1.5rem;
        }

        .nav-section-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #718096;
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
          padding: 0.35rem 0.6rem;
          border-radius: 0.4rem;
          text-decoration: none !important;
          color: #a0aec0;
          transition: all 250ms ease-in-out;
          position: relative;
          min-height: 30px;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .nav-link:hover {
          background: #2d3748;
          color: #ffffff;
          text-decoration: none !important;
        }

        .nav-link.active {
          background: #4a5568;
          color: #ffffff;
          font-weight: 600;
          text-decoration: none !important;
        }

        .nav-content {
          flex: 1;
          min-width: 0;
        }

        .nav-description {
          display: block;
          font-size: 0.75rem;
          color: #9ca3af;
          line-height: 1.2;
          margin-top: 2px;
        }

        .nav-icon {
          font-size: 1.2rem;
          color: #a0aec0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-link.active .nav-icon {
          color: #ffffff;
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
