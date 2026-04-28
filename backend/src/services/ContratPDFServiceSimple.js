const PDFDocument = require('pdfkit');

class ContratPDFServiceSimple {
  static async generateContratPDF(contratData) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Début génération PDF simplifiée...');
        
        // Créer un nouveau document PDF
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4'
        });

        // Buffer pour stocker le PDF
        const buffers = [];
        
        doc.on('data', (chunk) => {
          buffers.push(chunk);
        });
        
        doc.on('end', () => {
          try {
            const pdfData = Buffer.concat(buffers);
            console.log('✅ PDF généré avec succès, taille:', pdfData.length);
            resolve(pdfData);
          } catch (error) {
            console.error('❌ Erreur lors de la concaténation:', error);
            reject(error);
          }
        });
        
        doc.on('error', (error) => {
          console.error('❌ Erreur PDFKit:', error);
          reject(error);
        });

        // Valider les données
        if (!contratData || !contratData.contrat) {
          throw new Error('Données de contrat manquantes');
        }

        const { contrat, bien = {}, proprietaire = {}, locataire = {} } = contratData;

        // Contenu simplifié mais fonctionnel
        doc.fontSize(20).text('CONTRAT DE LOCATION', { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).text('PARTIES:');
        doc.moveDown();

        doc.fontSize(12).text('PROPRIÉTAIRE:');
        doc.text(`Nom: ${proprietaire.nom || ''} ${proprietaire.prenoms || ''}`);
        doc.text(`Email: ${proprietaire.email || ''}`);
        doc.moveDown();

        doc.text('LOCATAIRE:');
        doc.text(`Nom: ${locataire.nom || ''} ${locataire.prenoms || ''}`);
        doc.text(`Email: ${locataire.email || ''}`);
        doc.moveDown();

        doc.fontSize(14).text('BIEN LOUÉ:');
        doc.fontSize(12);
        doc.text(`Titre: ${bien.titre || ''}`);
        doc.text(`Adresse: ${bien.adresse || ''}, ${bien.ville || ''}`);
        doc.text(`Type: ${bien.type_bien || ''}`);
        doc.text(`Superficie: ${bien.superficie || ''} m²`);
        doc.moveDown();

        doc.fontSize(14).text('CONDITIONS:');
        doc.fontSize(12);
        doc.text(`Loyer mensuel: ${contrat.loyer_mensuel || 0} FCFA`);
        doc.text(`Début: ${contrat.date_debut || ''}`);
        doc.text(`Fin: ${contrat.date_fin || ''}`);
        doc.text(`Dépôt de garantie: ${contrat.montant_depot_garantie_attendu || 0} FCFA`);
        doc.moveDown();

        doc.fontSize(14).text('SIGNATURES:');
        doc.fontSize(12);
        doc.text('Propriétaire: _____________________');
        doc.text('Locataire: _____________________');
        doc.moveDown();

        doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`);

        // Finaliser le document
        doc.end();
        console.log('📄 Document finalisé, attente du stream...');

      } catch (error) {
        console.error('❌ Erreur générale:', error);
        reject(error);
      }
    });
  }
}

module.exports = ContratPDFServiceSimple;
