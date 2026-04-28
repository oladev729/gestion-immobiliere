import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import ContratGenerator from '../../components/ContratGenerator';
import ContractInvitation from '../../components/ContractInvitation';
import { useSearch } from '../../context/SearchContext.jsx';

// Composant Error Boundary simple
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Erreur capturée dans Contracts:', error, errorInfo);
        console.error('Stack trace:', error.stack);
        console.error('Component stack:', errorInfo.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '100vh', 
                    backgroundColor: '#f8fafc',
                    flexDirection: 'column',
                    padding: '2rem'
                }}>
                    <div style={{ 
                        color: '#dc2626', 
                        fontSize: '1.125rem', 
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        Une erreur est survenue lors du chargement de la page.
                    </div>
                    
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <div style={{
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '0.375rem',
                            padding: '1rem',
                            marginBottom: '1rem',
                            maxWidth: '600px',
                            fontSize: '0.875rem',
                            color: '#991b1b'
                        }}>
                            <strong>Erreur détaillée :</strong>
                            <pre style={{ 
                                marginTop: '0.5rem', 
                                whiteSpace: 'pre-wrap',
                                fontSize: '0.75rem'
                            }}>
                                {this.state.error.toString()}
                            </pre>
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer'
                            }}
                        >
                            Actualiser la page
                        </button>
                        <button 
                            onClick={() => this.setState({ hasError: false, error: null })}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer'
                            }}
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const Contracts = () => {
    const { user } = React.useContext(AuthContext);
    try {
        const { searchTerm = '' } = useSearch() || {};
        const [contrats, setContrats] = useState([]);
        const [biens, setBiens] = useState([]);
        const [locataires, setLocataires] = useState([]);
        const [formStep, setFormStep] = useState(0); // 0: Liste, 1: Étape 1, 2: Étape 2
        const [searchLocataire, setSearchLocataire] = useState('');
        const [selectedLocataire, setSelectedLocataire] = useState(null);
        const [successMsg, setSuccessMsg] = useState('');
        const [errorMsg, setErrorMsg] = useState('');
        const [loading, setLoading] = useState(false);
        const [initialLoading, setInitialLoading] = useState(true);
        const [form, setForm] = useState({
            id_locataire: '', id_bien: '', date_debut: '', date_fin: '',
            loyer_mensuel: '', nb_mois_depot_guarantie: 1,
            montant_depot_guarantie_attendu: '', date_signature: new Date().toISOString().split('T')[0]
        });

    const fetchContrats = async () => {
        try {
            const res = await api.get('/contrats/mes-contrats');
            setContrats(res.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des contrats:', error);
            setContrats([]);
        }
    };
    
    const fetchBiens = async () => {
        try {
            const res = await api.get('/biens/mes-biens');
            setBiens(res.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des biens:', error);
            setBiens([]);
        }
    };
    
    const fetchLocataires = async () => {
        try {
            const res = await api.get('/auth/locataires');
            setLocataires(res.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des locataires:', error);
            setLocataires([]);
        }
    };

    useEffect(() => { 
        const loadAllData = async () => {
            setInitialLoading(true);
            await Promise.all([
                fetchContrats(), 
                fetchBiens(), 
                fetchLocataires()
            ]);
            setInitialLoading(false);
        };
        loadAllData();
    }, []);

    // Filtrage dynamique selon la recherche globale
    const contratsFiltres = contrats.filter(c => {
        if (!c) return false;
        const numero = c.numero_contrat || '';
        const titre = c.bien_titre || '';
        const nom = c.locataire_nom || '';
        const prenoms = c.locataire_prenoms || '';
        const searchLower = searchTerm.toLowerCase();
        
        return numero.toLowerCase().includes(searchLower) ||
               titre.toLowerCase().includes(searchLower) ||
               nom.toLowerCase().includes(searchLower) ||
               prenoms.toLowerCase().includes(searchLower);
    });

    const handleSelectLocataire = (locataire) => {
        setSelectedLocataire(locataire);
        setForm({ ...form, id_locataire: locataire.id_locataire });
        setSearchLocataire('');
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        setLoading(true);
        try {
            await api.post('/contrats', form);
            setSuccessMsg('Contrat créé avec succès !');
            setFormStep(0);
            setSelectedLocataire(null);
            setForm({
                id_locataire: '', id_bien: '', date_debut: '', date_fin: '',
                loyer_mensuel: '', nb_mois_depot_guarantie: 1,
                montant_depot_guarantie_attendu: '', date_signature: new Date().toISOString().split('T')[0]
            });
            fetchContrats();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la création du contrat');
        } finally {
            setLoading(false);
        }
    };

    const handleEditContrat = (c) => {
        setForm({
            id_locataire: c.id_locataire,
            id_bien: c.id_bien,
            date_debut: c.date_debut?.split('T')[0],
            date_fin: c.date_fin?.split('T')[0],
            loyer_mensuel: c.loyer_mensuel,
            nb_mois_depot_guarantie: c.nb_mois_depot_guarantie,
            montant_depot_guarantie_attendu: c.montant_depot_guarantie_attendu,
            date_signature: c.date_signature?.split('T')[0]
        });
        setSelectedLocataire(locataires.find(l => l.id_locataire === c.id_locataire));
        setFormStep(1);
    };

    const handlePrint = (c) => {
        const printWindow = window.open('', '_blank');
        const dateSignature = new Date(c.date_signature).toLocaleDateString('fr-FR');
        const dateDebut = new Date(c.date_debut).toLocaleDateString('fr-FR');
        const dateFin = new Date(c.date_fin).toLocaleDateString('fr-FR');

        printWindow.document.write(`
            <html>
                <head>
                    <title>CONTRAT DE BAIL - ${c.numero_contrat}</title>
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
                        <p>Référence : <strong>${c.numero_contrat}</strong></p>
                    </div>

                    <div class="section">
                        <div class="section-title">1. LES PARTIES</div>
                        <p><strong>LE BAILLEUR :</strong> M./Mme ${c.proprietaire_prenoms || ''} ${c.proprietaire_nom || 'Propriétaire'}, demeurant à l'adresse indiquée au dossier.</p>
                        <p><strong>LE PRENEUR :</strong> M./Mme ${c.locataire_prenoms} ${c.locataire_nom}, demeurant à l'adresse indiquée au dossier.</p>
                    </div>

                    <div class="section">
                        <div class="section-title">2. DÉSIGNATION DU BIEN</div>
                        <p>Le bailleur donne en location au preneur le bien désigné ci-après :<br/>
                        <strong>Titre :</strong> ${c.bien_titre}<br/>
                        <strong>Type :</strong> Habitation principale</p>
                    </div>

                    <div class="section">
                        <div class="section-title">3. DURÉE DU CONTRAT</div>
                        <p>Le présent bail est consenti pour une durée déterminée :<br/>
                        <strong>Prise d'effet :</strong> ${dateDebut}<br/>
                        <strong>Échéance :</strong> ${dateFin}</p>
                    </div>

                    <div class="section">
                        <div class="section-title">4. CONDITIONS FINANCIÈRES</div>
                        <p>Le loyer mensuel est fixé à : <strong>${Number(c.loyer_mensuel).toLocaleString()} FCFA</strong><br/>
                        Les charges sont gérées directement par le locataire.</p>
                        <p>Dépôt de garantie : <strong>${Number(c.montant_depot_guarantie_attendu).toLocaleString()} FCFA</strong> (${c.nb_mois_depot_guarantie} mois de loyer).</p>
                    </div>

                    <div class="section">
                        <div class="section-title">5. ENGAGEMENTS</div>
                        <p style="font-size: 13px; font-style: italic;">Le preneur s'engage à user paisiblement des locaux loués suivant la destination prévue au contrat et à répondre des dégradations et pertes qui surviennent pendant la durée du contrat dans les locaux dont il a la jouissance exclusive.</p>
                    </div>

                    <div class="footer">
                        <div>
                            <p>Fait à .....................................</p>
                            <p>Le <strong>${dateSignature}</strong></p>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="signature-box">Signature du Bailleur<br/>(Précédée de "Lu et approuvé")</div>
                        <div class="signature-box">Signature du Preneur<br/>(Précédée de "Lu et approuvé")</div>
                    </div>

                    <div style="margin-top: 30px; text-align: center;" class="no-print">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Lancer l'impression</button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleTerminer = async (id) => {
        if (window.confirm('Terminer ce contrat ?')) {
            try {
                await api.patch(`/contrats/${id}/terminer`);
                setSuccessMsg('Contrat terminé avec succès !');
                fetchContrats();
            } catch (err) {
                setErrorMsg('Erreur lors de la clôture du contrat');
            }
        }
    };

    const locatairesFiltres = locataires.filter(l =>
        `${l.nom} ${l.prenoms} ${l.email}`.toLowerCase().includes(searchLocataire.toLowerCase())
    );

    const ProgressBar = () => (
        <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: formStep >= 1 ? '#2563eb' : '#9ca3af' }}>1. Bien & Locataire</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: formStep >= 2 ? '#2563eb' : '#9ca3af' }}>2. Conditions & Dates</span>
            </div>
            <div style={{ height: '0.5rem', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', backgroundColor: '#2563eb', transition: 'width 0.3s ease',
                    width: formStep === 1 ? '50%' : formStep === 2 ? '100%' : '0%'
                }} />
            </div>
        </div>
    );

    if (initialLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh', 
                backgroundColor: '#f8fafc',
                flexDirection: 'column'
            }}>
                <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: '4px solid #e5e7eb', 
                    borderTop: '4px solid #2563eb', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1rem'
                }}></div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Chargement des contrats...</div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '0.75rem' }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

            {successMsg && (
                <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #a7f3d0' }}>
                    {successMsg}
                </div>
            )}
            {errorMsg && (
                <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
                    {errorMsg}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 }}>Gestion des Contrats</h1>
                    <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.75rem' }}>Créez et gérez les baux de location en toute sécurité.</p>
                </div>
                {formStep === 0 && (
                    <button
                        onClick={() => setFormStep(1)}
                        style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(37,99,235,0.2)', textDecoration: 'none' }}
                    >
                        Nouveau contrat
                    </button>
                )}
                {formStep > 0 && (
                    <button
                        onClick={() => setFormStep(0)}
                        style={{ backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db', padding: '0.4rem 1rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Annuler
                    </button>
                )}
            </div>

            {formStep > 0 && (
                <div style={{ maxWidth: '800px', margin: '0 auto 2.5rem auto' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '2.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
                        <ProgressBar />

                        {formStep === 1 && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Étape 1 : Choix du Bien et du Locataire</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Sélectionner le Bien</label>
                                        <select className="form-select" style={{ borderRadius: '0.5rem', padding: '0.625rem' }} value={form.id_bien}
                                            onChange={e => setForm({ ...form, id_bien: e.target.value })}>
                                            <option value="">Choisir un bien disponible...</option>
                                            {biens.filter(b => b.statut === 'disponible').map(b => (
                                                <option key={b.id_bien} value={b.id_bien}>
                                                    {b.titre} — {b.ville} ({Number(b.loyer_mensuel).toLocaleString()} FCFA)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Sélectionner le Locataire</label>
                                        {selectedLocataire ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '2px solid #2563eb', borderRadius: '0.75rem', backgroundColor: '#eff6ff' }}>
                                                <div style={{ width: '48px', height: '48px', backgroundColor: '#2563eb', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                    {selectedLocataire.prenoms?.[0]}{selectedLocataire.nom?.[0]}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '600' }}>{selectedLocataire.prenoms} {selectedLocataire.nom}</div>
                                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{selectedLocataire.email}</div>
                                                </div>
                                                <button type="button" className="btn btn-sm btn-link" style={{ color: '#2563eb', fontWeight: '600' }}
                                                    onClick={() => { setSelectedLocataire(null); setForm({ ...form, id_locataire: '' }); }}>
                                                    Changer
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <input className="form-control mb-2" style={{ borderRadius: '0.5rem' }}
                                                    placeholder="Rechercher par nom ou email..."
                                                    value={searchLocataire}
                                                    onChange={e => setSearchLocataire(e.target.value)} />
                                                <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff' }}>
                                                    {(searchLocataire ? locatairesFiltres : locataires).length > 0
                                                        ? (searchLocataire ? locatairesFiltres : locataires).map(l => (
                                                            <div key={l.id_locataire}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.2s' }}
                                                                onClick={() => handleSelectLocataire(l)}
                                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                                <div style={{ width: '32px', height: '32px', backgroundColor: '#9ca3af', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                                                    {l.prenoms?.[0]}{l.nom?.[0]}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{l.prenoms} {l.nom}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{l.email}</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                        : <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Aucun locataire trouvé</div>
                                                    }
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button 
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            console.log("État du formulaire avant passage étape 2:", form);
                                            setFormStep(2);
                                        }}
                                        style={{ padding: '0.75rem 2rem', borderRadius: '0.75rem', fontWeight: '600', textDecoration: 'none' }}
                                    >
                                        Continuer
                                    </button>
                                </div>
                            </div>
                        )}

                        {formStep === 2 && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Étape 2 : Conditions Financières & Dates</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Date de début</label>
                                        <input className="form-control" type="date" required
                                            style={{ borderRadius: '0.5rem' }}
                                            value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Date de fin</label>
                                        <input className="form-control" type="date" required
                                            style={{ borderRadius: '0.5rem' }}
                                            value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Loyer mensuel (FCFA)</label>
                                        <input className="form-control" type="number" required
                                            style={{ borderRadius: '0.5rem' }} min="0"
                                            value={form.loyer_mensuel} onChange={e => setForm({ ...form, loyer_mensuel: e.target.value })} />
                                    </div>
                                                                        <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Nb mois depot guarantie</label>
                                        <input className="form-control" type="number"
                                            style={{ borderRadius: '0.5rem' }} min="0"
                                            value={form.nb_mois_depot_guarantie} onChange={e => {
                                                const nb = e.target.value;
                                                const montant = nb * (form.loyer_mensuel || 0);
                                                setForm({ ...form, nb_mois_depot_guarantie: nb, montant_depot_guarantie_attendu: montant });
                                            }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Montant depot guarantie (FCFA)</label>
                                        <input className="form-control" type="number"
                                            style={{ borderRadius: '0.5rem' }} min="0"
                                            value={form.montant_depot_guarantie_attendu} onChange={e => setForm({ ...form, montant_depot_guarantie_attendu: e.target.value })} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Date de signature</label>
                                        <input className="form-control" type="date"
                                            style={{ borderRadius: '0.5rem' }}
                                            value={form.date_signature} onChange={e => setForm({ ...form, date_signature: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button type="button" className="btn btn-link" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '600' }} onClick={() => setFormStep(1)}>
                                        ← Retour
                                    </button>
                                    <button 
                                        className="btn btn-success" 
                                        onClick={handleSubmit}
                                        disabled={loading || !form.date_debut || !form.date_fin || !form.loyer_mensuel}
                                        style={{ padding: '0.75rem 2.5rem', borderRadius: '0.75rem', fontWeight: '600', backgroundColor: '#10b981', border: 'none', textDecoration: 'none' }}
                                    >
                                        {loading ? 'Création en cours...' : 'Finaliser le Contrat'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {formStep === 0 && (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead style={{ backgroundColor: '#f9fafb' }}>
                                <tr>
                                    <th style={{ padding: '0.6rem 0.75rem', fontSize: '0.65rem', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>Réf. Contrat</th>
                                    <th style={{ padding: '0.6rem 0.75rem', fontSize: '0.65rem', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>Bien</th>
                                    <th style={{ padding: '0.6rem 0.75rem', fontSize: '0.65rem', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>Locataire</th>
                                    <th style={{ padding: '0.6rem 0.75rem', fontSize: '0.65rem', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>Loyer</th>
                                    <th style={{ padding: '0.6rem 0.75rem', fontSize: '0.65rem', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>Période</th>
                                    <th style={{ padding: '0.6rem 0.75rem', fontSize: '0.65rem', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>Statut</th>
                                    <th style={{ padding: '0.6rem 0.75rem', fontSize: '0.65rem', fontWeight: '600', color: '#374151', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderTop: '1px solid #e5e7eb' }}>
                                {contratsFiltres.map(c => (
                                    <tr key={c.id_contact}>
                                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}><strong>{c.numero_contrat}</strong></td>
                                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>{c.bien_titre}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
                                            <div style={{ fontWeight: '500' }}>{c.locataire_prenoms} {c.locataire_nom}</div>
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: '600', color: '#059669' }}>{Number(c.loyer_mensuel).toLocaleString()} FCFA</td>
                                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                                            {new Date(c.date_debut).toLocaleDateString('fr-FR')} - {new Date(c.date_fin).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem' }}>
                                            <span style={{ 
                                                display: 'inline-block',
                                                padding: '0.15rem 0.5rem', 
                                                borderRadius: '9999px', 
                                                fontSize: '0.65rem', 
                                                fontWeight: '600',
                                                backgroundColor: c.statut_contrat === 'actif' ? '#d1fae5' : '#f3f4f6', 
                                                color: c.statut_contrat === 'actif' ? '#065f46' : '#374151',
                                                textTransform: 'capitalize'
                                            }}>
                                                {c.statut_contrat}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => handlePrint(c)}>Voir</button>
                                                <button className="btn btn-sm btn-outline-warning" onClick={() => handleEditContrat(c)}>Modifier</button>
                                                <ContratGenerator 
                                                    contrat={c}
                                                    bien={biens.find(b => b.id_bien === c.id_bien)}
                                                    proprietaire={user}
                                                    locataire={locataires.find(l => l.id_locataire === c.id_locataire)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {contratsFiltres.length === 0 && (
                                    <tr><td colSpan="7" className="text-center" style={{ padding: '3rem', color: '#9ca3af' }}>{searchTerm ? 'Aucun contrat ne correspond à votre recherche.' : 'Aucun contrat enregistré pour le moment.'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
    } catch (error) {
        console.error('Erreur générale dans le composant Contracts:', error);
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh', 
                backgroundColor: '#f8fafc',
                flexDirection: 'column',
                padding: '2rem'
            }}>
                <div style={{ 
                    color: '#dc2626', 
                    fontSize: '1.125rem', 
                    marginBottom: '1rem',
                    textAlign: 'center'
                }}>
                    Une erreur inattendue est survenue.
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                    }}
                >
                    Actualiser la page
                </button>
            </div>
        );
    }
};

const ContractsWithErrorBoundary = () => (
    <ErrorBoundary>
        <Contracts />
    </ErrorBoundary>
);

export default ContractsWithErrorBoundary;
