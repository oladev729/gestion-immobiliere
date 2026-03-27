import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';

// Pages Propriétaire
import MyProperties from './pages/owner/MyProperties';
import OwnerProperties from './pages/owner/OwnerProperties';
import Contracts from './pages/owner/Contracts';
import MaintenanceRecues from './pages/owner/MaintenanceRecues';
import VisitRequests from './pages/owner/VisitRequests';

// Pages Locataire
import AvailableProperties from './pages/tenant/AvailableProperties';
import TenantRentals from './pages/tenant/TenantRentals';
import ReportIssue from './pages/tenant/ReportIssue';
import HomePage from './pages/HomePage';

const PublicRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (user) {
        return <Navigate to={user.type === 'proprietaire' ? '/owner-dashboard' : '/tenant/properties'} />;
    }
    return children;
};
const Layout = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" />;

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1 p-4">
                {children}
            </div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Routes Propriétaire */}
                    <Route path="/owner-dashboard" element={<Layout><MyProperties /></Layout>} />
                    <Route path="/owner/properties" element={<Layout><OwnerProperties /></Layout>} />
                    <Route path="/owner/contracts" element={<Layout><Contracts /></Layout>} />
                    <Route path="/owner/maintenance" element={<Layout><MaintenanceRecues /></Layout>} />
                    <Route path="/owner/visits" element={<Layout><VisitRequests /></Layout>} />

                    {/* Routes Locataire */}
                    <Route path="/tenant/properties" element={<Layout><AvailableProperties /></Layout>} />
                    <Route path="/tenant/rentals" element={<Layout><TenantRentals /></Layout>} />
                    <Route path="/tenant/report" element={<Layout><ReportIssue /></Layout>} />

                    <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
