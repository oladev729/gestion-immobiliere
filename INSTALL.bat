@echo off
echo ========================================
echo   INSTALLATION AUTOMATIQUE - GESTION IMMOBILIERE
echo ========================================
echo.

echo [1/6] Verification des prerequis...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installe. Veuillez installer Node.js 18+ depuis https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js est installe

psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL n'est pas installe. Veuillez installer PostgreSQL depuis https://postgresql.org
    pause
    exit /b 1
)
echo ✅ PostgreSQL est installe

echo.
echo [2/6] Installation des dependances backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dependances backend
    pause
    exit /b 1
)
echo ✅ Dependances backend installees

echo.
echo [3/6] Installation des dependances frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dependances frontend
    pause
    exit /b 1
)
echo ✅ Dependances frontend installees

echo.
echo [4/6] Configuration de la base de donnees...
echo.
echo ⚠️  IMPORTANT : Configurez manuellement le fichier backend/.env :
echo    - DB_HOST=localhost
echo    - DB_PORT=5432  
echo    - DB_NAME=gestion_immobiliere
echo    - DB_USER=votre_utilisateur_postgresql
echo    - DB_PASSWORD=votre_mot_de_passe_postgresql
echo    - JWT_SECRET=votre_secret_jwt
echo.
echo ⚠️  Creer la base de donnees 'gestion_immobiliere' dans PostgreSQL
echo.
pause

echo.
echo [5/6] Initialisation des tables de la base de donnees...
cd ..\backend
node setup_all_tables.js
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'initialisation des tables
    echo Verifiez la configuration de votre base de donnees dans .env
    pause
    exit /b 1
)
echo ✅ Tables initialisees avec succes

echo.
echo [6/6] Demarrage de l'application...
echo.
echo 🚀 Lancement du backend...
start "Backend" cmd /k "npm start"

timeout /t 3 /nobreak >nul

echo 🚀 Lancement du frontend...
start "Frontend" cmd /k "cd ..\frontend && npm run dev"

echo.
echo ========================================
echo   INSTALLATION TERMINEE !
echo ========================================
echo.
echo 📱 Frontend : http://localhost:5173
echo 🔧 Backend  : http://localhost:5055
echo.
echo 👤 Compte proprietaire : yessoufouzenabou46@gmail.com / 123456
echo 👤 Compte locataire    : agossouroland@gmail.com / agossou12
echo.
echo L'application va demarrer dans quelques secondes...
echo.
pause
