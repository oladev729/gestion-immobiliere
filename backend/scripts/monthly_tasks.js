const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const LoyerMensuel = require('../src/models/LoyerMensuel');

/**
 * Script pour les tâches mensuelles automatiques
 * Ce script doit être exécuté périodiquement (par exemple via cron job)
 * 
 * Tâches effectuées:
 * 1. Génération des échéances mensuelles pour tous les contrats actifs
 * 2. Génération des notifications pour les échéances proches
 */

async function runMonthlyTasks() {
    try {
        console.log('🚀 Démarrage des tâches mensuelles...');
        console.log('📅 Date:', new Date().toISOString());

        // 1. Générer les échéances mensuelles pour tous les contrats actifs
        console.log('\n📋 Génération des échéances mensuelles...');
        const echeances = await LoyerMensuel.genererEcheancesMensuelles();
        console.log(`✅ ${echeances.length} échéance(s) créée(s)`);

        // Note: La génération des notifications se fera via un appel API séparé
        // car elle nécessite le contexte de l'application pour accéder aux routes

        console.log('\n✅ Tâches mensuelles terminées avec succès');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors des tâches mensuelles:', error);
        process.exit(1);
    }
}

// Exécuter les tâches
runMonthlyTasks();
