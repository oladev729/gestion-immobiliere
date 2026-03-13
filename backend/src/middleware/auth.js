const jwt = require('jsonwebtoken');

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ 
            message: 'Token non fourni. Veuillez vous authentifier.' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                message: 'Token invalide ou expiré.' 
            });
        }
        req.user = user; // Attache l'utilisateur à la requête
        next();
    });
};

// Middleware pour autoriser certains types d'utilisateurs
const authorize = (...types) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Authentification requise.' 
            });
        }

        if (!types.includes(req.user.type)) {
            return res.status(403).json({ 
                message: `Accès non autorisé. Rôle requis : ${types.join(' ou ')}` 
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorize
};