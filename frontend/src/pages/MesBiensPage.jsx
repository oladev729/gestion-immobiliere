// src/pages/MesBiensPage.jsx
import { useEffect, useState } from "react";
import api from "../api/axiosClient";

const MesBiensPage = () => {
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBiens = async () => {
      try {
        const { data } = await api.get("/biens/mes-biens");
        setBiens(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBiens();
  }, []);

  if (loading) return <div className="container mt-5">Chargement...</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-3">Mes biens</h2>
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>Id</th>
            <th>Titre</th>
            <th>Ville</th>
            <th>Loyer</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {biens.map((b) => (
            <tr key={b.id_bien}>
              <td>{b.id_bien}</td>
              <td>{b.titre}</td>
              <td>{b.ville}</td>
              <td>{b.loyer_mensuel}</td>
              <td>{b.statut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MesBiensPage;
