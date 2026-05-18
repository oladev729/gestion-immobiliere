const fs = require('fs');
const src = fs.readFileSync('c:/Users/GILBERT KEKO/gestion-immobiliere/frontend/src/pages/tenant/AvailableProperties.jsx', 'utf8');
try {
    require('@babel/parser').parse(src, { sourceType: 'module', plugins: ['jsx'] });
    console.log('✅ PARSE OK - No JSX errors!');
} catch (e) {
    console.log('❌ ERROR:', e.message);
}
