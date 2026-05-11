const db = require('../config/database');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class AutomatisationService {
  
  // 1. GÉNÉRATION AUTOMATIQUE DES QUITTANCES
  static async genererQuittance(paiementId) {
    try {
      console.log('📄 Génération quittance pour paiement:', paiementId);
      
      // Récupérer les infos du paiement
      const paiementQuery = await db.query(`
        SELECT p.*, c.numero_contrat, c.loyer_mensuel, c.charge,
               l.nom as locataire_nom, l.prenoms as locataire_prenoms,
               l.date_naissance, l.piece_identite,
               b.titre as bien_titre, b.adresse,
               pr.nom as proprietaire_nom, pr.prenoms as proprietaire_prenoms,
               pr.adresse_fiscale
        FROM payement p
        JOIN contact c ON p.id_contact = c.id_contact
        JOIN locataire l ON c.id_locataire = l.id_locataire
        JOIN bien b ON c.id_bien = b.id_bien
        JOIN proprietaire pr ON b.id_proprietaire = pr.id_proprietaire
        WHERE p.id_payment = $1
      `, [paiementId]);

      if (paiementQuery.rows.length === 0) {
        throw new Error('Paiement non trouvé');
      }

      const paiement = paiementQuery.rows[0];
      
      // Générer le PDF avec Puppeteer
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      const htmlQuittance = this.genererHTMLQuittance(paiement);
      await page.setContent(htmlQuittance);
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      await browser.close();
      
      // Sauvegarder le PDF
      const fileName = `quittance_${paiement.numero_transaction}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../../uploads/quittances', fileName);
      
      await fs.writeFile(filePath, pdfBuffer);
      
      // Enregistrer la quittance en base
      await db.query(`
        INSERT INTO quittance (id_payment, chemin_fichier, date_generation, statut)
        VALUES ($1, $2, CURRENT_TIMESTAMP, 'générée')
      `, [paiementId, fileName]);
      
      console.log('✅ Quittance générée:', fileName);
      return fileName;
      
    } catch (error) {
      console.error('❌ Erreur génération quittance:', error);
      throw error;
    }
  }

  // HTML template pour quittance
  static genererHTMLQuittance(paiement) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .info { margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; }
        .signature { margin-top: 80px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">QUITTANCE DE LOYER</div>
        <div>Numéro: ${paiement.numero_transaction}</div>
      </div>
      
      <div class="info">
        <h3>Informations sur le paiement</h3>
        <div class="info-row">
          <span>Date de paiement:</span>
          <span>${new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}</span>
        </div>
        <div class="info-row">
          <span>Montant payé:</span>
          <span>${paiement.montant.toLocaleString()} FCFA</span>
        </div>
        <div class="info-row">
          <span>Mode de paiement:</span>
          <span>${paiement.mode_versement || 'Non spécifié'}</span>
        </div>
      </div>
      
      <div class="info">
        <h3>Informations locataire</h3>
        <div class="info-row">
          <span>Nom:</span>
          <span>${paiement.locataire_nom} ${paiement.locataire_prenoms}</span>
        </div>
        <div class="info-row">
          <span>Contrat:</span>
          <span>${paiement.numero_contrat}</span>
        </div>
        <div class="info-row">
          <span>Bien loué:</span>
          <span>${paiement.bien_titre}</span>
        </div>
        <div class="info-row">
          <span>Adresse:</span>
          <span>${paiement.adresse}</span>
        </div>
      </div>
      
      <div class="info">
        <h3>Détail du loyer</h3>
        <div class="info-row">
          <span>Loyer mensuel:</span>
          <span>${paiement.loyer_mensuel.toLocaleString()} FCFA</span>
        </div>
        <div class="info-row">
          <span>Charges:</span>
          <span>${paiement.charge.toLocaleString()} FCFA</span>
        </div>
        <div class="info-row">
          <span><strong>Total:</strong></span>
          <span><strong>${paiement.montant.toLocaleString()} FCFA</strong></span>
        </div>
      </div>
      
      <div class="signature">
        <div class="info-row">
          <span>Propriétaire:</span>
          <span>${paiement.proprietaire_nom} ${paiement.proprietaire_prenoms}</span>
        </div>
        <div class="info-row">
          <span>Adresse fiscale:</span>
          <span>${paiement.adresse_fiscale}</span>
        </div>
        <div style="margin-top: 50px; text-align: center;">
          <p>Signature et cachet</p>
        </div>
      </div>
      
      <div class="footer">
        <p>Document généré automatiquement par ImmoGest le ${new Date().toLocaleDateString('fr-FR')}</p>
        <p>Ce document fait foi de paiement</p>
      </div>
    </body>
    </html>
    `;
  }

  // 2. CRÉATION AUTOMATIQUE DES CONTRATS
  static async creerContratAutomatique(demandeVisiteId) {
    try {
      console.log('📋 Création contrat automatique pour demande:', demandeVisiteId);
      
      // Récupérer les infos de la demande
      const demandeQuery = await db.query(`
        SELECT dv.*, l.id_locataire, l.nom as locataire_nom, l.prenoms as locataire_prenoms,
               b.id_bien, b.titre as bien_titre, b.loyer_mensuel, b.charge,
               pr.id_proprietaire
        FROM demander_visite dv
        JOIN locataire l ON dv.id_locataire = l.id_locataire
        JOIN bien b ON dv.id_bien = b.id_bien
        JOIN proprietaire pr ON b.id_proprietaire = pr.id_proprietaire
        WHERE dv.id_demande = $1 AND dv.statut_demande = 'acceptee'
      `, [demandeVisiteId]);

      if (demandeQuery.rows.length === 0) {
        throw new Error('Demande non trouvée ou non acceptée');
      }

      const demande = demandeQuery.rows[0];
      
      // Générer numéro de contrat unique
      const numeroContrat = `CTR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Créer le contrat
      const contratQuery = await db.query(`
        INSERT INTO contact (
          numero_contrat, id_locataire, id_bien, date_debut, 
          loyer_mensuel, charge, statut_contrat, date_signature
        ) VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '1 month', 
                  $4, $5, 'brouillon', CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        numeroContrat,
        demande.id_locataire,
        demande.id_bien,
        demande.loyer_mensuel,
        demande.charge
      ]);

      const contrat = contratQuery.rows[0];
      
      // Mettre à jour le statut du bien
      await db.query(
        'UPDATE bien SET statut = \'loué\' WHERE id_bien = $1',
        [demande.id_bien]
      );
      
      // Créer les échéances de loyer pour l'année
      await this.creerEcheancesLoyer(contrat.id_contact, contrat.loyer_mensuel, contrat.charge);
      
      console.log('✅ Contrat créé automatiquement:', numeroContrat);
      return contrat;
      
    } catch (error) {
      console.error('❌ Erreur création contrat automatique:', error);
      throw error;
    }
  }

  // 3. CRÉATION DES ÉCHÉANCES DE LOYER
  static async creerEcheancesLoyer(contactId, loyerMensuel, charges) {
    try {
      const echeances = [];
      const dateDebut = new Date();
      
      // Créer 12 échéances mensuelles
      for (let i = 0; i < 12; i++) {
        const dateEcheance = new Date(dateDebut.getFullYear(), dateDebut.getMonth() + i, 1);
        const moisConcerne = dateEcheance.toISOString().slice(0, 7); // YYYY-MM
        
        echeances.push([
          contactId,
          moisConcerne,
          loyerMensuel,
          charges || 0,
          dateEcheance
        ]);
      }
      
      // Insertion en masse
      const valuesPlaceholders = echeances.map((_, index) => 
        `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`
      ).join(', ');
      
      const values = echeances.flat();
      
      await db.query(`
        INSERT INTO loyermensuel (id_contact, mois_concerne, montant_loyer, montant_charge, date_echeance)
        VALUES ${valuesPlaceholders}
      `, values);
      
      console.log(`✅ ${echeances.length} échéances créées pour le contrat ${contactId}`);
      
    } catch (error) {
      console.error('❌ Erreur création échéances:', error);
      throw error;
    }
  }

  // 4. NOTIFICATIONS PROACTIVES
  static async envoyerNotificationsProactives() {
    try {
      console.log('🔔 Envoi notifications proactives');
      
      // Loyers dus dans 7 jours
      const loyersProches = await db.query(`
        SELECT DISTINCT 
          u.id_utilisateur, u.email, u.nom, u.prenoms,
          b.titre as bien_titre,
          lm.mois_concerne,
          lm.date_echeance
        FROM loyermensuel lm
        JOIN contact c ON lm.id_contact = c.id_contact
        JOIN locataire l ON c.id_locataire = l.id_locataire
        JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
        JOIN bien b ON c.id_bien = b.id_bien
        WHERE lm.statut = 'en_attente'
          AND lm.date_echeance BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      `);

      // Envoyer les notifications
      for (const loyer of loyersProches.rows) {
        await this.envoyerNotificationEmail(loyer, 'rappel_loyer');
      }
      
      console.log(`✅ ${loyersProches.rows.length} rappels de loyer envoyés`);
      
    } catch (error) {
      console.error('❌ Erreur notifications proactives:', error);
    }
  }

  // 5. ENVOI EMAIL NOTIFICATION
  static async envoyerNotificationEmail(destinataire, type) {
    // Implémentation avec nodemailer
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const templates = {
      rappel_loyer: {
        subject: 'Rappel de paiement de loyer - ImmoGest',
        html: `
          <h2>Rappel de paiement</h2>
          <p>Bonjour ${destinataire.prenoms} ${destinataire.nom},</p>
          <p>Votre loyer pour le bien <strong>${destinataire.bien_titre}</strong> 
          est dû le ${new Date(destinataire.date_echeance).toLocaleDateString('fr-FR')}.</p>
          <p>Mois concerné: ${destinataire.mois_concerne}</p>
          <p>Merci de procéder au paiement dans les plus brefs délais.</p>
          <p>Cordialement,<br>L'équipe ImmoGest</p>
        `
      }
    };

    const template = templates[type];
    if (!template) return;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: destinataire.email,
      subject: template.subject,
      html: template.html
    });
  }
}

module.exports = AutomatisationService;
