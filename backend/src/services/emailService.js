const nodemailer = require('nodemailer');

class EmailService {
  static async sendEmail(to, subject, html) {
    try {
      // Configuration du transporteur (utiliser un service d'email réel en production)
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'gestion.immobilier@example.com',
          pass: process.env.EMAIL_PASS || 'password'
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER || 'gestion.immobilier@example.com',
        to: to,
        subject: subject,
        html: html
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email envoyé: ' + info.messageId);
      return info;

    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      // En développement, on ne bloque pas si l'email échoue
      if (process.env.NODE_ENV === 'development') {
        console.log('Email non envoyé en mode développement');
        return { messageId: 'dev-mode' };
      }
      throw error;
    }
  }
}

module.exports = EmailService;
