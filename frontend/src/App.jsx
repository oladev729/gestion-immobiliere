import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import SidebarModern from './components/SidebarModern';
import TopHeader from './components/TopHeader';
import Login from './pages/Login';
import RegisterStepRole from "./pages/RegisterStepRole";
import VisitorRequest from "./pages/VisitorRequest";
import InviterVisiteur from "./pages/owner/InviterVisiteur";
import RegisterFromInvite from "./pages/RegisterFromInvite";
import Register from './pages/Register';



// Pages Propriétaire
import OwnerProperties from './pages/owner/OwnerProperties';
import OwnerDashboardModern from './pages/owner/OwnerDashboardModern';
import Contracts from './pages/owner/Contracts';
import MaintenanceRecues from './pages/owner/MaintenanceRecues';
import VisitRequests from './pages/owner/VisitRequests';
import OwnerPayments from './pages/owner/OwnerPayments';


// Pages Locataire
import AvailableProperties from './pages/tenant/AvailableProperties';
import TenantRentals from './pages/tenant/TenantRentals';
import ReportIssue from './pages/tenant/ReportIssue';
import TenantPayment from './pages/tenant/TenantPayment';
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
        <div className="main-layout">
            <SidebarModern />
            <div className="main-content">
                <TopHeader />
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
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register/role" element={<PublicRoute><RegisterStepRole /></PublicRoute>} />
                     <Route path="/visitor-request" element={<VisitorRequest />} />
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

                    {/* Routes Locataire */}
                    <Route path="/tenant/properties" element={<Layout><AvailableProperties /></Layout>} />
                    <Route path="/tenant/rentals" element={<Layout><TenantRentals /></Layout>} />
                    <Route path="/tenant/report" element={<Layout><ReportIssue /></Layout>} />
                    <Route path="/tenant/payment" element={<Layout><TenantPayment /></Layout>} />

                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}


export default App;
