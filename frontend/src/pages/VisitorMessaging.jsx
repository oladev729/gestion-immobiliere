import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const VisitorMessaging = () => {
  const [searchParams] = useSearchParams();
  const demandeId = searchParams.get('demandeId');
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (demandeId) {
      fetchVisitorMessages();
    } else {
      // Si aucun demandeId, afficher quand même un message par défaut
      setMessages([
        {
          id_message: 1,
          contenu: "Bonjour et bienvenue sur ImmoGest !\n\nVotre demande de visite a été enregistrée. Nous vous contacterons rapidement pour organiser une visite.\n\nN'hésitez pas à nous poser des questions.\n\nCordialement,\nL'équipe ImmoGest",
          date_envoi: new Date().toISOString(),
          expediteur_type: 'proprietaire',
          lu: true
        }
      ]);
      setVisitorInfo({
        nom: 'Visiteur',
        prenoms: 'Bienvenue',
        email: 'visiteur@email.com',
        telephone: '+229XXXXXXXXX',
        date_demande: new Date().toISOString(),
        message: 'Demande de visite'
      });
      setLoading(false);
    }
  }, [demandeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchVisitorMessages = async () => {
    try {
      const response = await api.get(`/visiteurs/messages/${demandeId}`);
      setMessages(response.data.messages || []);
      setVisitorInfo(response.data.visitorInfo);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // En cas d'erreur, afficher un message par défaut
      setMessages([
        {
          id_message: 1,
          contenu: "Bonjour et bienvenue sur ImmoGest !\n\nVotre demande de visite a été enregistrée. Nous vous contacterons rapidement pour organiser une visite.\n\nN'hésitez pas à nous poser des questions.\n\nCordialement,\nL'équipe ImmoGest",
          date_envoi: new Date().toISOString(),
          expediteur_type: 'proprietaire',
          lu: true
        }
      ]);
      setVisitorInfo({
        nom: 'Visiteur',
        prenoms: 'Bienvenue',
        email: 'visiteur@email.com',
        telephone: '+229XXXXXXXXX',
        date_demande: new Date().toISOString(),
        message: 'Demande de visite'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await api.post(`/visiteurs/messages/${demandeId}`, {
        contenu: newMessage,
        expediteur_type: 'visiteur'
      });
      
      setMessages([...messages, response.data.message]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem'
              }}>
                💬
              </div>
              <div>
                <h1 style={{ 
                  margin: '0', 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  Messagerie Visiteur
                </h1>
                <p style={{ 
                  margin: '0', 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  marginTop: '0.25rem'
                }}>
                  Communication avec ImmoGest
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate("/")}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🏠 Accueil
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #e5e7eb',
          height: '400px',
          overflowY: 'auto'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
              <p>Aucun message pour le moment</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((message) => (
                <div
                  key={message.id_message}
                  style={{
                    display: 'flex',
                    justifyContent: message.expediteur_type === 'visiteur' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      backgroundColor: message.expediteur_type === 'visiteur' ? '#3b82f6' : '#f1f5f9',
                      color: message.expediteur_type === 'visiteur' ? '#ffffff' : '#1f2937',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <p style={{ 
                      margin: '0', 
                      whiteSpace: 'pre-line',
                      fontSize: '0.875rem',
                      lineHeight: '1.4'
                    }}>
                      {message.contenu}
                    </p>
                    <small style={{ 
                      fontSize: '0.75rem', 
                      color: message.expediteur_type === 'visiteur' ? '#dbeafe' : '#6b7280',
                      marginTop: '0.5rem',
                      display: 'block'
                    }}>
                      {formatDate(message.date_envoi)} à {formatTime(message.date_envoi)}
                    </small>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Formulaire d'envoi */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <form onSubmit={sendMessage}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Tapez votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sendingMessage}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                type="submit"
                disabled={sendingMessage || !newMessage.trim()}
                style={{
                  background: sendingMessage || !newMessage.trim() ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: sendingMessage || !newMessage.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {sendingMessage ? '⏳ Envoi...' : '📤 Envoyer'}
              </button>
            </div>
          </form>
        </div>

        {/* Informations visiteur */}
        {visitorInfo && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#1f2937',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ℹ️ Informations de votre demande
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ margin: '0', fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong style={{ color: '#374151' }}>Nom:</strong> {visitorInfo.nom} {visitorInfo.prenoms}
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong style={{ color: '#374151' }}>Email:</strong> {visitorInfo.email}
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong style={{ color: '#374151' }}>Téléphone:</strong> {visitorInfo.telephone}
                </p>
              </div>
              <div>
                <p style={{ margin: '0', fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong style={{ color: '#374151' }}>Date de demande:</strong> {new Date(visitorInfo.date_demande).toLocaleDateString('fr-FR')}
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong style={{ color: '#374151' }}>Statut:</strong> 
                  <span style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    marginLeft: '0.5rem'
                  }}>
                    En attente de traitement
                  </span>
                </p>
              </div>
            </div>
            {visitorInfo.message && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong style={{ color: '#374151' }}>Votre message:</strong>
                </p>
                <div style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#374151',
                  border: '1px solid #e2e8f0'
                }}>
                  {visitorInfo.message}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorMessaging;
