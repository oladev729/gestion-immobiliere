import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/design-system.css';

const SidebarModern = () => {
  const { user } = React.useContext(AuthContext);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const ownerLinks = [
    { name: 'Tableau de bord', path: '/owner-dashboard', description: 'Vue d\'ensemble' },
    { name: 'Mes Biens', path: '/owner/properties', description: 'Gérer vos propriétés' },
    { name: 'Contrats', path: '/owner/contracts', description: 'Baux locatifs' },
    { name: 'Maintenance', path: '/owner/maintenance', description: 'Demandes de maintenance' },
    { name: 'Visites', path: '/owner/visits', description: 'Demandes de visite' },
    { name: 'Paiements', path: '/owner/payments', description: 'Suivi des loyers' },
    { name: 'Messagerie', path: '/messaging', description: 'Discuter avec les visiteurs' },
    { name: 'Inviter Visiteur', path: '/owner/inviter-visiteur', description: 'Gérer les nouvelles demandes' },
  ];

  const tenantLinks = [
    { name: 'Recherche', path: '/tenant/properties', description: 'Trouver un bien' },
    { name: 'Mes Locations', path: '/tenant/rentals', description: 'Mes contrats' },
    { name: 'Signaler', path: '/tenant/report', description: 'Problèmes et maintenance' },
    { name: 'Paiements', path: '/tenant/payment', description: 'Payer mon loyer' },
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
          style={{ fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}
        >
          {isCollapsed ? 'MENU' : 'REDUIRE'}
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
                    style={{ textDecoration: 'none', outline: 'none', border: 'none' }}
                  >
                    {!isCollapsed && (
                      <div className="nav-content">
                        <span className="nav-text">{link.name}</span>
                        <span className="nav-description">{link.description}</span>
                      </div>
                    )}
                    {isCollapsed && (
                       <span className="nav-text-collapsed">{link.name[0]}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <style>{`
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
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          text-decoration: none !important;
          color: #6b7280;
          transition: all 250ms ease-in-out;
          position: relative;
          min-height: 44px;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .nav-link:hover {
          background: #f3f4f6;
          color: #1f2937;
          text-decoration: none !important;
        }

        .nav-link.active {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          color: #1d4ed8;
          font-weight: 600;
          text-decoration: none !important;
        }

        .nav-content {
          flex: 1;
          min-width: 0;
        }

        .nav-text {
          display: block;
          font-size: 0.95rem;
          font-weight: 500;
          line-height: 1.2;
        }

        .nav-text-collapsed {
           font-size: 1.2rem;
           font-weight: 700;
           color: #3b82f6;
        }

        .nav-description {
          display: block;
          font-size: 0.75rem;
          color: #9ca3af;
          line-height: 1.2;
          margin-top: 2px;
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
