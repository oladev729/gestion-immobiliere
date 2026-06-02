const fs = require('fs');
const path = 'c:/Users/GILBERT KEKO/gestion-immobiliere/frontend/src/pages/tenant/AvailableProperties.jsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Find the line with <i className="bi bi-door-open"
let startIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('bi bi-door-open') && lines[i].includes('bien.nombre_pieces')) {
        startIndex = i;
        break;
    }
}

// Find the line with 'navigate(\'/register-step-role\','
let endIndex = -1;
for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].includes("navigate('/register-step-role',")) {
        endIndex = i;
        break;
    }
}

if (startIndex !== -1 && endIndex !== -1) {
    let resumeIndex = endIndex - 2; 
    
    const blockToInsert = [
        '                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>',
        '                                        <i className="bi bi-arrows-fullscreen" style={{ color: "#000000" }}></i> {bien.superficie} m²',
        '                                    </span>',
        '                                    {bien.meuble && (',
        '                                        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#047857" }}>',
        '                                            <i className="bi bi-check-circle-fill"></i> Meublé',
        '                                        </span>',
        '                                    )}',
        '                                </div>',
        '',
        '                                {/* BUTTON ACTIONS */}',
        '                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>',
        '                                    {/* 1. VOIR DETAILS BUTTON */}',
        '                                    <button',
        '                                        style={{',
        '                                            width: "100%",',
        '                                            padding: "8px 12px",',
        '                                            borderRadius: "6px",',
        '                                            border: "none",',
        '                                            backgroundColor: "#2563eb",',
        '                                            color: "#ffffff",',
        '                                            cursor: "pointer",',
        '                                            fontSize: "0.8rem",',
        '                                            fontWeight: "700",',
        '                                            display: "flex",',
        '                                            alignItems: "center",',
        '                                            justifyContent: "center",',
        '                                            gap: "6px",',
        '                                            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",',
        '                                            transition: "all 0.2s"',
        '                                        }}',
        '                                        onClick={() => handleVoirPlus(bien.id_bien)}>',
        '                                        <i className="bi bi-eye"></i> Voir les détails',
        '                                    </button>',
        '',
        '                                    {/* 2. ROW ACTIONS */}',
        '                                    <div style={{ display: "flex", gap: "8px", width: "100%" }}>',
        '                                        <button',
        '                                            style={{',
        '                                                flex: 1,',
        '                                                padding: "8px",',
        '                                                borderRadius: "6px",',
        '                                                border: "none",',
        '                                                backgroundColor: "#2563eb",',
        '                                                color: "#ffffff",',
        '                                                cursor: "pointer",',
        '                                                fontSize: "0.75rem",',
        '                                                fontWeight: "700",',
        '                                                display: "flex",',
        '                                                alignItems: "center",',
        '                                                justifyContent: "center",',
        '                                                gap: "4px",',
        '                                                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",',
        '                                                transition: "all 0.2s"',
        '                                            }}'
    ];
    
    let newLines = [
        ...lines.slice(0, startIndex + 2),
        ...blockToInsert,
        ...lines.slice(resumeIndex)
    ];
    
    fs.writeFileSync(path, newLines.join('\n'), 'utf8');
    console.log('Successfully repaired AvailableProperties.jsx! New length: ' + newLines.length);
} else {
    console.log('Could not find indices: startIndex=' + startIndex + ' endIndex=' + endIndex);
}
