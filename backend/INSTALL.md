# Installation des dépendances

## Étape 1 : Installer les dépendances
Ouvrir un terminal dans le dossier backend et exécuter :

```bash
npm install
```

## Étape 2 : Vérifier l'installation
Après l'installation, vérifiez que le dossier `node_modules` contient bien :
- pdfkit
- express
- pg
- cors
- etc.

## Étape 3 : Démarrer le serveur
```bash
npm run dev
```

## Si problème persiste
1. Supprimer le dossier `node_modules`
2. Supprimer le fichier `package-lock.json`
3. Relancer `npm install`

## Dépendances requises
- axios: ^1.14.0
- bcryptjs: ^2.4.3
- cors: ^2.8.5
- dotenv: ^16.3.1
- express: ^4.18.2
- express-validator: ^7.0.1
- jsonwebtoken: ^9.0.2
- multer: ^1.4.5-lts.1
- nodemailer: ^8.0.4
- **pdfkit: ^0.15.0** (ajouté)
- pg: ^8.11.3
