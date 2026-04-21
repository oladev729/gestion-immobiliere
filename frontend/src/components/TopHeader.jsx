import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import '../styles/design-system.css';

const TopHeader = ({ onSearch }) => {
  const { user, logout, setUser } = useContext(AuthContext);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [profileForm, setProfileForm] = useState({
      nom: user?.nom || '',
      prenoms: user?.prenoms || '',
      email: user?.email || '',
      telephone: user?.telephone || ''
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Récupérer le nombre et la liste des notifications
  const fetchNotifsCount = async () => {
    try {
        const res = await api.get('/notifications/count');
        setNotifCount(res.data.count);
    } catch (err) { console.error(err); }
  };

  const fetchNotifications = async () => {
      try {
          const res = await api.get('/notifications');
          setNotifications(res.data);
      } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchNotifsCount();
    const interval = setInterval(fetchNotifsCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleNotifications = () => {
      if (!showNotifications) fetchNotifications();
      setShowNotifications(!showNotifications);
      setShowProfile(false);
  };

  const markAsRead = async (id) => {
      try {
          await api.patch(`/notifications/${id}/lire`);
          fetchNotifsCount();
          fetchNotifications();
      } catch (err) { console.error(err); }
  };

  const handleUpdateProfile = async (e) => {
      e.preventDefault();
      setSaving(true);
      setMsg({ text: '', type: '' });
      try {
          const res = await api.put('/auth/profile', profileForm);
          setUser({ ...user, ...res.data.user });
          setMsg({ text: 'Profil mis à jour !', type: 'success' });
          setTimeout(() => setShowProfile(false), 1500);
      } catch (err) {
          setMsg({ text: err.response?.data?.message || 'Erreur lors de la mise à jour', type: 'error' });
      } finally {
          setSaving(false);
      }
  };

  return (
    <header className="top-header">
      {/* Barre de recherche */}
      <div className="search-bar">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Rechercher..."
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>

      {/* Menu utilisateur */}
      <div className="user-menu">
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
            <button className="notification-bell" title="Notifications" onClick={toggleNotifications}>
                <span className="bell-text">Alertes</span>
                {notifCount > 0 && <span className="notification-badge">{notifCount}</span>}
            </button>

            {/* DROP DOWN NOTIFICATIONS */}
            {showNotifications && (
                <div className="notifications-dropdown animate-slide-down">
                    <div className="dropdown-header">
                        <h4>Notifications</h4>
                        {notifCount > 0 && <span className="badge-new">{notifCount} nouvelles</span>}
                    </div>
                    <div className="notifications-list">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div key={n.id_notification} className={`notif-item ${!n.lue ? 'unread' : ''}`} onClick={() => !n.lue && markAsRead(n.id_notification)}>
                                    <div className="notif-content">
                                        <div className="notif-title">{n.titre}</div>
                                        <div className="notif-message">{n.message}</div>
                                        <div className="notif-time">{new Date(n.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    {!n.lue && <div className="unread-dot"></div>}
                                </div>
                            ))
                        ) : (
                            <div className="empty-notifs">Aucune notification</div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Avatar utilisateur avec Dropdown */}
        <div className="profile-container" style={{ position: 'relative' }}>
          <div className="user-avatar" onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}>
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

          {/* PANNEAU DÉROULANT DU PROFIL */}
          {showProfile && (
            <div className="profile-dropdown animate-slide-down">
                <div className="dropdown-header">
                    <h4>Mon profil</h4>
                    <p>{user?.email}</p>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="profile-form">
                    <div className="form-group-sm">
                        <label>Prénoms</label>
                        <input type="text" value={profileForm.prenoms} onChange={e => setProfileForm({...profileForm, prenoms: e.target.value})} required />
                    </div>
                    <div className="form-group-sm">
                        <label>Nom</label>
                        <input type="text" value={profileForm.nom} onChange={e => setProfileForm({...profileForm, nom: e.target.value})} required />
                    </div>
                    <div className="form-group-sm">
                        <label>Email</label>
                        <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} required />
                    </div>
                    
                    {msg.text && <div className={`msg-alert ${msg.type}`}>{msg.text}</div>}
                    
                    <button type="submit" className="save-profile-btn" disabled={saving}>
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </form>

                <div className="dropdown-divider"></div>
                
                <button onClick={logout} className="logout-dropdown-btn">
                    Se déconnecter
                </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .top-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 0.25rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.2rem 0.5rem;
          width: 250px;
          transition: all 0.2s ease;
        }

        .search-bar:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          background: white;
        }

        .search-input {
          border: none;
          background: none;
          outline: none;
          flex: 1;
          font-size: 0.75rem;
          color: #1e293b;
          text-decoration: none !important;
        }

        .user-menu { display: flex; align-items: center; gap: 1.5rem; }

        .notification-bell {
          position: relative;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          color: #475569;
          font-size: 0.7rem;
          text-decoration: none !important;
        }

        .notification-bell:hover { background: #f1f5f9; border-color: #cbd5e1; }

        .notification-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          min-width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          border: 2px solid white;
        }

        .user-avatar {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0.4rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          text-decoration: none !important;
        }

        .user-avatar:hover {
          background: #f8fafc;
          border-color: #e2e8f0;
        }

        .avatar-circle {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.75rem;
          box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
        }

        .user-info { display: flex; flex-direction: column; }
        .user-name { font-size: 0.75rem; font-weight: 600; color: #1e293b; }
        .user-role { font-size: 0.6rem; color: #64748b; text-transform: capitalize; }

        .profile-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            width: 280px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
            border: 1px solid #e2e8f0;
            padding: 1.25rem;
            z-index: 2000;
        }

        .notifications-dropdown {
            position: absolute;
            top: calc(100% + 15px);
            right: 0;
            width: 380px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
            border: 1px solid #e2e8f0;
            z-index: 2000;
            overflow: hidden;
        }

        .notifications-dropdown .dropdown-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
        }

        .badge-new {
            background: #dbeafe;
            color: #1e40af;
            font-size: 0.65rem;
            padding: 1px 6px;
            border-radius: 9999px;
            font-weight: 700;
        }

        .notifications-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .notif-item {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
            text-decoration: none !important;
        }

        .notif-item:hover { background: #f8fafc; }
        .notif-item.unread { background: #f0f7ff; }
        .notif-item.unread:hover { background: #e0efff; }

        .unread-dot {
            width: 8px;
            height: 8px;
            background: #3b82f6;
            border-radius: 50%;
            margin-top: 5px;
            flex-shrink: 0;
        }

        .notif-content { flex: 1; }
        .notif-title { font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 0.2rem; }
        .notif-message { font-size: 0.8rem; color: #64748b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .notif-time { font-size: 0.7rem; color: #94a3b8; margin-top: 0.5rem; }

        .empty-notifs {
            padding: 3rem 1.5rem;
            text-align: center;
            color: #94a3b8;
            font-size: 0.85rem;
        }

        .dropdown-header { margin-bottom: 1.25rem; }
        .dropdown-header h4 { margin: 0; color: #1e293b; font-size: 1rem; }
        .dropdown-header p { margin: 0; color: #64748b; font-size: 0.8rem; }

        .profile-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-group-sm { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group-sm label { font-size: 0.75rem; font-weight: 600; color: #475569; }
        .form-group-sm input {
            padding: 0.6rem;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            font-size: 0.85rem;
            outline: none;
            transition: border 0.2s;
            text-decoration: none !important;
        }
        .form-group-sm input:focus { border-color: #3b82f6; }

        .save-profile-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 0.75rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: filter 0.2s;
            margin-top: 0.5rem;
            text-decoration: none !important;
        }
        .save-profile-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .save-profile-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .msg-alert { font-size: 0.8rem; padding: 0.5rem; border-radius: 6px; text-align: center; }
        .msg-alert.success { background: #f0fdf4; color: #166534; }
        .msg-alert.error { background: #fef2f2; color: #991b1b; }

        .dropdown-divider { height: 1px; background: #f1f5f9; margin: 1.25rem 0; }

        .logout-dropdown-btn {
            width: 100%;
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fee2e2;
            padding: 0.7rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none !important;
        }
        .logout-dropdown-btn:hover { background: #fee2e2; }

        .animate-slide-down {
            animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .search-bar { width: 150px; }
          .user-name, .user-role { display: none; }
        }
      `}</style>
    </header>
  );
};

export default TopHeader;
