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

// Route pour générer un contrat de location
router.post('/generate-contract/:contractId', authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Récupérer les informations du contrat depuis la base de données
    const db = require('../config/db');
    const query = `
      SELECT c.*, l.nom as locataire_nom, l.prenoms as locataire_prenoms, 
             l.email as locataire_email, l.telephone as locataire_telephone,
             b.titre, b.adresse, b.ville, b.pays, b.surface, b.type_bien,
             u.nom as proprietaire_nom, u.prenoms as proprietaire_prenoms,
             u.email as proprietaire_email
      FROM contrats c
      JOIN locataires l ON c.id_locataire = l.id_locataire
      JOIN biens b ON c.id_bien = b.id_bien
      JOIN utilisateurs u ON b.id_proprietaire = u.id
      WHERE c.id_contrat = $1 AND u.id = $2
    `;
    
    const result = await db.query(query, [contractId, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }
    
    const contract = result.rows[0];
    
    // Créer le PDF
    const doc = new pdf();
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfData = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="contrat_${contractId}.pdf"`);
      res.send(pdfData);
    });
    
    // Contenu du contrat
    doc.fontSize(20).text('CONTRAT DE LOCATION', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Numéro de contrat: ${contractId}`);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`);
    doc.moveDown();
    
    doc.fontSize(14).text('PARTIES CONCERNÉES', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12).text('PROPRIÉTAIRE:');
    doc.text(`Nom: ${contract.proprietaire_nom} ${contract.proprietaire_prenoms}`);
    doc.text(`Email: ${contract.proprietaire_email}`);
    doc.moveDown();
    
    doc.text('LOCATAIRE:');
    doc.text(`Nom: ${contract.locataire_nom} ${contract.locataire_prenoms}`);
    doc.text(`Email: ${contract.locataire_email}`);
    doc.text(`Téléphone: ${contract.locataire_telephone}`);
    doc.moveDown();
    
    doc.fontSize(14).text('BIEN LOUÉ', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12).text(`Type: ${contract.type_bien}`);
    doc.text(`Titre: ${contract.titre}`);
    doc.text(`Adresse: ${contract.adresse}`);
    doc.text(`Ville: ${contract.ville}`);
    doc.text(`Pays: ${contract.pays}`);
    doc.text(`Surface: ${contract.surface} m²`);
    doc.moveDown();
    
    doc.fontSize(14).text('CONDITIONS DE LOCATION', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Durée du bail: Du ${new Date(contract.date_debut).toLocaleDateString('fr-FR')} au ${new Date(contract.date_fin).toLocaleDateString('fr-FR')}`);
    doc.text(`Loyer mensuel: ${contract.loyer?.toLocaleString('fr-FR')} XOF`);
    doc.text(`Caution: ${contract.caution?.toLocaleString('fr-FR')} XOF`);
    doc.moveDown();
    
    doc.text('CLAUSES:');
    doc.text('1. Le locataire s\'engage à payer le loyer à la date convenue chaque mois.');
    doc.text('2. Le propriétaire s\'engage à maintenir le bien en bon état de location.');
    doc.text('3. Toute résiliation doit respecter un préavis de 3 mois.');
    doc.text('4. Le locataire doit souscrire une assurance habitation.');
    doc.text('5. Le dépôt de garantie sera restitué dans un délai de 2 mois après la fin du bail.');
    doc.moveDown();
    
    doc.fontSize(14).text('SIGNATURES', { underline: true });
    doc.moveDown();
    
    doc.text('Le propriétaire:');
    doc.text('_________________________');
    doc.text(`${contract.proprietaire_nom} ${contract.proprietaire_prenoms}`);
    doc.moveDown();
    
    doc.text('Le locataire:');
    doc.text('_________________________');
    doc.text(`${contract.locataire_nom} ${contract.locataire_prenoms}`);
    
    doc.end();
    
  } catch (error) {
    console.error('Erreur lors de la génération du contrat:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du contrat' });
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
