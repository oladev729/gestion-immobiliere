const Notification = require('../models/Notification');

const notificationController = {
    // ============================================================
    // VOIR MES NOTIFICATIONS
    // ============================================================
    async getMyNotifications(req, res) {
        try {
            const notifications = await Notification.findByUser(req.user.id);
            res.json(notifications);
        } catch (error) {
            console.error('Erreur récupération notifications:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR MES NOTIFICATIONS NON LUES
    // ============================================================
    async getNonLues(req, res) {
        try {
            const notifications = await Notification.findNonLues(req.user.id);
            res.json(notifications);
        } catch (error) {
            console.error('Erreur récupération notifications non lues:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // COMPTER MES NOTIFICATIONS NON LUES
    // ============================================================
    async countNonLues(req, res) {
        try {
            const count = await Notification.countNonLues(req.user.id);
            res.json({ total_non_lues: count });
        } catch (error) {
            console.error('Erreur comptage notifications:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // MARQUER UNE NOTIFICATION COMME LUE
    // ============================================================
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const notification = await Notification.markAsRead(id);
            
            if (!notification) {
                return res.status(404).json({ message: 'Notification non trouvée' });
            }
            
            res.json({
                message: 'Notification marquée comme lue',
                notification
            });
        } catch (error) {
            console.error('Erreur marquage notification:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // MARQUER TOUTES MES NOTIFICATIONS COMME LUES
    // ============================================================
    async markAllAsRead(req, res) {
        try {
            const notifications = await Notification.markAllAsRead(req.user.id);
            res.json({
                message: `${notifications.length} notification(s) marquée(s) comme lue(s)`,
                notifications
            });
        } catch (error) {
            console.error('Erreur marquage toutes notifications:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // SUPPRIMER UNE NOTIFICATION
    // ============================================================
    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await Notification.delete(id);
            
            if (!result) {
                return res.status(404).json({ message: 'Notification non trouvée' });
            }
            
            res.json({ message: 'Notification supprimée avec succès' });
        } catch (error) {
            console.error('Erreur suppression notification:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = notificationController;