import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';


const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);

    const links = user?.type === 'proprietaire' || user?.type_utilisateur === 'proprietaire'
    ? [
      
        { name: 'Mes Biens',        path: '/owner/dashbord' },
        { name: 'Contrats',         path: '/owner/contracts' },
        { name: 'Maintenance',      path: '/owner/maintenance' },
        { name: 'Visites',          path: '/owner/visits' },
        { name: 'Paiements reçus', path: '/owner/payments' },
    ]
    : [
        { name: 'Chercher un bien',    path: '/tenant/properties' },
        { name: 'Mes Locations',       path: '/tenant/rentals' },
        { name: 'Signaler Problème',   path: '/tenant/report' },
        { name: 'Paiements',        path: '/tenant/payment' },
    ];

    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{width: '280px', minHeight: '100vh'}}>
            <h2 className="fs-4 italic border-bottom pb-3">ImmoGest</h2>
            <ul className="nav nav-pills flex-column mb-auto">
                {links.map((link, index) => (
                    <li key={index} className="nav-item">
                        <NavLink
                            to={link.path}
                            className={({ isActive }) => isActive ? "nav-link active" : "nav-link text-white"}
                        >
                            {link.name}
                        </NavLink>
                    </li>
                ))}
            </ul>
            <hr />
            <div className="dropdown">
                <p className="mb-0">{user?.prenoms} (MENU)</p>
                <button onClick={logout} className="btn btn-danger btn-sm mt-2 w-100">Déconnexion</button>
            </div>
        </div>
    );
};

export default Sidebar;
