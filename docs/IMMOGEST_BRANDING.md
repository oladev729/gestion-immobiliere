# Branding ImmoGest - Couleur Bleue Universelle

## 🎯 Objectif

Garantir que la marque "ImmoGest" conserve sa couleur bleue distinctive `#0d6efd` partout dans l'application, quel que soit le contexte.

## 🎨 Couleur Officielle

- **Couleur principale** : `#0d6efd` (Bleu Bootstrap Primary)
- **Couleur thème sombre** : `#4dabf7` (Bleu plus clair pour contraste)
- **Font-weight** : 600 (semi-bold)

## 🛠️ Implémentation

### 1. CSS Classes

#### Classe principale
```css
.logo-immogest {
  font-weight: 700;
  font-size: 1.8rem;
  color: #0d6efd;
  text-shadow: 0 2px 3px rgba(0, 0, 0, 0.35), 0 -1px 0 rgba(255, 255, 255, 0.7);
}
```

#### Classes utilitaires
```css
.immogest-blue-applied,
.immogest-text,
.immogest-brand,
.immogest-title,
.immogest-name,
.immogest-blue {
  color: #0d6efd !important;
  font-weight: 600;
}
```

### 2. JavaScript Automatique

Le fichier `src/utils/immogestBranding.js` scanne automatiquement :

- **Tous les éléments** contenant le texte "ImmoGest"
- **Applique la couleur bleue** automatiquement
- **Observe les changements** DOM pour les applications SPA
- **Traite les nœuds de texte** pour un remplacement précis

### 3. Points d'application

#### Pages modifiées
- ✅ **Login.jsx** : `main-logo-text` → `logo-immogest`
- ✅ **SidebarModern.jsx** : `logo-title` → `logo-immogest`
- ✅ **HomePage.jsx** : Span avec style inline pour "ImmoGest"
- ✅ **App.jsx** : Intégration du script de branding

#### Pages déjà correctes
- ✅ **Register.jsx** : Utilise déjà `logo-immogest`
- ✅ **RegisterStepRole.jsx** : Utilise déjà `logo-immogest`

## 🔄 Fonctionnement

### Au démarrage de l'application
```javascript
// App.jsx
useEffect(() => {
    applyImmoGestBranding();
    setTimeout(() => applyImmoGestBranding(), 500);
}, []);
```

### À chaque changement de page
```javascript
// Layout component
useEffect(() => {
    applyImmoGestBranding();
}, [children]);
```

### Surveillance continue
```javascript
// MutationObserver pour les changements DOM
const observer = new MutationObserver((mutations) => {
    // Détecte les nouveaux éléments contenant "ImmoGest"
    // Applique automatiquement le branding
});
```

## 🎯 Résultat

### Garantie de couleur bleue
1. **CSS Classes** : Pour les éléments connus
2. **JavaScript** : Pour les éléments dynamiques et texte
3. **Observateur** : Pour les changements en temps réel
4. **Fallback** : Classes utilitaires manuelles

### Exemples de transformation

#### Avant
```html
<h1 class="main-logo-text">ImmoGest</h1>
<h1 class="logo-title">ImmoGest</h1>
<p>Rejoignez des milliers de locataires et propriétaires sur ImmoGest.</p>
```

#### Après
```html
<h1 class="logo-immogest">ImmoGest</h1>  <!-- CSS -->
<h1 class="logo-immogest">ImmoGest</h1>  <!-- CSS -->
<p>Rejoignez des milliers de locataires et propriétaires sur <span style="color: #0d6efd; font-weight: 600;">ImmoGest</span>.</p>  <!-- JavaScript -->
```

## 🔧 Maintenance

### Ajouter de nouveaux éléments
1. **Utilisez les classes existantes** : `logo-immogest`, `immogest-text`, etc.
2. **Ou laissez le JavaScript** les détecter automatiquement
3. **Pour les cas spécifiques** : ajoutez la classe `immogest-blue`

### Débogage
```javascript
// Dans la console du navigateur
window.applyImmoGestBranding(); // Appliquer manuellement
```

### Vérification
```javascript
// Vérifier les éléments avec branding
document.querySelectorAll('.immogest-blue-applied').length;
```

## 📋 Liste des fichiers modifiés

1. **src/App.css** : Classes CSS de branding
2. **src/utils/immogestBranding.js** : Script automatique
3. **src/App.jsx** : Intégration du script
4. **src/pages/Login.jsx** : Classe mise à jour
5. **src/components/SidebarModern.jsx** : Classe mise à jour
6. **src/pages/HomePage.jsx** : Style inline ajouté

## 🎉 Avantages

- ✅ **Automatique** : Pas besoin de penser à la couleur
- ✅ **Universel** : Fonctionne partout dans l'app
- ✅ **Dynamique** : S'adapte aux changements SPA
- ✅ **Maintenable** : Centralisé dans un utilitaire
- ✅ **Robuste** : Multiple couches de protection

**La marque ImmoGest est maintenant bleue partout, automatiquement !** 🎨✨
