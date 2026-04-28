const express = require('express');
const router = express.Router();
const pdf = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Middleware pour vérifier l'authentification
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Route pour générer un contrat de location (nouveau modèle complet)
router.post('/generate-contrat', authMiddleware, async (req, res) => {
  try {
    console.log('Début de la génération de contrat PDF...');
    const ContratPDFService = require('../services/ContratPDFServiceHTML');
    
    // Préparer les données du contrat
    const contratData = req.body;
    console.log('Données reçues:', JSON.stringify(contratData, null, 2));
    
    // Validation minimale
    if (!contratData) {
      return res.status(400).json({ 
        message: 'Aucune donnée de contrat fournie',
        error: 'Données manquantes'
      });
    }
    
    // Préparer les données complètes pour la génération
    const contratComplet = {
      contrat: contratData,
      bien: contratData.bien || {},
      proprietaire: contratData.proprietaire || {},
      locataire: contratData.locataire || {}
    };
    
    console.log('Données préparées pour la génération PDF...');
    
    // Générer le PDF
    const pdfBuffer = await ContratPDFService.generateContratPDF(contratComplet);
    
    console.log('PDF généré avec succès, taille:', pdfBuffer.length);
    
    // Envoyer le contrat (HTML pour l'instant)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="contrat_location_${contratData.id_contact || contratData.id_contrat || 'contrat'}.html"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Erreur détaillée lors de la génération du contrat:', error);
    console.error('Stack trace:', error.stack);
    
    // Envoyer une réponse d'erreur détaillée
    res.status(500).json({ 
      message: 'Erreur lors de la génération du contrat',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour générer une quittance de loyer
router.post('/generate-receipt/:paymentId', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Récupérer les informations du paiement depuis la base de données
    const db = require('../config/db');
    const query = `
      SELECT p.*, l.nom as locataire_nom, l.prenoms as locataire_prenoms,
             l.email as locataire_email, b.titre, b.adresse, b.ville,
             u.nom as proprietaire_nom, u.prenoms as proprietaire_prenoms
      FROM paiements p
      JOIN locataires l ON p.id_locataire = l.id_locataire
      JOIN contrats c ON p.id_contrat = c.id_contrat
      JOIN biens b ON c.id_bien = b.id_bien
      JOIN utilisateurs u ON b.id_proprietaire = u.id
      WHERE p.id_payment = $1 AND u.id = $2
    `;
    
    const result = await db.query(query, [paymentId, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    
    const payment = result.rows[0];
    
    // Créer le PDF
    const doc = new pdf();
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfData = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="quittance_${paymentId}.pdf"`);
      res.send(pdfData);
    });
    
    // Contenu de la quittance
    doc.fontSize(20).text('QUITTANCE DE LOYER', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Numéro de quittance: ${paymentId}`);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`);
    doc.moveDown();
    
    doc.fontSize(14).text('REÇU DE:', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12).text(`Locataire: ${payment.locataire_nom} ${payment.locataire_prenoms}`);
    doc.text(`Email: ${payment.locataire_email}`);
    doc.moveDown();
    
    doc.fontSize(14).text('POUR LE BIEN:', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12).text(`${payment.titre}`);
    doc.text(`${payment.adresse}`);
    doc.text(`${payment.ville}`);
    doc.moveDown();
    
    doc.fontSize(14).text('DÉTAILS DU PAIEMENT:', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Type de paiement: ${payment.type_paiement}`);
    doc.text(`Montant: ${payment.montant?.toLocaleString('fr-FR')} XOF`);
    doc.text(`Date de paiement: ${new Date(payment.date_paiement).toLocaleDateString('fr-FR')}`);
    doc.text(`Statut: ${payment.statut_paiement}`);
    doc.moveDown();
    
    doc.fontSize(14).text('CERTIFICATION:', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text('Je soussigné, propriétaire du bien mentionné ci-dessus, certifie avoir reçu la somme de:');
    doc.fontSize(16).text(`${payment.montant?.toLocaleString('fr-FR')} XOF`, { align: 'center' });
    doc.fontSize(12).text('en paiement du loyer pour la période correspondante.');
    doc.moveDown();
    
    doc.text(`Fait à ${payment.ville}, le ${new Date().toLocaleDateString('fr-FR')}`);
    doc.moveDown();
    
    doc.fontSize(14).text('SIGNATURE:', { underline: true });
    doc.moveDown();
    
    doc.text('Le propriétaire:');
    doc.text('_________________________');
    doc.text(`${payment.proprietaire_nom} ${payment.proprietaire_prenoms}`);
    doc.moveDown();
    
    doc.text('Cachet:');
    doc.text('_________________________');
    
    doc.end();
    
  } catch (error) {
    console.error('Erreur lors de la génération de la quittance:', error);
    res.status(500).json({ message: 'Erreur lors de la génération de la quittance' });
  }
});

module.exports = router;
