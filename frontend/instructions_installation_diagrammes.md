# Instructions d'Installation des Diagrammes

## Étape 1: Installer les dépendances

```bash
npm install chart.js react-chartjs-2
```

## Étape 2: Redémarrer le serveur

```bash
npm start
```

## Étape 3: Vérifier l'intégration

1. Accéder au dashboard propriétaire
2. Les diagrammes devraient apparaître dans les cartes:
   - "Répartition des Revenus" (diagramme circulaire)
   - "Performance Mensuelle" (diagramme en lignes)

## Étape 4: Personnaliser les données

Pour utiliser des données réelles, modifier les composants:

### RevenueChart.jsx
```javascript
// Récupérer les données depuis l'API
const [revenueData, setRevenueData] = useState([]);

useEffect(() => {
  api.get('/paiements/statistiques')
     .then(res => setRevenueData(res.data))
     .catch(err => console.error(err));
}, []);
```

### MonthlyPerformanceChart.jsx
```javascript
// Récupérer les performances mensuelles
const [performanceData, setPerformanceData] = useState([]);

useEffect(() => {
  api.get('/paiements/performance-mensuelle')
     .then(res => setPerformanceData(res.data))
     .catch(err => console.error(err));
}, []);
```

## Étape 5: Options supplémentaires

### Ajouter d'autres types de diagrammes:

1. **Diagramme en barres horizontales** pour les biens les plus rentables
2. **Diagramme en aire** pour les flux financiers
3. **Diagramme en barres groupées** pour comparer les années

### Personnalisation des couleurs:

Modifier les tableaux `backgroundColor` dans chaque composant pour correspondre à votre charte graphique.

### Animations et interactions:

Les options `animation` et `interaction` sont déjà configurées pour une expérience utilisateur optimale.

## Support

En cas de problème, vérifier:
- Les imports sont corrects
- Les dépendances sont installées
- Les données sont bien formatées
- Le serveur backend renvoie les bonnes réponses
