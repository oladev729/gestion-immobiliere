import React, { useEffect } from 'react';

/**
 * Composant simple pour garantir la couleur bleue ImmoGest partout
 */
const ImmoGestBrand = () => {
    useEffect(() => {
        // Ajouter la classe au body pour activer les styles ImmoGest
        document.body.classList.add('immogest-active');
        
        // Fonction pour appliquer la couleur bleue aux éléments contenant "ImmoGest"
        const applyImmoGestColor = () => {
            const elements = document.querySelectorAll('*');
            elements.forEach(element => {
                if (element.textContent && element.textContent.includes('ImmoGest')) {
                    if (!element.classList.contains('logo-immogest')) {
                        element.style.color = '#0d6efd';
                        element.style.fontWeight = '600';
                    }
                }
            });
        };

        // Appliquer immédiatement
        applyImmoGestColor();
        
        // Observer les changements
        const observer = new MutationObserver(() => {
            applyImmoGestColor();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            document.body.classList.remove('immogest-active');
            observer.disconnect();
        };
    }, []);

    return null;
};

export default ImmoGestBrand;
