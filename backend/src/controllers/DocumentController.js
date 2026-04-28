const ContratPDFService = require('../services/ContratPDFService');
const Bien = require('../models/Bien');
const Proprietaire = require('../models/Proprietaire');
const Locataire = require('../models/Locataire');
const Utilisateur = require('../models/Utilisateur');

class DocumentController {
  static async generateContrat(req, res) {
    try {
      const contratData = req.body;
      
      // Récupérer les informations complètes
      let bien = contratData.bien;
      let proprietaire = contratData.proprietaire;
      let locataire = contratData.locataire;
      
      // Si les données ne sont pas complètes, les récupérer depuis la base
      if (!bien || !bien.id_bien) {
        bien = await Bien.findById(contratData.id_bien);
      }
      
      if (!proprietaire || !proprietaire.id_proprietaire) {
        proprietaire = await Proprietaire.findById(contratData.id_proprietaire || bien?.id_proprietaire);
        if (proprietaire) {
          const userProp = await Utilisateur.findById(proprietaire.id_utilisateur);
          proprietaire = { ...proprietaire, ...userProp };
        }
      }
      
      if (!locataire || !locataire.id_locataire) {
        locataire = await Locataire.findById(contratData.id_locataire);
        if (locataire) {
          const userLoc = await Utilisateur.findById(locataire.id_utilisateur);
          locataire = { ...locataire, ...userLoc };
        }
      }
      
      // Préparer les données complètes pour la génération
      const contratComplet = {
        contrat: contratData,
        bien: bien,
        proprietaire: proprietaire,
        locataire: locataire
      };
      
      // Générer le PDF
      const pdfBuffer = await ContratPDFService.generateContratPDF(contratComplet);
      
      // Envoyer le PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="contrat_location_${contratData.id_contact || contratData.id_contrat}.pdf"`);
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('Erreur lors de la génération du contrat:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la génération du contrat',
        error: error.message 
      });
    }
  }
  
  static async generateReceipt(req, res) {
    try {
      const { paymentId } = req.params;
      
      // Récupérer les informations du paiement
      // TODO: Implémenter la génération de quittance/reçu
      
      res.status(501).json({ message: 'Fonctionnalité non encore implémentée' });
      
    } catch (error) {
      console.error('Erreur lors de la génération du reçu:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la génération du reçu',
        error: error.message 
      });
    }
  }
}

module.exports = DocumentController;
