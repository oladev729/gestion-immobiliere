import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SearchProvider, useSearch } from './context/SearchContext.jsx';
import SidebarModern from './components/SidebarModern';
import TopHeader from './components/TopHeader';
import Login from './pages/Login';
import RegisterStepRole from "./pages/RegisterStepRole";
import VisitorRequest from "./pages/VisitorRequest";
import InviterVisiteur from "./pages/owner/InviterVisiteur";
import RegisterFromInvite from "./pages/RegisterFromInvite";
import Register from './pages/Register';
import VisitorAlerts from "./pages/VisitorAlerts";
import VisitorLogin from "./pages/VisitorLogin";



// Pages Propriétaire
import OwnerProperties from './pages/owner/OwnerProperties';
import OwnerDashboardModern from './pages/owner/OwnerDashboardModern';
import Contracts from './pages/owner/Contracts';
import MaintenanceRecues from './pages/owner/MaintenanceRecues';
import VisitRequests from './pages/owner/VisitRequests';
import OwnerPayments from './pages/owner/OwnerPayments';
import DocumentGeneratorPage from './pages/owner/DocumentGeneratorPage';
import AlertesAvanceesPage from './pages/owner/AlertesAvanceesPage';


// Pages Locataire
import AvailableProperties from './pages/tenant/AvailableProperties';
import TenantRentals from './pages/tenant/TenantRentals';
import ReportIssue from './pages/tenant/ReportIssue';
import TenantPayment from './pages/tenant/TenantPayment';
import HomePage from './pages/HomePage';
import Messaging from './pages/Messaging';
import VisitorMessaging from './pages/VisitorMessaging';
import VisitorDashboard from './pages/VisitorDashboard';


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
    
    // Support pour les visiteurs (email stocké dans localStorage)
    const visitorEmail = localStorage.getItem('visitor_email');
    
    // Si c'est un visiteur, on simule un objet utilisateur pour la sidebar
    const currentUser = user || (visitorEmail ? { email: visitorEmail, type_utilisateur: 'visiteur' } : null);

    if (!currentUser) return <Navigate to="/login" />;

    return (
        <div className="main-layout">
            <SidebarModern user={currentUser} />
            <div className="main-content">
                <TopHeader user={currentUser} onSearch={setSearchTerm} />
                <div className="content-container">
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
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register/role" element={<PublicRoute><RegisterStepRole /></PublicRoute>} />
                         <Route path="/visitor-request" element={<VisitorRequest />} />
                         <Route path="/visitor/dashboard" element={<VisitorDashboard />} />
                          <Route path="/confirm-invitation" element={<RegisterFromInvite />} />
                         <Route path="/register" element={<Register />} />
                         <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />

                        {/* Routes Propriétaire */}
                        <Route path="/owner-dashboard" element={<Layout><OwnerDashboardModern /></Layout>} />
                        <Route path="/owner/inviter-visiteur" element={<Layout><InviterVisiteur /></Layout>} />
                        <Route path="/owner/properties" element={<Layout><OwnerProperties /></Layout>} />
                        <Route path="/owner/contracts" element={<Layout><Contracts /></Layout>} />
                        <Route path="/owner/maintenance" element={<Layout><MaintenanceRecues /></Layout>} />
                        <Route path="/owner/visits" element={<Layout><VisitRequests /></Layout>} />
                        <Route path="/owner/payments" element={<Layout><OwnerPayments /></Layout>} />
                        <Route path="/owner/documents" element={<Layout><DocumentGeneratorPage /></Layout>} />
                        <Route path="/owner/alertes" element={<Layout><AlertesAvanceesPage /></Layout>} />
                        <Route path="/messaging" element={
                            <AuthContext.Consumer>
                                {({ user }) => user ? <Layout><Messaging /></Layout> : <Messaging />}
                            </AuthContext.Consumer>
                        } />
                        <Route path="/messaging/:userId?" element={<Layout><Messaging /></Layout>} />

                        {/* Routes Locataire */}
                        <Route path="/tenant/properties" element={<Layout><AvailableProperties /></Layout>} />
                        <Route path="/tenant/rentals" element={<Layout><TenantRentals /></Layout>} />
                        <Route path="/tenant/report" element={<Layout><ReportIssue /></Layout>} />
                        <Route path="/tenant/payment" element={<Layout><TenantPayment /></Layout>} />

                        {/* Routes Visiteur (réutilisation de certaines pages existantes) */}
                        <Route path="/visitor/properties" element={<Layout><AvailableProperties /></Layout>} />
                         <Route path="/visitor/dashboard" element={<Layout><VisitorDashboard /></Layout>} />
                         <Route path="/visitor/messaging" element={<VisitorMessaging />} />
                         <Route path="/visitor/login" element={<VisitorLogin />} />

                        <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                </Router>
            </SearchProvider>
        </AuthProvider>
    );
}


export default App;
