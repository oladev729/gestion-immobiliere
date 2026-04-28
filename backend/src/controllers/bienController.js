const Bien = require('../models/Bien');
const Proprietaire = require('../models/Proprietaire');
const Notification = require('../models/Notification');
const PhotosBien = require('../models/PhotosBien');

const bienController = {
    // ============================================================
    // CRÉER UN NOUVEAU BIEN
    // ============================================================
    async create(req, res) {
        try {
            const proprietaire = await Proprietaire.findByIdUtilisateur(req.user.id);

            if (!proprietaire) {
                return res.status(403).json({ 
                    message: 'Vous devez être propriétaire pour créer un bien' 
                });
            }

            const id_proprietaire = proprietaire.id_proprietaire;
            const newBien = await Bien.create(req.body, id_proprietaire);

            // Créer une notification pour le propriétaire
            await Notification.create({
                id_utilisateur: req.user.id,
                titre: 'Bien créé',
                message: `Votre bien "${newBien.titre}" a été créé avec succès`,
                type: 'contrat'
            });

            res.status(201).json({
                message: 'Bien créé avec succès',
                bien: newBien
            });

        } catch (error) {
            console.error('Erreur création bien:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },


    // ============================================================
    // RÉCUPÉRER TOUS LES BIENS DU PROPRIÉTAIRE CONNECTÉ
    // ============================================================
    async getMyBiens(req, res) {
        try {
            const proprietaire = await Proprietaire.findByIdUtilisateur(req.user.id);

            if (!proprietaire) {
                return res.status(200).json([]); // Pas propriétaire = pas de biens
            }

            const biens = await Bien.findByProprietaire(proprietaire.id_proprietaire);
            
            // Ajouter les photos pour chaque bien (en mettant la principale en premier)
            for (let bien of biens) {
                bien.photos = await Bien.getPhotos(bien.id_bien);
            }

            res.json(biens);

        } catch (error) {
            console.error('Erreur récupération biens:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },


    // ============================================================
    // RÉCUPÉRER TOUS LES BIENS DISPONIBLES (PUBLIC)
    // ============================================================
    async getBiensDisponibles(req, res) {
        try {
            const filtres = {
                ville: req.query.ville,
                type_bien: req.query.type_bien,
                prix_max: req.query.prix_max
            };

            const biens = await Bien.findAllDisponibles(filtres);
            
            // Ajouter la photo principale pour chaque bien
            for (let bien of biens) {
                bien.photo_principale = await Bien.getPhotoPrincipale(bien.id_bien);
            }

            res.json(biens);

        } catch (error) {
            console.error('Erreur récupération biens disponibles:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },


    // ============================================================
    // RÉCUPÉRER UN BIEN PAR SON ID (PUBLIC)
    // ============================================================
    async getBienById(req, res) {
        try {
            const bien = await Bien.findById(req.params.id);
            
            if (!bien) {
                return res.status(404).json({ message: 'Bien non trouvé' });
            }

            // Récupérer toutes les photos du bien
            bien.photos = await Bien.getPhotos(bien.id_bien);

            res.json(bien);

        } catch (error) {
            console.error('Erreur récupération bien:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },


    // ============================================================
    // METTRE À JOUR UN BIEN (propriétaire uniquement)
    // ============================================================
    async update(req, res) {
        try {
            const bien = await Bien.findById(req.params.id);
            
            if (!bien) {
                return res.status(404).json({ message: 'Bien non trouvé' });
            }

            // Vérifier que le propriétaire connecté est bien le propriétaire du bien
            const proprietaire = await Proprietaire.findById(bien.id_proprietaire);

            if (proprietaire.id_utilisateur !== req.user.id) {
                return res.status(403).json({ 
                    message: 'Vous n\'êtes pas autorisé à modifier ce bien' 
                });
            }

            const updatedBien = await Bien.update(req.params.id, req.body);

            res.json({
                message: 'Bien mis à jour avec succès',
                bien: updatedBien
            });

        } catch (error) {
            console.error('Erreur mise à jour bien:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },


    // ============================================================
    // SUPPRIMER UN BIEN (propriétaire uniquement)
    // ============================================================
    async delete(req, res) {
        try {
            const bien = await Bien.findById(req.params.id);
            if (!bien) {
                return res.status(404).json({ message: 'Bien non trouvé' });
            }

            const proprietaire = await Proprietaire.findById(bien.id_proprietaire);

            if (proprietaire.id_utilisateur !== req.user.id) {
                return res.status(403).json({ message: 'Non autorisé' });
            }

            if (bien.statut === 'loue') {
                return res.status(400).json({ 
                    message: 'Impossible de supprimer un bien actuellement loué' 
                });
            }

            // Supprimer les données liées avant le bien
            await Bien.deleteDependencies(req.params.id);
            await Bien.delete(req.params.id);

            res.json({ message: 'Bien supprimé avec succès' });

        } catch (error) {
            console.error('Erreur suppression bien:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },


    // ============================================================
    // CHANGER LE STATUT D'UN BIEN
    // ============================================================
    async changeStatut(req, res) {
        try {
            const { statut } = req.body;
            const bien = await Bien.findById(req.params.id);
            
            if (!bien) {
                return res.status(404).json({ message: 'Bien non trouvé' });
            }

            // Vérifier les droits
            const proprietaire = await Proprietaire.findById(bien.id_proprietaire);

            if (proprietaire.id_utilisateur !== req.user.id) {
                return res.status(403).json({ 
                    message: 'Vous n\'êtes pas autorisé à modifier ce bien' 
                });
            }

            // Bloquer les changements manuels vers "disponible" ou "loue"
            if (statut === 'disponible' || statut === 'loue') {
                return res.status(400).json({
                    message: `Le statut "${statut}" est géré automatiquement par le système de contrat et ne peut pas être modifié manuellement.`
                });
            }

            const updatedBien = await Bien.changeStatut(req.params.id, statut);

            res.json({
                message: 'Statut mis à jour avec succès',
                bien: updatedBien
            });

        } catch (error) {
            console.error('Erreur changement statut:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },


    // ============================================================
    // RECHERCHER DES BIENS
    // ============================================================
    async searchBiens(req, res) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return res.status(400).json({ 
                    message: 'Paramètre de recherche requis' 
                });
            }

            const biens = await Bien.search(q);
            
            // Ajouter les photos
            for (let bien of biens) {
                bien.photo_principale = await Bien.getPhotoPrincipale(bien.id_bien);
            }

            res.json(biens);

        } catch (error) {
            console.error('Erreur recherche biens:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },


    // ============================================================
    // STATISTIQUES DES BIENS (pour propriétaire)
    // ============================================================
    async getStats(req, res) {
        try {
            const proprietaire = await Proprietaire.findByIdUtilisateur(req.user.id);

            let stats;
            if (proprietaire) {
                stats = await Bien.countByStatut(proprietaire.id_proprietaire);
            } else {
                stats = await Bien.countByStatut();
            }

            res.json(stats);

        } catch (error) {
            console.error('Erreur stats biens:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },


    // ============================================================
    // AJOUTER DES PHOTOS À UN BIEN
    // ============================================================
    async addPhotos(req, res) {
        try {
            const { id } = req.params;
            const { url_photobien, legende } = req.body;

            if (!url_photobien) {
                return res.status(400).json({ 
                    message: 'L\'URL de la photo est requise' 
                });
            }

            // Vérifier que le bien existe et appartient au propriétaire
            const bien = await Bien.findById(id);
            if (!bien) {
                return res.status(404).json({ message: 'Bien non trouvé' });
            }

            const proprietaire = await Proprietaire.findById(bien.id_proprietaire);

            if (proprietaire.id_utilisateur !== req.user.id) {
                return res.status(403).json({ 
                    message: 'Vous n\'êtes pas autorisé à ajouter des photos à ce bien' 
                });
            }

            // Insérer la photo
            const photo = await PhotosBien.add(id, url_photobien, legende);

            res.status(201).json({
                message: 'Photo ajoutée avec succès',
                photo
            });

        } catch (error) {
            console.error('Erreur ajout photo:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },


    // ============================================================
    // RÉCUPÉRER LES PHOTOS D'UN BIEN
    // ============================================================
    async getPhotos(req, res) {
        try {
            const { id } = req.params;

            // Vérifier que le bien existe
            const bien = await Bien.findById(id);
            if (!bien) {
                return res.status(404).json({ message: 'Bien non trouvé' });
            }

            // Vérifier les droits d'accès (public pour les biens disponibles, privé pour les autres)
            const isProprietaire = req.user && await Proprietaire.findByIdUtilisateur(req.user.id);

            if (bien.statut !== 'disponible' && !isProprietaire) {
                return res.status(403).json({ 
                    message: 'Vous n\'avez pas accès aux photos de ce bien' 
                });
            }

            const photos = await PhotosBien.findByBien(id);

            res.json(photos);

        } catch (error) {
            console.error('Erreur récupération photos:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = bienController;
