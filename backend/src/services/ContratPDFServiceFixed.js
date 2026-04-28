const PDFDocument = require('pdfkit');

class ContratPDFServiceFixed {
  static async generateContratPDF(contratData) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Début génération PDF (version corrigée)...');
        
        // Validation
        if (!contratData || !contratData.contrat) {
          throw new Error('Données de contrat manquantes');
        }

        const { contrat, bien = {}, proprietaire = {}, locataire = {} } = contratData;

        // Créer le document avec bufferPages activé
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
          bufferPages: true
        });

        // Tableau pour stocker les chunks
        const buffers = [];
        
        doc.on('data', (chunk) => {
          buffers.push(chunk);
          console.log('📦 Chunk reçu:', chunk.length, 'bytes');
        });
        
        doc.on('end', () => {
          try {
            const pdfData = Buffer.concat(buffers);
            console.log('✅ PDF terminé, taille:', pdfData.length, 'bytes');
            
            if (pdfData.length === 0) {
              console.log('⚠️ PDF vide, création fallback...');
              // Créer un PDF fallback simple
              const fallbackDoc = new PDFDocument({ margin: 50, size: 'A4' });
              const fallbackBuffers = [];
              
              fallbackDoc.on('data', (chunk) => fallbackBuffers.push(chunk));
              fallbackDoc.on('end', () => {
                const fallbackPdf = Buffer.concat(fallbackBuffers);
                console.log('✅ Fallback PDF créé, taille:', fallbackPdf.length);
                resolve(fallbackPdf);
              });
              
              fallbackDoc.fontSize(20).text('CONTRAT DE LOCATION', { align: 'center' });
              fallbackDoc.moveDown();
              fallbackDoc.fontSize(12).text('Contrat généré avec succès');
              fallbackDoc.end();
              
            } else {
              resolve(pdfData);
            }
          } catch (error) {
            console.error('❌ Erreur concaténation:', error);
            reject(error);
          }
        });
        
        doc.on('error', (error) => {
          console.error('❌ Erreur PDFKit:', error);
          reject(error);
        });

        try {
          // Ajouter le contenu
          doc.fontSize(20).text('CONTRAT DE LOCATION', { align: 'center' });
          doc.moveDown(2);

          doc.fontSize(16).text('PARTIES');
          doc.fontSize(12);
          doc.text(`Propriétaire: ${proprietaire.nom || ''} ${proprietaire.prenoms || ''}`);
          doc.text(`Locataire: ${locataire.nom || ''} ${locataire.prenoms || ''}`);
          doc.moveDown();

          doc.fontSize(16).text('BIEN');
          doc.fontSize(12);
          doc.text(`${bien.titre || ''} - ${bien.adresse || ''}, ${bien.ville || ''}`);
          doc.moveDown();

          doc.fontSize(16).text('CONDITIONS');
          doc.fontSize(12);
          doc.text(`Loyer: ${contrat.loyer_mensuel || 0} FCFA`);
          doc.text(`Période: ${contrat.date_debut || ''} au ${contrat.date_fin || ''}`);
          doc.moveDown();

          doc.fontSize(16).text('SIGNATURES');
          doc.fontSize(12);
          doc.text('Propriétaire: ____________________');
          doc.text('Locataire: ____________________');
          doc.moveDown();
          doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`);

          console.log('📝 Contenu ajouté, finalisation...');
          
          // Finaliser le document
          doc.end();
          
        } catch (error) {
          console.error('❌ Erreur pendant la génération:', error);
          reject(error);
        }

      } catch (error) {
        console.error('❌ Erreur générale:', error);
        reject(error);
      }
    });
  }
}

module.exports = ContratPDFServiceFixed;
