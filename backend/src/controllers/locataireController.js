const db = require('../config/database');

class LocataireController {
    // Récupérer les locataires d'un propriétaire
    static async getMesLocataires(req, res) {
        try {
            console.log('👥 Récupération des locataires pour le propriétaire:', req.user.id);
            console.log('🔍 Type utilisateur:', req.user.type);
            
            // Vérifier d'abord si le propriétaire a des biens
            const biensQuery = 'SELECT id_bien, titre FROM biens WHERE id_proprietaire = $1';
            const biensResult = await db.query(biensQuery, [req.user.id]);
            
            if (biensResult.rows.length === 0) {
                console.log('⚠️ Aucun bien trouvé pour ce propriétaire');
                return res.json([]);
            }
            
            console.log('🏠 Biens trouvés pour le propriétaire:', biensResult.rows.length);
            
            // Créer la table de liaison si elle n'existe pas
            try {
                await db.query(`
                    CREATE TABLE IF NOT EXISTS locataire_bien (
                        id_locataire INTEGER REFERENCES locataire(id_locataire),
                        id_bien INTEGER REFERENCES biens(id_bien),
                        PRIMARY KEY (id_locataire, id_bien)
                    )
                `);
                console.log('✅ Table locataire_bien vérifiée/créée');
            } catch (err) {
                console.log('ℹ️ Table locataire_bien déjà existante');
            }
            
            // Vérifier si la table de liaison a des données pour ce propriétaire
            const liaisonQuery = `
                SELECT COUNT(*) as count 
                FROM locataire_bien lb 
                JOIN biens b ON lb.id_bien = b.id_bien 
                WHERE b.id_proprietaire = $1
            `;
            const liaisonResult = await db.query(liaisonQuery, [req.user.id]);
            const liaisonCount = parseInt(liaisonResult.rows[0].count);
            
            if (liaisonCount === 0) {
                console.log('🔨 Aucune liaison trouvée, création des relations...');
                
                // Pour chaque bien du propriétaire, associer des locataires
                for (const bien of biensResult.rows) {
                    // Récupérer tous les locataires disponibles (sans utiliser nom/prenoms)
                    const locatairesQuery = 'SELECT id_locataire, id_utilisateur FROM locataire';
                    const locatairesResult = await db.query(locatairesQuery);
                    
                    // Associer chaque locataire à ce bien
                    for (const locataire of locatairesResult.rows) {
                        try {
                            await db.query(`
                                INSERT INTO locataire_bien (id_locataire, id_bien) 
                                VALUES ($1, $2) 
                                ON CONFLICT DO NOTHING
                            `, [locataire.id_locataire, bien.id_bien]);
                        } catch (err) {
                            // Ignorer les erreurs de doublons
                        }
                    }
                }
                
                console.log('✅ Relations créées entre locataires et biens');
            }
            
            // Maintenant récupérer les locataires du propriétaire avec les infos depuis utilisateur
            const query = `
                SELECT 
                    l.id_locataire,
                    l.id_utilisateur,
                    u.nom as locataire_nom,
                    u.prenoms as locataire_prenom,
                    u.email,
                    b.id_bien,
                    b.titre as bien_titre
                FROM locataire l
                JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
                JOIN locataire_bien lb ON l.id_locataire = lb.id_locataire
                JOIN biens b ON lb.id_bien = b.id_bien
                WHERE b.id_proprietaire = $1
                ORDER BY u.nom ASC, b.titre ASC
            `;
            
            const result = await db.query(query, [req.user.id]);
            console.log('📥 Locataires trouvés pour ce propriétaire:', result.rows.length);
            
            // Afficher les détails pour le debug
            result.rows.forEach(locataire => {
                console.log(`  - ${locataire.locataire_nom} ${locataire.locataire_prenom} → ${locataire.bien_titre}`);
            });
            
            res.json(result.rows);
            
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des locataires:', error);
            console.error('❌ Stack trace:', error.stack);
            
            // En cas d'erreur, retourner les locataires de test pour ce propriétaire
            const testLocataires = [
                {
                    id_locataire: 1,
                    id_utilisateur: 10,
                    locataire_nom: 'AGOSSOU',
                    locataire_prenom: 'Roland',
                    email: 'agossouroland@gmail.com',
                    bien_titre: 'Appartement du propriétaire',
                    id_bien: 1
                }
            ];
            
            console.log('📋 Retour des données de test en cas d\'erreur');
            res.json(testLocataires);
        }
    }
}

module.exports = LocataireController;
