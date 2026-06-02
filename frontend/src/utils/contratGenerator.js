export const generateContratHTML = (contrat, bien, locataire, proprietaire) => {
  const bailleurNom = proprietaire ? `${proprietaire.prenoms || ''} ${proprietaire.nom || ''}`.trim() : contrat.proprietaire_nom ? `${contrat.proprietaire_prenoms || ''} ${contrat.proprietaire_nom}`.trim() : 'Propriétaire';
  const bailleurTel = proprietaire?.telephone || contrat.proprietaire_telephone || '........................';
  const bailleurAdresse = proprietaire?.adresse_fiscale || proprietaire?.adresse || contrat.proprietaire_adresse || '..................................................';
  
  const locataireNom = locataire ? `${locataire.prenoms || ''} ${locataire.nom || ''}`.trim() : contrat.locataire_nom ? `${contrat.locataire_prenoms || ''} ${contrat.locataire_nom}`.trim() : 'Locataire';
  const locataireTel = locataire?.telephone || contrat.locataire_telephone || '........................';
  const locatairePiece = locataire?.piece_identite || contrat.piece_identite || '..................................................';
  
  const bienAdresse = bien?.adresse || contrat.bien_adresse || contrat.bien_titre || '..................................................';
  const bienPieces = bien?.nombre_pieces || contrat.nombre_pieces || '...................................';
  const typeBien = bien?.type_bien || contrat.type_bien || '........................';
  
  const dateDebut = contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString('fr-FR') : '';
  const dateFin = contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString('fr-FR') : '';
  const dateSignature = contrat.date_signature ? new Date(contrat.date_signature).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
  const loyer = Number(contrat.loyer_mensuel || contrat.loyer).toLocaleString('fr-FR');
  const caution = Number(contrat.montant_depot_garantie_attendu || contrat.depot_garantie || 0).toLocaleString('fr-FR');
  const nbMois = contrat.nb_mois_depot_garantie || 1;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>CONTRAT DE BAIL - ${contrat.numero_contrat}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.6; color: #000; padding: 60px; max-width: 850px; margin: auto; background: #fff; text-align: justify; }
        h1.title { text-align: center; font-size: 20px; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-bottom: 30px; }
        .section-title { font-weight: bold; font-size: 15px; margin-top: 25px; margin-bottom: 10px; }
        .article-title { font-weight: bold; text-decoration: underline; margin-right: 5px; }
        p { margin-bottom: 10px; }
        .indent { padding-left: 30px; }
        .uppercase { text-transform: uppercase; font-weight: bold; }
        .signature-grid { display: grid; grid-template-columns: 1fr 1fr; margin-top: 50px; }
        .signature-box { text-align: center; }
        .no-print { display: block; }
        @media print {
            body { padding: 30px; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>

<div class="no-print" style="text-align:center; margin-bottom:20px;" contenteditable="false">
    <button onclick="window.print()" style="padding:10px 20px; background:#1e3a8a; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">Imprimer le contrat</button>
</div>

<h1 class="title">CONTRAT DE BAIL</h1>
<p style="text-align: right; font-size: 12px; color: #555;">Référence : <strong>${contrat.numero_contrat}</strong></p>

<p class="uppercase">ENTRE :</p>

<p class="indent">
    1. <strong>${bailleurNom}</strong>, résidant au ${bailleurAdresse}, joignable au ${bailleurTel}, 
</p>
<p>Ci-après dénommé « <strong>Bailleur</strong> », d'une part ;</p>

<p class="uppercase" style="margin-top: 15px;">ET</p>

<p class="indent">
    2. <strong>${locataireNom}</strong>, joignable au ${locataireTel}, détenteur de la pièce d'identité N° <strong>${locatairePiece}</strong>,
</p>
<p>Ci-après dénommé « <strong>Locataire</strong> », d'autre part ;</p>

<p class="uppercase" style="text-align: center; text-decoration: underline; margin-top: 30px; margin-bottom: 25px;">
    IL A ETE CONVENU ET ARRETE CE QUI SUIT :
</p>

<div class="section">
    <p><span class="article-title">Article 1 : Description du bien</span></p>
    <p>Le bailleur donne en location au locataire, qui accepte, sous les conditions ci-dessous stipulées, un bien immobilier à usage d'habitation de type <strong>${typeBien}</strong> situé à <strong>${bienAdresse}</strong>. Il comprend <strong>${bienPieces}</strong> pièces.</p>
</div>

<div class="section">
    <p><span class="article-title">Article 2 : Destination des lieux et aménagements</span></p>
    <p>Les lieux sont loués à usage exclusivement résidentiel. Le locataire ne pourra, en aucun cas, utiliser les lieux en tout ou partie pour une destination autre que celle prévue aux présentes.</p>
</div>

<div class="section">
    <p><span class="article-title">Article 3 : Durée du bail</span></p>
    <p>Le présent bail est consenti pour une durée de <strong>1 an</strong>, à compter du <strong>${dateDebut}</strong> jusqu'au <strong>${dateFin}</strong>, renouvelable.</p>
    <p>L'absence de notification écrite par une des parties du souhait de résiliation de ce présent contrat traduirait sa reconduction tacite et automatique pour une nouvelle période d'une année.</p>
</div>

<div class="section">
    <p><span class="article-title">Article 4 : Loyer et Charges</span></p>
    <p>Le loyer mensuel est fixé à la somme de <strong>${loyer} FCFA</strong>. Les charges locatives courantes sont à la charge du locataire.</p>
    <p>Le loyer doit être payé au plus tard le <strong>5</strong> de chaque mois.</p>
</div>

<div class="section">
    <p><span class="article-title">Article 5 : Caution (Dépôt de Garantie)</span></p>
    <p>A titre de garantie de l'exécution de ses obligations, le locataire verse une caution d'un montant de <strong>${caution} FCFA</strong> (soit ${nbMois} mois de loyer).</p>
    <p>Cette caution est remboursable à la fin du bail à la restitution des clés, après déduction des sommes dues au titre des éventuels dégâts locatifs ou arriérés de paiement.</p>
</div>

<div class="section">
    <p><span class="article-title">Article 6 : Obligations du Locataire</span></p>
    <p>Le locataire s'engage notamment à payer le loyer à temps, à entretenir le logement en bon père de famille, à ne pas sous-louer sans autorisation écrite préalable, à respecter la tranquillité du voisinage et à restituer le bien dans son état initial.</p>
</div>

<div class="section">
    <p><span class="article-title">Article 7 : Obligations du Bailleur</span></p>
    <p>Le bailleur s'engage à délivrer un logement décent en bon état d'usage, à assurer la jouissance paisible du bien au locataire et à effectuer les grosses réparations qui lui incombent légalement.</p>
</div>

<div class="section">
    <p><span class="article-title">Article 8 : Résiliation du Contrat</span></p>
    <p>Le contrat peut être résilié par le locataire avec un préavis d'un (1) mois. Il peut être résilié de plein droit par le bailleur en cas de non-paiement du loyer, de dégradation significative du bien ou de non-respect des clauses du présent contrat.</p>
</div>

<div class="section">
    <p><span class="article-title">Article 9 : État des Lieux</span></p>
    <p>Un état des lieux contradictoire est réalisé obligatoirement à l'entrée dans les lieux, ainsi qu'à la sortie lors de la remise des clés.</p>
</div>

<div class="section signature-section">
    <p style="margin-top: 40px; text-align: right;">Fait à ..................................., le <strong>${dateSignature}</strong></p>
    <div class="signature-grid">
        <div class="signature-box">
            <p><strong>Le Bailleur</strong></p>
            <p style="font-size:11px; margin-bottom: 60px;">(Faire précéder de la mention « Lu et approuvé »)</p>
        </div>
        <div class="signature-box">
            <p><strong>Le Locataire</strong></p>
            <p style="font-size:11px; margin-bottom: 60px;">(Faire précéder de la mention « Lu et approuvé »)</p>
        </div>
    </div>
</div>

</body>
</html>`;
};

export const printContrat = (contrat, bien, locataire, proprietaire) => {
  const html = generateContratHTML(contrat, bien, locataire, proprietaire);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
};
