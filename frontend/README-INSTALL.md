# Installation Frontend - Guide de dépannage

## Problème courant
Erreur Vite : `Failed to resolve import "bootstrap-icons/font/bootstrap-icons.css"`

## Solution rapide

### Étape 1 : Vérifier les dépendances
Ouvrir un terminal dans le dossier frontend et vérifier :
```bash
npm list bootstrap-icons
```

### Étape 2 : Réinstaller si nécessaire
```bash
npm install bootstrap-icons@1.13.1
```

### Étape 3 : Vider le cache Vite
```bash
# Supprimer le dossier node_modules/.vite
rmdir /s node_modules\.vite
```

### Étape 4 : Redémarrer le serveur
```bash
npm run dev
```

## Configuration actuelle
Le fichier `main.jsx` utilise maintenant :
```javascript
import "bootstrap-icons/font/bootstrap-icons.min.css";
```

## Alternative : Utiliser le CDN
Si l'import local ne fonctionne pas, le CDN est déjà configuré dans `index.html` :
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
```

## Structure requise
```
frontend/
├── node_modules/
│   └── bootstrap-icons/
│       └── font/
│           ├── bootstrap-icons.css     ✅
│           └── bootstrap-icons.min.css ✅
├── src/
│   └── main.jsx                   ✅ (import configuré)
└── public/
    └── index.html                  ✅ (CDN configuré)
```

## Si le problème persiste
1. Supprimer complètement node_modules
2. Supprimer package-lock.json
3. npm install
4. npm run dev
