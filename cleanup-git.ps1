# Nettoyage Git - Supprimer les fichiers indésirables du cache
Write-Host "🧹 Nettoyage Git en cours..." -ForegroundColor Green

# Supprimer les uploads du cache
git rm -r --cached backend/uploads/ 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "✅ backend/uploads supprimé du cache" -ForegroundColor Green } else { Write-Host "✅ backend/uploads déjà ignoré" -ForegroundColor Yellow }

# Supprimer les fichiers PDF du cache
git rm --cached backend/*.pdf 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "✅ PDF supprimés du cache" -ForegroundColor Green } else { Write-Host "✅ PDF déjà ignorés" -ForegroundColor Yellow }

# Supprimer les fichiers test du cache
git rm --cached backend/test_*.js 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Tests backend supprimés du cache" -ForegroundColor Green } else { Write-Host "✅ Tests backend déjà ignorés" -ForegroundColor Yellow }

git rm --cached frontend/test_*.js 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Tests frontend supprimés du cache" -ForegroundColor Green } else { Write-Host "✅ Tests frontend déjà ignorés" -ForegroundColor Yellow }

# Supprimer les fichiers debug du cache
git rm --cached backend/debug_*.js 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Debug backend supprimés du cache" -ForegroundColor Green } else { Write-Host "✅ Debug backend déjà ignoré" -ForegroundColor Yellow }

# Supprimer les fichiers backup du cache
git rm --cached frontend/src/pages/*backup* 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Backup pages supprimés du cache" -ForegroundColor Green } else { Write-Host "✅ Backup pages déjà ignorés" -ForegroundColor Yellow }

git rm --cached backend/src/controllers/*backup* 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Backup controllers supprimés du cache" -ForegroundColor Green } else { Write-Host "✅ Backup controllers déjà ignorés" -ForegroundColor Yellow }

git rm --cached frontend/src/App.jsx.backup 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Backup App supprimé du cache" -ForegroundColor Green } else { Write-Host "✅ Backup App déjà ignoré" -ForegroundColor Yellow }

Write-Host "✅ Nettoyage Git terminé!" -ForegroundColor Green
Write-Host "📋 Fichiers ignorés par .gitignore :" -ForegroundColor Cyan
Write-Host "   - backend/uploads/" -ForegroundColor White
Write-Host "   - test_*.js" -ForegroundColor White
Write-Host "   - debug_*.js" -ForegroundColor White
Write-Host "   - *.pdf" -ForegroundColor White
Write-Host "   - *backup*" -ForegroundColor White
Write-Host "   - *.old" -ForegroundColor White
Write-Host "   - *.bak" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Vous pouvez maintenant faire :" -ForegroundColor Yellow
Write-Host "   git add .gitignore" -ForegroundColor White
Write-Host "   git commit -m 'Nettoyage fichiers indésirables et mise à jour .gitignore'" -ForegroundColor White
