import { useState, useEffect } from 'react';
import api from '../../api/axios';


export default function TenantRentals() {
  const [contrats, setContrats] = useState([]);
    const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContrats();
  }, []);

  const fetchContrats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contrats/mes-contrats-locataire');
      const data = res.data;
      setContrats(data);
    } catch (err) {
      setError('Impossible de charger vos locations.');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'actif': return 'success';
      case 'termine': return 'secondary';
      case 'resilie': return 'danger';
      default: return 'info';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return parseFloat(montant).toLocaleString('fr-FR') + ' FCFA';
  };

  const handleAccept = async (id) => {
    if (!window.confirm('Voulez-vous vraiment accepter ce contrat ?')) return;
    try {
      await api.patch(`/contrats/${id}/accepter`);
      alert('Contrat accepté avec succès !');
      fetchContrats();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'acceptation");
    }
  };

  const handleView = (contrat) => {
    const printWindow = window.open('', '_blank');
    const dateSignature = contrat.date_signature ? new Date(contrat.date_signature).toLocaleDateString('fr-FR') : 'Non signé';
    
    const htmlContent = `
      <html>
        <head>
          <title>CONTRAT DE BAIL - ${contrat.numero_contrat}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; padding: 40px; max-width: 800px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; text-transform: uppercase; font-size: 24px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-bottom: 10px; color: #1e40af; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-box { border: 1px solid #ccc; width: 250px; height: 120px; padding: 10px; font-size: 12px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Contrat de Bail d'Habitation</h1>
            <p>Référence : <strong>${contrat.numero_contrat}</strong></p>
          </div>

          <div class="section">
            <div class="section-title">1. LES PARTIES</div>
            <p><strong>LE BAILLEUR :</strong> M./Mme ${contrat.proprietaire_prenoms || ''} ${contrat.proprietaire_nom || 'Propriétaire'}, demeurant à l'adresse indiquée au dossier.</p>
            <p><strong>LE PRENEUR :</strong> M./Mme ${contrat.locataire_prenoms || ''} ${contrat.locataire_nom || 'Locataire'}, demeurant à l'adresse indiquée au dossier.</p>
          </div>

          <div class="section">
            <div class="section-title">2. DÉSIGNATION DU BIEN</div>
            <p>Le bailleur donne en location au preneur le bien désigné ci-après :<br/>
            <strong>Titre :</strong> ${contrat.bien_titre || contrat.titre}<br/>
            <strong>Adresse :</strong> ${contrat.adresse || ''}, ${contrat.ville || ''}<br/>
            <strong>Type :</strong> Habitation principale</p>
          </div>

          <div class="section">
            <div class="section-title">3. DURÉE DU CONTRAT</div>
            <p>Le présent bail est consenti pour une durée déterminée :<br/>
            <strong>Prise d'effet :</strong> ${new Date(contrat.date_debut).toLocaleDateString('fr-FR')}<br/>
            <strong>Échéance :</strong> ${contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString('fr-FR') : 'Indéterminée'}</p>
          </div>

          <div class="section">
            <div class="section-title">4. CONDITIONS FINANCIÈRES</div>
            <p>Le loyer mensuel est fixé à : <strong>${Number(contrat.loyer_mensuel).toLocaleString()} FCFA</strong><br/>
            Dépôt de garantie : <strong>${Number(contrat.montant_depot_garantie_attendu || 0).toLocaleString()} FCFA</strong>.</p>
          </div>

          <div class="section">
            <div class="section-title">5. SIGNATURES</div>
            <div class="grid">
              <div class="signature-box">Signature du Bailleur<br/>(Précédée de "Lu et approuvé")</div>
              <div class="signature-box">
                Signature du Preneur<br/>(Précédée de "Lu et approuvé")
                <div style="margin-top: 10px; color: #059669; font-weight: bold;">
                  ${contrat.statut_contrat === 'actif' ? 'Signé électroniquement le ' + dateSignature : 'EN ATTENTE DE SIGNATURE'}
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top: 30px; text-align: center;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Lancer l'impression</button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  
  return (
    <div className="container py-4">
      <h2 className="mb-4">Mes locations</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : contrats.length === 0 ? (
        <div className="alert alert-info">
          Aucune location active pour le moment.
        </div>
      ) : (
        <div className="row g-4">
          {contrats.map((contrat) => {
            const idContrat = contrat.id_contact || contrat.id_contrat;

            return (
              <div className="col-12" key={idContrat}>
                <div className="card shadow-sm">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      {contrat.bien_titre || contrat.titre || `Bien #${contrat.id_bien}`}
                    </h5>
                    <span className={`badge bg-${getStatutBadge(contrat.statut_contrat)}`}>
                      {contrat.statut_contrat || 'actif'}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="row g-3 mb-3">
                      {/* Infos contrat */}
                      <div className="col-md-6">
                        <p className="mb-1">
                          <span className="text-muted">Loyer mensuel :</span>{' '}
                          <strong>{formatMontant(contrat.loyer_mensuel)}</strong>
                        </p>
                        <p className="mb-1">
                          <span className="text-muted">Dépôt de garantie :</span>{' '}
                          <strong>{formatMontant(contrat.depot_garantie)}</strong>
                        </p>
                        <p className="mb-1">
                          <span className="text-muted">Début du contrat :</span>{' '}
                          <strong>{formatDate(contrat.date_debut)}</strong>
                        </p>
                        <p className="mb-1">
                          <span className="text-muted">Fin du contrat :</span>{' '}
                          <strong>
                            {contrat.date_fin ? formatDate(contrat.date_fin) : 'Indéterminée'}
                          </strong>
                        </p>
                      </div>

                      {/* Infos bien */}
                      <div className="col-md-6">
                        {contrat.ville && (
                          <p className="mb-1">
                            <span className="text-muted">Ville :</span>{' '}
                            <strong>{contrat.ville}</strong>
                          </p>
                        )}
                        {contrat.adresse && (
                          <p className="mb-1">
                            <span className="text-muted">Adresse :</span>{' '}
                            <strong>{contrat.adresse}</strong>
                          </p>
                        )}
                        {contrat.type_bien && (
                          <p className="mb-1">
                            <span className="text-muted">Type :</span>{' '}
                            <strong>{contrat.type_bien}</strong>
                          </p>
                        )}
                        {contrat.proprietaire_nom && (
                          <p className="mb-1">
                            <span className="text-muted">Propriétaire :</span>{' '}
                            <strong>{contrat.proprietaire_nom}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="d-flex gap-2 justify-content-end mt-3 border-top pt-3">
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => handleView(contrat)}
                      >
                        <i className="bi bi-eye me-2"></i>
                        Voir le contrat
                      </button>
                      
                      {contrat.statut_contrat === 'en_attente' && (
                        <button 
                          className="btn btn-success"
                          onClick={() => handleAccept(idContrat)}
                        >
                          <i className="bi bi-check-circle me-2"></i>
                          Accepter et Signer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
