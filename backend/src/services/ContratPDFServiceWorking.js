const PDFDocument = require('pdfkit');

class ContratPDFServiceWorking {
  static async generateContratPDF(contratData) {
    return new Promise((resolve, reject) => {
      console.log('🔄 Début génération PDF (version corrigée)...');
      
      // Créer un nouveau document PDF
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      const buffers = [];
      
      // Événement de données
      doc.on('data', (chunk) => {
        buffers.push(chunk);
        console.log('📦 Chunk reçu, taille:', chunk.length);
      });
      
      // Événement de fin
      doc.on('end', () => {
        try {
          const pdfData = Buffer.concat(buffers);
          console.log('✅ PDF terminé, taille totale:', pdfData.length, 'bytes');
          
          if (pdfData.length === 0) {
            reject(new Error('Le PDF généré est vide'));
          } else {
            resolve(pdfData);
          }
        } catch (error) {
          console.error('❌ Erreur concaténation:', error);
          reject(error);
        }
      });
      
      // Événement d'erreur
      doc.on('error', (error) => {
        console.error('❌ Erreur PDFKit:', error);
        reject(error);
      });

      try {
        // Validation
        if (!contratData || !contratData.contrat) {
          throw new Error('Données de contrat manquantes');
        }

        const { contrat, bien = {}, proprietaire = {}, locataire = {} } = contratData;

        console.log('📝 Ajout du contenu au PDF...');

        // Ajouter le contenu de manière synchrone
        doc.fontSize(20).text('CONTRAT DE LOCATION', { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).text('PARTIES:');
        doc.fontSize(12);
        doc.text(`Propriétaire: ${proprietaire.nom || ''} ${proprietaire.prenoms || ''}`);
        doc.text(`Locataire: ${locataire.nom || ''} ${locataire.prenoms || ''}`);
        doc.moveDown();

        doc.fontSize(14).text('BIEN:');
        doc.fontSize(12);
        doc.text(`${bien.titre || ''} - ${bien.adresse || ''}, ${bien.ville || ''}`);
        doc.moveDown();

        doc.fontSize(14).text('CONDITIONS:');
        doc.fontSize(12);
        doc.text(`Loyer: ${contrat.loyer_mensuel || 0} FCFA`);
        doc.text(`Période: ${contrat.date_debut || ''} au ${contrat.date_fin || ''}`);
        doc.moveDown();

        doc.fontSize(14).text('SIGNATURES:');
        doc.fontSize(12);
        doc.text('Propriétaire: _____________________');
        doc.moveDown();
        doc.text('Locataire: _____________________');
        doc.moveDown();
        doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`);

        console.log('📄 Contenu ajouté, finalisation du document...');

        // Finaliser le document
        doc.end();
        
      } catch (error) {
        console.error('❌ Erreur pendant la génération:', error);
        reject(error);
      }
    });
  }
}

module.exports = ContratPDFServiceWorking;
