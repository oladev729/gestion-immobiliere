const PDFDocument = require('pdfkit');

class ContratPDFServiceFinal {
  static async generateContratPDF(contratData) {
    return new Promise((resolve, reject) => {
      console.log('🔄 Début génération PDF (version finale)...');
      
      try {
        // Validation
        if (!contratData || !contratData.contrat) {
          throw new Error('Données de contrat manquantes');
        }

        const { contrat, bien = {}, proprietaire = {}, locataire = {} } = contratData;

        // Créer le document avec options spécifiques
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
          info: {
            Title: 'Contrat de Location',
            Author: 'Gestion Immobilière',
            Subject: 'Contrat de Location',
            Creator: 'Gestion Immobilière App',
            Producer: 'PDFKit'
          }
        });

        // Variables pour suivre le processus
        let chunks = [];
        let hasEnded = false;
        let timeoutId;

        // Fonction de résolution
        const resolvePromise = () => {
          if (!hasEnded && chunks.length > 0) {
            hasEnded = true;
            clearTimeout(timeoutId);
            const pdfBuffer = Buffer.concat(chunks);
            console.log('✅ PDF généré avec succès, taille:', pdfBuffer.length);
            resolve(pdfBuffer);
          }
        };

        // Fonction de rejet
        const rejectPromise = (error) => {
          if (!hasEnded) {
            hasEnded = true;
            clearTimeout(timeoutId);
            console.error('❌ Erreur PDF:', error.message);
            reject(error);
          }
        };

        // Configuration des événements
        doc.on('data', (chunk) => {
          chunks.push(chunk);
          console.log('📦 Chunk reçu:', chunk.length, 'bytes, total:', chunks.length);
        });
        
        doc.on('end', () => {
          console.log('🏁 Événement end déclenché');
          resolvePromise();
        });
        
        doc.on('error', (error) => {
          console.error('❌ Erreur PDFKit:', error);
          rejectPromise(error);
        });

        // Timeout de sécurité
        timeoutId = setTimeout(() => {
          if (!hasEnded) {
            console.log('⏰ Timeout, forçage de la résolution...');
            resolvePromise();
          }
        }, 5000);

        try {
          // Ajouter le contenu
          doc.fontSize(24).text('CONTRAT DE LOCATION', { align: 'center' });
          doc.moveDown(2);

          doc.fontSize(16).text('PARTIES CONCERNÉES', { underline: true });
          doc.moveDown();

          doc.fontSize(12).text('PROPRIÉTAIRE :');
          doc.text(`Nom et prénoms : ${proprietaire.nom || ''} ${proprietaire.prenoms || ''}`);
          doc.text(`Email : ${proprietaire.email || ''}`);
          doc.text(`Téléphone : ${proprietaire.telephone || ''}`);
          doc.moveDown();

          doc.text('LOCATAIRE :');
          doc.text(`Nom et prénoms : ${locataire.nom || ''} ${locataire.prenoms || ''}`);
          doc.text(`Email : ${locataire.email || ''}`);
          doc.text(`Téléphone : ${locataire.telephone || ''}`);
          doc.moveDown(2);

          doc.fontSize(16).text('BIEN LOUÉ', { underline: true });
          doc.fontSize(12);
          doc.text(`Désignation : ${bien.titre || ''}`);
          doc.text(`Adresse : ${bien.adresse || ''}, ${bien.ville || ''}`);
          doc.text(`Type : ${bien.type_bien || ''}`);
          doc.text(`Superficie : ${bien.superficie || ''} m²`);
          doc.moveDown(2);

          doc.fontSize(16).text('CONDITIONS FINANCIÈRES', { underline: true });
          doc.fontSize(12);
          doc.text(`Loyer mensuel : ${contrat.loyer_mensuel || 0} FCFA`);
          doc.text(`Dépôt de garantie : ${contrat.montant_depot_garantie_attendu || 0} FCFA`);
          doc.text(`Durée du bail : Du ${contrat.date_debut || ''} au ${contrat.date_fin || ''}`);
          doc.moveDown(2);

          doc.fontSize(16).text('SIGNATURES', { underline: true });
          doc.fontSize(12);
          doc.text('Le propriétaire : ____________________');
          doc.moveDown();
          doc.text('Le locataire : ____________________');
          doc.moveDown(2);
          
          doc.text(`Fait à ${bien.ville || '__________'}, le ${new Date().toLocaleDateString('fr-FR')}`);

          console.log('📝 Contenu ajouté, finalisation...');

          // Finaliser le document
          doc.end();

        } catch (error) {
          console.error('❌ Erreur pendant la génération:', error);
          rejectPromise(error);
        }

      } catch (error) {
        console.error('❌ Erreur générale:', error);
        reject(error);
      }
    });
  }
}

module.exports = ContratPDFServiceFinal;
