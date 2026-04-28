const PDFDocument = require('pdfkit');

class ContratPDFServiceSync {
  static async generateContratPDF(contratData) {
    return new Promise((resolve, reject) => {
      console.log('🔄 Début génération PDF (mode synchrone)...');
      
      try {
        // Validation
        if (!contratData || !contratData.contrat) {
          throw new Error('Données de contrat manquantes');
        }

        const { contrat, bien = {}, proprietaire = {}, locataire = {} } = contratData;

        // Créer le document
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4'
        });

        // Tableau pour stocker les chunks
        const chunks = [];
        
        doc.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          console.log('✅ PDF généré, taille:', pdfBuffer.length);
          
          if (pdfBuffer.length === 0) {
            reject(new Error('PDF vide'));
          } else {
            resolve(pdfBuffer);
          }
        });

        doc.on('error', (err) => {
          console.error('❌ Erreur PDF:', err);
          reject(err);
        });

        // Ajouter le contenu
        doc.fontSize(20).text('CONTRAT DE LOCATION', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(16).text('ENTRE LES SOUSSIGNÉS');
        doc.moveDown();

        doc.fontSize(12).text('PROPRIÉTAIRE :');
        doc.text(`Nom : ${proprietaire.nom || ''} ${proprietaire.prenoms || ''}`);
        doc.text(`Email : ${proprietaire.email || ''}`);
        doc.moveDown();

        doc.text('LOCATAIRE :');
        doc.text(`Nom : ${locataire.nom || ''} ${locataire.prenoms || ''}`);
        doc.text(`Email : ${locataire.email || ''}`);
        doc.moveDown(2);

        doc.fontSize(16).text('OBJET DU CONTRAT');
        doc.fontSize(12);
        doc.text(`Bien : ${bien.titre || ''}`);
        doc.text(`Adresse : ${bien.adresse || ''}, ${bien.ville || ''}`);
        doc.moveDown(2);

        doc.fontSize(16).text('CONDITIONS FINANCIÈRES');
        doc.fontSize(12);
        doc.text(`Loyer mensuel : ${contrat.loyer_mensuel || 0} FCFA`);
        doc.text(`Dépôt de garantie : ${contrat.montant_depot_garantie_attendu || 0} FCFA`);
        doc.text(`Durée : Du ${contrat.date_debut || ''} au ${contrat.date_fin || ''}`);
        doc.moveDown(2);

        doc.fontSize(16).text('SIGNATURES');
        doc.fontSize(12);
        doc.text('Le propriétaire : ____________________');
        doc.moveDown();
        doc.text('Le locataire : ____________________');
        doc.moveDown(2);
        
        doc.text(`Fait à ${bien.ville || '__________'}, le ${new Date().toLocaleDateString('fr-FR')}`);

        // Forcer la fin du document
        setTimeout(() => {
          try {
            doc.end();
          } catch (err) {
            console.error('Erreur lors de la fin:', err);
            reject(err);
          }
        }, 100);

      } catch (error) {
        console.error('❌ Erreur générale:', error);
        reject(error);
      }
    });
  }
}

module.exports = ContratPDFServiceSync;
