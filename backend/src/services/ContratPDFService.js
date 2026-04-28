const PDFDocument = require('pdfkit');

class ContratPDFService {
  static async generateContratPDF(contratData) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Début de la génération PDF avec les données:', JSON.stringify(contratData, null, 2));
        
        // Créer un nouveau document PDF
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4'
        });

        // Buffer pour stocker le PDF
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          try {
            const pdfData = Buffer.concat(buffers);
            console.log('PDF généré avec succès, taille:', pdfData.length);
            resolve(pdfData);
          } catch (error) {
            console.error('Erreur lors de la concaténation des buffers:', error);
            reject(error);
          }
        });
        
        doc.on('error', (error) => {
          console.error('Erreur lors de la génération du PDF:', error);
          reject(error);
        });

        // Valider les données
        if (!contratData || !contratData.contrat) {
          throw new Error('Données de contrat manquantes');
        }

        // Extraire les données avec valeurs par défaut
        const { contrat, bien = {}, proprietaire = {}, locataire = {} } = contratData;

        // En-tête du contrat
        doc.fontSize(20).text('CONTRAT DE LOCATION D\'HABITATION', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text('Entre les soussignés :');
        doc.moveDown();

        // Article 1 - Désignation des parties
        doc.fontSize(14).text('Article 1 – Désignation des parties');
        doc.fontSize(11);

        // Propriétaire
        doc.text('Le/La Propriétaire :');
        doc.text(`Nom et prénom : ${proprietaire?.nom || ''} ${proprietaire?.prenoms || ''}`);
        doc.text(`Adresse : ${proprietaire?.adresse_complete || '............................................................'}`);
        doc.text(`Téléphone / Email : ${proprietaire?.telephone || ''} / ${proprietaire?.email || ''}`);
        doc.moveDown();

        // Locataire
        doc.text('Le/La Locataire :');
        doc.text(`Nom et prénom : ${locataire?.nom || ''} ${locataire?.prenoms || ''}`);
        doc.text(`Adresse actuelle : ${locataire?.adresse || '........................................................'}`);
        doc.text(`Téléphone / Email : ${locataire?.telephone || ''} / ${locataire?.email || ''}`);
        doc.moveDown();

        doc.text('Les parties conviennent de ce qui suit.');
        doc.moveDown();

        // Article 2 - Objet du contrat et description du logement
        doc.fontSize(14).text('Article 2 – Objet du contrat et description du logement');
        doc.fontSize(11);

        doc.text('Le propriétaire donne en location au locataire le logement suivant :');
        doc.moveDown();

        doc.text(`Adresse complète : ${bien?.adresse || ''}, ${bien?.ville || ''}`);
        doc.text(`Type de logement : ${bien?.type_bien || 'appartement / maison / studio'}`);
        doc.text(`Nombre de pièces : ${bien?.nombre_pieces || '......'}`);
        doc.text(`Superficie : ${bien?.superficie || '......'} m²`);
        doc.text(`Équipements : cuisine, sanitaires, chauffe-eau, climatiseur, etc.`);
        doc.text(`Description : ${bien?.description || '............................................................'}`);
        doc.moveDown();

        doc.text('Le logement est loué à usage d\'habitation');
        doc.moveDown();

        // Article 3 - Durée de la location
        doc.fontSize(14).text('Article 3 – Durée de la location');
        doc.fontSize(11);

        const dateDebut = new Date(contrat?.date_debut);
        const dateFin = new Date(contrat?.date_fin);
        const dureeMois = Math.round((dateFin - dateDebut) / (30 * 24 * 60 * 60 * 1000));

        doc.text('La présente location est consentie pour une durée de :');
        doc.text(`${dureeMois} mois, à compter du ${formatDate(dateDebut)}`);
        doc.text(`Elle prendra fin le ${formatDate(dateFin)}, sauf renouvellement ou résiliation selon les conditions prévues au présent contrat.`);
        doc.text('Le contrat peut être renouvelé par accord écrit des parties.');
        doc.moveDown();

        // Article 4 - Loyer
        doc.fontSize(14).text('Article 4 – Loyer');
        doc.fontSize(11);

        const loyer = Number(contrat?.loyer_mensuel) || 0;
        const loyerLettres = convertirNombreEnLettres(loyer);

        doc.text('Le loyer mensuel est fixé à la somme de :');
        doc.text(`${formatMontant(loyer)} (${loyerLettres}), hors charges.`);
        doc.moveDown();

        doc.text('Le loyer est payable :');
        doc.text('périodicité : mensuellement,');
        doc.text('au plus tard le 5 de chaque mois,');
        doc.text('par : virement / mobile money / via notre appli.');
        doc.moveDown();

        doc.text('Le loyer pourra être révisé selon les conditions prévues par la loi en vigueur ou, à défaut, d\'un commun accord entre les parties.');
        doc.moveDown();

        // Article 5 - Charges
        doc.fontSize(14).text('Article 5 – Charges');
        doc.fontSize(11);

        doc.text('Les charges sont gérées directement par le locataire.');
        doc.text('Le locataire s\'engage à souscrire directement aux contrats nécessaires pour :');
        doc.text('- Électricité');
        doc.text('- Eau');
        doc.text('- Internet / TV');
        doc.text('- Et autres services nécessaires à l\'habitation');
        doc.moveDown();

        // Article 6 - Dépôt de garantie
        doc.fontSize(14).text('Article 6 – Dépôt de garantie');
        doc.fontSize(11);

        const depotGarantie = Number(contrat?.montant_depot_garantie_attendu) || 0;
        const nbMoisCaution = contrat?.nb_mois_depot_guarantie || 1;
        const depotLettres = convertirNombreEnLettres(depotGarantie);

        doc.text('À la signature du présent contrat, le locataire verse au propriétaire un dépôt de garantie d\'un montant de :');
        doc.text(`${formatMontant(depotGarantie)} (${depotLettres}), soit ${nbMoisCaution} mois de loyer.`);
        doc.moveDown();

        doc.text('Ce dépôt de garantie a pour objet de couvrir les loyers impayés.');
        doc.text('Il sera restitué au locataire dans un délai de 30 jours après la restitution des clés, déduction faite, le cas échéant, des sommes restant dues ou des réparations justifiées.');
        doc.moveDown();

        // Article 7 - État des lieux
        doc.fontSize(14).text('Article 7 – État des lieux');
        doc.fontSize(11);

        doc.text('Un état des lieux d\'entrée sera établi contradictoirement entre les parties lors de la remise des clés.');
        doc.text('Un état des lieux de sortie sera établi lors du départ du locataire.');
        doc.text('Ces documents seront annexés au présent contrat et serviront de référence pour déterminer les éventuelles dégradations.');
        doc.moveDown();

        // Article 8 - Obligations du locataire
        doc.fontSize(14).text('Article 8 – Obligations du locataire');
        doc.fontSize(11);

        doc.text('Le locataire s\'engage à :');
        doc.text('- Payer le loyer aux échéances convenues.');
        doc.text('- Utiliser les lieux paisiblement conformément à leur destination d\'habitation.');
        doc.text('- Réaliser les réparations locatives courantes (petits entretiens) et veiller à la propreté du logement.');
        doc.text('- Ne pas transformer les lieux sans l\'accord écrit du bailleur.');
        doc.text('- Respecter le règlement de copropriété ou d\'immeuble, le cas échéant.');
        doc.text('- Souscrire une assurance habitation et fournir une attestation au propriétaire.');
        doc.moveDown();

        // Article 9 - Obligations du propriétaire
        doc.fontSize(14).text('Article 9 – Obligations du propriétaire');
        doc.fontSize(11);

        doc.text('Le propriétaire s\'engage à :');
        doc.text('- Délivrer au locataire un logement décent et en bon état d\'usage.');
        doc.text('- Assurer au locataire une jouissance paisible des lieux.');
        doc.text('- Effectuer les gros travaux à sa charge (structure, toiture, gros équipements) selon la loi ou les usages.');
        doc.text('- Remettre au locataire les quittances de loyer sur demande.');
        doc.moveDown();

        // Article 10 - Résiliation du contrat
        doc.fontSize(14).text('Article 10 – Résiliation du contrat');
        doc.fontSize(11);

        doc.text('Le contrat peut être résilié :');
        doc.text('Par le locataire, moyennant un préavis de 1 mois, notifié par écrit au propriétaire.');
        doc.text('Par le propriétaire, dans les conditions prévues par la loi et/ou le présent contrat (par exemple en cas de loyers impayés répétés ou de manquement grave du locataire).');
        doc.moveDown();

        doc.text('En cas de résiliation, le locataire doit :');
        doc.text('- Libérer les lieux à la date de fin de préavis,');
        doc.text('- Restituer les clés,');
        doc.text('- Payer les loyers dus jusqu\'à cette date.');
        doc.moveDown();

        // Article 11 - Clause de non-paiement
        doc.fontSize(14).text('Article 11 – Clause de non-paiement');
        doc.fontSize(11);

        doc.text('En cas de non-paiement du loyer à l\'échéance, après mise en demeure restée sans effet, le propriétaire pourra demander la résiliation du contrat et l\'expulsion du locataire selon les procédures prévues par la loi.');
        doc.moveDown();

        // Article 12 - Divers
        doc.fontSize(14).text('Article 12 – Divers');
        doc.fontSize(11);

        doc.text('Toute modification du présent contrat devra être faite par écrit et signée par les deux parties.');
        doc.text('En cas de litige, les parties s\'efforceront de trouver une solution amiable avant de saisir les tribunaux compétents.');
        doc.moveDown();

        // Signatures
        const dateActuelle = new Date();
        doc.text(`Fait à ${bien?.ville || '........................................'}, le ${formatDate(dateActuelle)}`);
        doc.moveDown(2);

        doc.text('Le Bailleur (signature précédée de la mention "Lu et approuvé") :');
        doc.moveDown(3);
        doc.text('Le Locataire (signature précédée de la mention "Lu et approuvé") :');

        // Finaliser le PDF
        try {
          // S'assurer que le document se termine correctement
          doc.end();
          console.log('Document PDF terminé, en attente de la fin du stream...');
        } catch (error) {
          console.error('Erreur lors de la finalisation du document:', error);
          reject(error);
        }

      } catch (error) {
        console.error('Erreur générale dans la génération PDF:', error);
        reject(error);
      }
    });
  }
}

// Fonctions utilitaires
function formatDate(date) {
  return date.toLocaleDateString('fr-FR');
}

function formatMontant(montant) {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

function convertirNombreEnLettres(nombre) {
  // Fonction simplifiée de conversion en lettres
  if (nombre === 0) return 'zéro';
  if (nombre < 1000) {
    const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 
                   'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    
    if (nombre < 20) return unites[nombre];
    const dizaine = Math.floor(nombre / 10);
    const unite = nombre % 10;
    
    let resultat = dizaines[dizaine];
    if (unite > 0) {
      if (dizaine === 7 || dizaine === 9) {
        resultat = dizaines[dizaine - 1] + '-' + unites[10 + unite];
      } else {
        resultat += '-' + unites[unite];
      }
    }
    return resultat;
  }
  
  // Pour les montants plus grands, retourne une version simplifiée
  return `${nombre} francs CFA`;
}

module.exports = ContratPDFService;
