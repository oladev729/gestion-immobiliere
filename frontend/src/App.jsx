import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SearchProvider, useSearch } from './context/SearchContext.jsx';
import SidebarModern from './components/SidebarModern';
import TopHeader from './components/TopHeader';
import ImmoGestBrand from './components/ImmoGestBrand';
import Login from './pages/Login';
import RegisterStepRole from "./pages/RegisterStepRole";
import Register from './pages/Register';
import RegisterFromInviteLocataire from './pages/RegisterFromInviteLocataire';

// Pages Propriétaire
import OwnerProperties from './pages/owner/OwnerProperties';
import OwnerDashboardModern from './pages/owner/OwnerDashboardModern';
import Contracts from './pages/owner/Contracts';
import MaintenanceRecues from './pages/owner/MaintenanceRecues';
import VisitRequests from './pages/owner/VisitRequests';
import OwnerPayments from './pages/owner/OwnerPayments';
import DocumentGeneratorPage from './pages/owner/DocumentGeneratorPage';
import AlertesAvanceesPage from './pages/owner/AlertesAvanceesPage';
import InviterLocataire from './pages/owner/InviterLocataire';
import TestData from './pages/owner/TestData';

// Pages Locataire
import AvailableProperties from './pages/tenant/AvailableProperties';
import TenantRentals from './pages/tenant/TenantRentals';
import Entretien from './pages/tenant/Entretien';
import ReportIssue from './pages/tenant/ReportIssue';
import TenantPayment from './pages/tenant/TenantPayment';
import ContractInvitation from './pages/tenant/ContractInvitation';
import TenantMessaging from './pages/tenant/TenantMessaging';
import HomePage from './pages/HomePage';
import Messaging from './pages/Messaging';

const PublicRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (user) {
        return <Navigate to={user.type === 'proprietaire' ? '/owner-dashboard' : '/tenant/properties'} />;
    }
    return children;
};

const Layout = ({ children }) => {
    const { user } = useContext(AuthContext);
    const { setSearchTerm } = useSearch();

    if (!user) return <Navigate to="/login" />;

    return (
        <div className="main-layout">
            <SidebarModern user={user} />
            <div className="main-content" style={{ marginLeft: '200px', minHeight: '100vh', background: '#f7fafc' }}>
                <TopHeader user={user} onSearch={setSearchTerm} />
                <div className="content-container" style={{ padding: '20px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <SearchProvider>
                <ImmoGestBrand />
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register/role" element={<PublicRoute><RegisterStepRole /></PublicRoute>} />
                         <Route path="/register" element={<Register />} />
                         <Route path="/register-locataire" element={<RegisterFromInviteLocataire />} />
                         <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />

                        {/* Routes Propriétaire */}
                        <Route path="/owner-dashboard" element={<Layout><OwnerDashboardModern /></Layout>} />
                        <Route path="/owner/properties" element={<Layout><OwnerProperties /></Layout>} />
                        <Route path="/owner/contracts" element={<Layout><Contracts /></Layout>} />
                        <Route path="/owner/maintenance" element={<Layout><MaintenanceRecues /></Layout>} />
                        <Route path="/owner/visits" element={<Layout><VisitRequests /></Layout>} />
                        <Route path="/owner/payments" element={<Layout><OwnerPayments /></Layout>} />
                        <Route path="/owner/documents" element={<Layout><DocumentGeneratorPage /></Layout>} />
                        <Route path="/owner/alertes" element={<Layout><AlertesAvanceesPage /></Layout>} />
                        <Route path="/owner/inviter-locataire" element={<Layout><InviterLocataire /></Layout>} />
                        <Route path="/owner/test-data" element={<Layout><TestData /></Layout>} />
                        <Route path="/messaging" element={
                            <AuthContext.Consumer>
                                {({ user }) => user ? <Layout><Messaging /></Layout> : <Messaging />}
                            </AuthContext.Consumer>
                        } />
                        <Route path="/messaging/:userId?" element={<Layout><Messaging /></Layout>} />

                        {/* Routes Locataire */}
                        <Route path="/tenant/properties" element={<Layout><AvailableProperties /></Layout>} />
                        <Route path="/tenant/rentals" element={<Layout><TenantRentals /></Layout>} />
                        <Route path="/tenant/entretien" element={<Layout><Entretien /></Layout>} />
                        <Route path="/tenant/report" element={<Layout><ReportIssue /></Layout>} />
                        <Route path="/tenant/payment" element={<Layout><TenantPayment /></Layout>} />
                        <Route path="/tenant/contract-invitation" element={<Layout><ContractInvitation /></Layout>} />
                        <Route path="/tenant/messaging" element={<Layout><TenantMessaging /></Layout>} />

                        <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                </Router>
            </SearchProvider>
        </AuthProvider>
    );
}

export default App;
