import { Outlet, NavLink } from "react-router-dom";

function App() {
  return (
    <>
      <header className="border-bottom">
        <div className="container py-3 d-flex justify-content-between align-items-center">
          {/* Logo à gauche */}
          <div className="fw-bold fs-4">ImmoLoc</div>

          {/* Menu visiteur à droite */}
          <nav className="d-flex align-items-center gap-4">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                "text-decoration-none" +
                (isActive ? " fw-semibold text-dark" : " text-muted")
              }
            >
              Accueil
            </NavLink>

            <NavLink
              to="/a-propos"
              className={({ isActive }) =>
                "text-decoration-none" +
                (isActive ? " fw-semibold text-dark" : " text-muted")
              }
            >
              À propos
            </NavLink>

            <NavLink
              to="/login"
              className="btn btn-outline-dark btn-sm btn-pill"
            >
              Se connecter
            </NavLink>

            <NavLink
              to="/register"
              className="btn btn-navy btn-sm btn-pill"
            >
              S’inscrire
            </NavLink>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  );
}

export default App;
