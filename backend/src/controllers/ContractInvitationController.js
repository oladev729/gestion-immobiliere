const db = require('../config/database');
const emailService = require('../services/emailService');

class ContractInvitationController {
  // Créer une invitation de contrat
  static async createInvitation(req, res) {
    try {
      const {
        id_contrat,
        id_locataire,
        id_proprietaire,
        id_bien,
        email_locataire,
        message_invitation
      } = req.body;

      // Générer un token d'invitation unique
      const token = require('crypto').randomBytes(32).toString('hex');
      const date_expiration = new Date();
      date_expiration.setDate(date_expiration.getDate() + 7); // Expire dans 7 jours

      // Insérer l'invitation dans la base de données
      const query = `
        INSERT INTO contract_invitations (
          id_contrat, id_locataire, id_proprietaire, id_bien,
          email_locataire, message_invitation, token_invitation,
          date_expiration, statut_invitation, date_creation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'envoyée', NOW())
        RETURNING *
      `;

      const values = [
        id_contrat, id_locataire, id_proprietaire, id_bien,
        email_locataire, message_invitation, token, date_expiration
      ];

      const result = await db.query(query, values);
      const invitation = result.rows[0];

      // Envoyer l'email d'invitation
      const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contract-invitation?id=${token}`;
      
      const emailSubject = 'Invitation à consulter un contrat de location';
      const emailBody = `
        <h2>Invitation à consulter un contrat de location</h2>
        <p>Bonjour,</p>
        <p>Vous avez été invité à consulter et accepter un contrat de location.</p>
        <p><strong>${message_invitation}</strong></p>
        <p>Pour consulter le contrat, veuillez cliquer sur le lien ci-dessous :</p>
        <p><a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Consulter le contrat</a></p>
        <p>Ce lien expirera dans 7 jours.</p>
        <p>Cordialement,<br>L'équipe de gestion immobilière</p>
      `;

      await emailService.sendEmail(email_locataire, emailSubject, emailBody);

      res.status(201).json({
        message: 'Invitation envoyée avec succès',
        invitation: invitation
      });

    } catch (error) {
      console.error('Erreur lors de la création de l\'invitation:', error);
      res.status(500).json({
        message: 'Erreur lors de la création de l\'invitation',
        error: error.message
      });
    }
  }

  // Récupérer une invitation par token
  static async getInvitationByToken(req, res) {
    try {
      const { token } = req.params;

      const query = `
        SELECT ci.*, 
               c.numero_contrat, c.loyer_mensuel, c.date_debut, c.date_fin, c.nb_mois_depot_guarantie, c.montant_depot_garantie_attendu,
               b.titre, b.adresse, b.ville, b.type_bien, b.superficie, b.nombre_pieces, b.description,
               u.nom as proprietaire_nom, u.prenoms as proprietaire_prenoms, u.email as proprietaire_email,
               ul.nom as locataire_nom, ul.prenoms as locataire_prenoms, ul.email as locataire_email
        FROM contract_invitations ci
        JOIN contrats c ON ci.id_contrat = c.id_contrat
        JOIN biens b ON ci.id_bien = b.id_bien
        JOIN utilisateurs u ON ci.id_proprietaire = u.id_utilisateur
        JOIN utilisateurs ul ON ci.id_locataire = ul.id_utilisateur
        WHERE ci.token_invitation = $1 
          AND ci.date_expiration > NOW()
          AND ci.statut_invitation = 'envoyée'
      `;

      const result = await db.query(query, [token]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'Invitation non trouvée, expirée ou déjà traitée'
        });
      }

      const invitation = result.rows[0];

      // Construire l'objet contrat complet
      const contract = {
        id_contrat: invitation.id_contrat,
        numero_contrat: invitation.numero_contrat,
        loyer: invitation.loyer_mensuel,
        duree: Math.ceil((new Date(invitation.date_fin) - new Date(invitation.date_debut)) / (30 * 24 * 60 * 60 * 1000)),
        date_debut: invitation.date_debut,
        date_fin: invitation.date_fin,
        depot_garantie: invitation.montant_depot_garantie_attendu,
        nb_mois_caution: invitation.nb_mois_depot_guarantie,
        bien_titre: invitation.titre,
        bien: {
          id_bien: invitation.id_bien,
          titre: invitation.titre,
          adresse: invitation.adresse,
          ville: invitation.ville,
          type_bien: invitation.type_bien,
          superficie: invitation.superficie,
          nombre_pieces: invitation.nombre_pieces,
          description: invitation.description
        },
        proprietaire_nom: invitation.proprietaire_nom,
        proprietaire_prenoms: invitation.proprietaire_prenoms,
        proprietaire_email: invitation.proprietaire_email,
        locataire_nom: invitation.locataire_nom,
        locataire_prenoms: invitation.locataire_prenoms,
        locataire_email: invitation.locataire_email,
        date_proposition: invitation.date_creation
      };

      res.json(contract);

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'invitation:', error);
      res.status(500).json({
        message: 'Erreur lors de la récupération de l\'invitation',
        error: error.message
      });
    }
  }

  // Accepter une invitation de contrat
  static async acceptInvitation(req, res) {
    try {
      const { token } = req.params;

      // Mettre à jour le statut de l'invitation
      const updateQuery = `
        UPDATE contract_invitations 
        SET statut_invitation = 'acceptée', date_acceptation = NOW()
        WHERE token_invitation = $1
        RETURNING *
      `;

      const updateResult = await db.query(updateQuery, [token]);

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          message: 'Invitation non trouvée'
        });
      }

      const invitation = updateResult.rows[0];

      // Mettre à jour le statut du contrat
      const contractQuery = `
        UPDATE contrats 
        SET statut_contrat = 'actif', date_signature = NOW()
        WHERE id_contrat = $1
      `;

      await db.query(contractQuery, [invitation.id_contrat]);

      // Envoyer une notification au propriétaire
      const notificationQuery = `
        INSERT INTO notifications (id_utilisateur, type_notification, message, date_creation, lu)
        SELECT id_proprietaire, 'contrat_accepte', 'Le locataire a accepté le contrat de location', NOW(), false
        FROM contract_invitations 
        WHERE token_invitation = $1
      `;

      await db.query(notificationQuery, [token]);

      res.json({
        message: 'Contrat accepté avec succès',
        invitation: invitation
      });

    } catch (error) {
      console.error('Erreur lors de l\'acceptation de l\'invitation:', error);
      res.status(500).json({
        message: 'Erreur lors de l\'acceptation de l\'invitation',
        error: error.message
      });
    }
  }

  // Refuser une invitation de contrat
  static async rejectInvitation(req, res) {
    try {
      const { token } = req.params;

      // Mettre à jour le statut de l'invitation
      const updateQuery = `
        UPDATE contract_invitations 
        SET statut_invitation = 'refusée', date_refus = NOW()
        WHERE token_invitation = $1
        RETURNING *
      `;

      const updateResult = await db.query(updateQuery, [token]);

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          message: 'Invitation non trouvée'
        });
      }

      res.json({
        message: 'Invitation refusée',
        invitation: updateResult.rows[0]
      });

    } catch (error) {
      console.error('Erreur lors du refus de l\'invitation:', error);
      res.status(500).json({
        message: 'Erreur lors du refus de l\'invitation',
        error: error.message
      });
    }
  }
}

module.exports = ContractInvitationController;
