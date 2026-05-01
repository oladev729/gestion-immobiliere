import api from '../api/axios';

/**
 * Retourne l'URL complète d'une image en gérant les préfixes manquants
 * et en proposant une image de secours.
 */
export const getImageUrl = (path) => {
    // Si pas de chemin, retourner une image de secours
    if (!path) {
        return "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80";
    }

    // Si c'est déjà une URL absolue
    if (path.startsWith('http')) {
        return path;
    }

    // Récupérer la base URL (ex: http://localhost:5055)
    const base = api.defaults.baseURL.replace('/api', '');

    // Nettoyer le chemin pour s'assurer qu'il commence par /api/uploads
    let cleanPath = path;
    if (!path.startsWith('/api')) {
        cleanPath = `/api${path.startsWith('/') ? '' : '/'}${path}`;
    }

    return `${base}${cleanPath}`;
};

export const IMAGE_FALLBACK = "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80";
