// src/pages/HomePage.jsx
const mockBiens = [
  {
    id: 1,
    titre: "Appartement 3 pièces",
    ville: "Porto-Novo",
    loyer: "120 000 FCFA / mois",
  },
  {
    id: 2,
    titre: "Appartement 3 pièces",
    ville: "Porto-Novo",
    loyer: "120 000 FCFA / mois",
  },
  {
    id: 3,
    titre: "Appartement 3 pièces",
    ville: "Porto-Novo",
    loyer: "120 000 FCFA / mois",
  },
  {
    id: 4,
    titre: "Appartement 3 pièces",
    ville: "Porto-Novo",
    loyer: "120 000 FCFA / mois",
  },
];

const HomePage = () => {
  return (
    <div className="container py-4">
      <div className="row g-4">
        {/* Colonne gauche : texte */}
        <div className="col-md-4">
          <p className="fw-semibold mb-3">
            Plateforme de gestion entre propriétaires et locataires :
          </p>
          <p className="text-muted mb-1">contrats, paiements, visites</p>
          <p className="text-muted mb-1">et problèmes de maintenance.</p>
        </div>

        {/* Colonne droite : 4 biens (photos + bandeau bleu) */}
        <div className="col-md-8">
          <div className="row g-4">
            {mockBiens.map((bien) => (
              <div className="col-md-6" key={bien.id}>
                <div className="property-tile">
                  {/* Remplace ce bloc gris par une vraie photo plus tard */}
                  <div className="property-tile__photo" />
                  <div className="property-tile__footer">
                    <div>{bien.titre}</div>
                    <div className="small">
                      {bien.ville} – {bien.loyer}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center mt-5 footer-slogan">
        La gestion et sécurité de vos biens notre priorité
      </div>
    </div>
  );
};

export default HomePage;
