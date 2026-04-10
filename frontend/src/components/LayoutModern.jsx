import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import SidebarModern from './SidebarModern';
import TopHeader from './TopHeader';
import '../styles/design-system.css';
import '../App.css';

const LayoutModern = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <SidebarModern />

      {/* Main Content */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Header */}
        <TopHeader />

        {/* Page Content */}
        <div className="content-container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default LayoutModern;
