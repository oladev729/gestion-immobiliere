#!/bin/bash

# Nettoyage Git - Supprimer les fichiers indésirables du cache
echo "🧹 Nettoyage Git en cours..."

# Supprimer les uploads du cache
git rm -r --cached backend/uploads/ 2>/dev/null || echo "✅ backend/uploads déjà ignoré"

# Supprimer les fichiers PDF du cache
git rm --cached backend/*.pdf 2>/dev/null || echo "✅ PDF déjà ignorés"

# Supprimer les fichiers test du cache
git rm --cached backend/test_*.js 2>/dev/null || echo "✅ Tests backend déjà ignorés"
git rm --cached frontend/test_*.js 2>/dev/null || echo "✅ Tests frontend déjà ignorés"

# Supprimer les fichiers debug du cache
git rm --cached backend/debug_*.js 2>/dev/null || echo "✅ Debug backend déjà ignorés"

# Supprimer les fichiers backup du cache
git rm --cached frontend/src/pages/*backup* 2>/dev/null || echo "✅ Backup pages déjà ignorés"
git rm --cached backend/src/controllers/*backup* 2>/dev/null || echo "✅ Backup controllers déjà ignorés"
git rm --cached frontend/src/App.jsx.backup 2>/dev/null || echo "✅ Backup App déjà ignorés"

echo "✅ Nettoyage Git terminé!"
echo "📋 Fichiers ignorés par .gitignore :"
echo "   - backend/uploads/"
echo "   - test_*.js"
echo "   - debug_*.js"
echo "   - *.pdf"
echo "   - *backup*"
echo "   - *.old"
echo "   - *.bak"
echo ""
echo "🚀 Vous pouvez maintenant faire :"
echo "   git add .gitignore"
echo "   git commit -m 'Nettoyage fichiers indésirables et mise à jour .gitignore'"
