class ContratPDFServiceHTML {
  static formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('fr-FR');
  }

  static async generateContratPDF(contratData) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Début génération PDF (approche HTML)...');
        console.log('📋 Données brutes reçues:', JSON.stringify(contratData, null, 2));
        
        // Validation améliorée
        if (!contratData) {
          throw new Error('Aucune donnée reçue');
        }
        
        // Gérer les différentes structures possibles
        let contrat, bien, proprietaire, locataire;
        
        if (contratData.contrat) {
          // Structure { contrat: {...}, bien: {...}, proprietaire: {...}, locataire: {...} }
          contrat = contratData.contrat;
          bien = contratData.bien || {};
          proprietaire = contratData.proprietaire || {};
          locataire = contratData.locataire || {};
        } else {
          // Structure directe avec les données du contrat
          contrat = contratData;
          bien = contratData.bien || {};
          proprietaire = contratData.proprietaire || {};
          locataire = contratData.locataire || {};
        }
        
        console.log('✅ Données extraites:');
        console.log('  - Contrat:', contrat);
        console.log('  - Bien:', bien);
        console.log('  - Propriétaire:', proprietaire);
        console.log('  - Locataire:', locataire);

        // Créer un HTML optimisé pour l'impression
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>CONTRAT DE LOCATION</title>
            <style>
              @media print {
                body { margin: 20px; font-size: 12pt; }
                .no-print { display: none; }
                .page-break { page-break-before: always; }
              }
              body { 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                line-height: 1.6; 
                color: #000;
                background: #fff;
              }
              .header { text-align: center; margin-bottom: 40px; }
              h1 { 
                text-align: center; 
                font-size: 20px; 
                margin-bottom: 30px; 
                font-weight: bold;
                text-transform: uppercase;
              }
              h2 { 
                font-size: 16px; 
                margin-top: 25px; 
                margin-bottom: 15px; 
                border-bottom: 2px solid #000; 
                padding-bottom: 5px; 
                font-weight: bold;
              }
              p { margin: 12px 0; text-align: justify; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
              .info-item { margin: 8px 0; }
              .info-label { font-weight: bold; display: inline-block; min-width: 120px; }
              .signature { 
                margin-top: 80px; 
                text-align: center;
              }
              .signature-line { 
                border-bottom: 1px solid #000; 
                width: 300px; 
                display: inline-block; 
                margin: 5px 0;
                height: 30px;
              }
              .date-place { text-align: center; margin-top: 40px; font-style: italic; }
              .footer { 
                margin-top: 50px; 
                text-align: center; 
                font-size: 10px; 
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>CONTRAT DE LOCATION</h1>
            </div>
            
            <h2>ARTICLE 1 - PARTIES CONCERNÉES</h2>
            <div class="info-grid">
              <div>
                <div class="info-item"><span class="info-label">Propriétaire :</span> ${proprietaire?.nom || 'N/A'} ${proprietaire?.prenoms || ''}</div>
                <div class="info-item"><span class="info-label">Email :</span> ${proprietaire?.email || 'N/A'}</div>
                <div class="info-item"><span class="info-label">Téléphone :</span> ${proprietaire?.telephone || 'N/A'}</div>
              </div>
              <div>
                <div class="info-item"><span class="info-label">Locataire :</span> ${locataire?.nom || 'N/A'} ${locataire?.prenoms || ''}</div>
                <div class="info-item"><span class="info-label">Email :</span> ${locataire?.email || 'N/A'}</div>
                <div class="info-item"><span class="info-label">Téléphone :</span> ${locataire?.telephone || 'N/A'}</div>
              </div>
            </div>
            
            <h2>ARTICLE 2 - BIEN LOUÉ</h2>
            <div class="info-item"><span class="info-label">Désignation :</span> ${bien?.titre || 'N/A'}</div>
            <div class="info-item"><span class="info-label">Adresse :</span> ${bien?.adresse || 'N/A'}, ${bien?.ville || 'N/A'}</div>
            <div class="info-item"><span class="info-label">Type :</span> ${bien?.type_bien || 'N/A'}</div>
            <div class="info-item"><span class="info-label">Superficie :</span> ${bien?.superficie || '0'} m²</div>
            ${bien?.nombre_pieces ? `<div class="info-item"><span class="info-label">Nombre de pièces :</span> ${bien.nombre_pieces}</div>` : ''}
            
            <h2>ARTICLE 3 - CONDITIONS FINANCIÈRES</h2>
            <div class="info-item"><span class="info-label">Loyer mensuel :</span> ${Number(contrat?.loyer_mensuel || 0).toLocaleString('fr-FR')} FCFA</div>
            <div class="info-item"><span class="info-label">Dépôt de garantie :</span> ${Number(contrat?.montant_depot_garantie_attendu || 0).toLocaleString('fr-FR')} FCFA</div>
            <div class="info-item"><span class="info-label">Durée du bail :</span> Du ${ContratPDFServiceHTML.formatDate(contrat?.date_debut) || 'N/A'} au ${ContratPDFServiceHTML.formatDate(contrat?.date_fin) || 'N/A'}</div>
            ${contrat?.nb_mois_depot_guarantie ? `<div class="info-item"><span class="info-label">Mois de caution :</span> ${contrat.nb_mois_depot_guarantie}</div>` : ''}
            
            <div class="signature">
              <h2>ARTICLE 4 - SIGNATURES</h2>
              <p>Les parties soussignées déclarent avoir lu et approuvé les conditions du présent contrat et s'engagent à en respecter toutes les clauses.</p>
              <br>
              <div style="display: flex; justify-content: space-between; margin-top: 60px;">
                <div style="text-align: center;">
                  <div class="signature-line"></div>
                  <p><strong>Le propriétaire</strong></p>
                  <p>${proprietaire?.nom || 'N/A'} ${proprietaire?.prenoms || ''}</p>
                </div>
                <div style="text-align: center;">
                  <div class="signature-line"></div>
                  <p><strong>Le locataire</strong></p>
                  <p>${locataire?.nom || 'N/A'} ${locataire?.prenoms || ''}</p>
                </div>
              </div>
            </div>
            
            <div class="date-place">
              <p><strong>Fait à ${bien?.ville || '__________'}, le ${new Date().toLocaleDateString('fr-FR')}</strong></p>
            </div>
            
            <div class="footer no-print">
              <p>Document généré par l'application de gestion immobilière le ${new Date().toLocaleString('fr-FR')}</p>
            </div>
          </body>
          </html>
        `;

        // Validation du HTML généré
        if (!html || html.trim().length === 0) {
          throw new Error('HTML généré vide');
        }
        
        // Créer un buffer à partir de l'HTML
        const buffer = Buffer.from(html, 'utf8');
        console.log('✅ HTML créé, taille:', buffer.length, 'bytes');
        console.log('📄 Aperçu HTML (premiers 200 chars):', html.substring(0, 200));
        
        // Validation du buffer
        if (buffer.length === 0) {
          throw new Error('Buffer vide après création');
        }
        
        // Pour l'instant, retourner l'HTML comme "PDF"
        // Dans un vrai environnement, vous utiliseriez puppeteer ou jsPDF
        resolve(buffer);
        
      } catch (error) {
        console.error('❌ Erreur générale:', error);
        reject(error);
      }
    });
  }
}

module.exports = ContratPDFServiceHTML;
