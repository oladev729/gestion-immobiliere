const PDFDocument = require('pdfkit');

class ContratPDFServiceBuffer {
  static async generateContratPDF(contratData) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Début génération PDF (approche buffer)...');
        
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

        // Utiliser un buffer manuel
        const buffers = [];
        let totalSize = 0;
        
        doc.on('data', (chunk) => {
          buffers.push(chunk);
          totalSize += chunk.length;
          console.log('📦 Chunk:', chunk.length, 'bytes, total:', totalSize);
        });
        
        doc.on('end', () => {
          try {
            if (buffers.length > 0) {
              const pdfData = Buffer.concat(buffers);
              console.log('✅ PDF terminé, taille:', pdfData.length, 'bytes');
              
              if (pdfData.length > 100) { // Vérifier que le PDF a une taille minimale
                resolve(pdfData);
              } else {
                // Créer un PDF de remplacement
                createFallbackPDF(contratData).then(resolve).catch(reject);
              }
            } else {
              createFallbackPDF(contratData).then(resolve).catch(reject);
            }
          } catch (error) {
            console.error('❌ Erreur concaténation:', error);
            createFallbackPDF(contratData).then(resolve).catch(reject);
          }
        });
        
        doc.on('error', (error) => {
          console.error('❌ Erreur PDFKit:', error);
          createFallbackPDF(contratData).then(resolve).catch(reject);
        });

        // Fonction de fallback
        function createFallbackPDF(data) {
          return new Promise((res, rej) => {
            const fallbackDoc = new PDFDocument({ margin: 50, size: 'A4' });
            const fallbackBuffers = [];
            
            fallbackDoc.on('data', (chunk) => fallbackBuffers.push(chunk));
            fallbackDoc.on('end', () => {
              try {
                const fallbackPdf = Buffer.concat(fallbackBuffers);
                console.log('✅ Fallback PDF, taille:', fallbackPdf.length);
                res(fallbackPdf);
              } catch (e) {
                rej(e);
              }
            });
            
            fallbackDoc.on('error', rej);
            
            // Contenu du fallback
            fallbackDoc.fontSize(20).text('CONTRAT DE LOCATION', { align: 'center' });
            fallbackDoc.moveDown();
            
            fallbackDoc.fontSize(14).text('PARTIES CONCERNÉES');
            fallbackDoc.fontSize(12);
            fallbackDoc.text(`Propriétaire: ${proprietaire.nom || ''} ${proprietaire.prenoms || ''}`);
            fallbackDoc.text(`Locataire: ${locataire.nom || ''} ${locataire.prenoms || ''}`);
            fallbackDoc.moveDown();
            
            fallbackDoc.fontSize(14).text('BIEN LOUÉ');
            fallbackDoc.fontSize(12);
            fallbackDoc.text(`Désignation: ${bien.titre || ''}`);
            fallbackDoc.text(`Adresse: ${bien.adresse || ''}, ${bien.ville || ''}`);
            fallbackDoc.moveDown();
            
            fallbackDoc.fontSize(14).text('CONDITIONS');
            fallbackDoc.fontSize(12);
            fallbackDoc.text(`Loyer mensuel: ${contrat.loyer_mensuel || 0} FCFA`);
            fallbackDoc.text(`Durée: Du ${contrat.date_debut || ''} au ${contrat.date_fin || ''}`);
            fallbackDoc.moveDown();
            
            fallbackDoc.fontSize(14).text('SIGNATURES');
            fallbackDoc.fontSize(12);
            fallbackDoc.text('Le propriétaire: ____________________');
            fallbackDoc.text('Le locataire: ____________________');
            fallbackDoc.moveDown();
            fallbackDoc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`);
            
            fallbackDoc.end();
          });
        }

        try {
          // Ajouter le contenu principal
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
          doc.end();
          
        } catch (error) {
          console.error('❌ Erreur pendant la génération:', error);
          createFallbackPDF(contratData).then(resolve).catch(reject);
        }

      } catch (error) {
        console.error('❌ Erreur générale:', error);
        reject(error);
      }
    });
  }
}

module.exports = ContratPDFServiceBuffer;
