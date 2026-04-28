import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const TenantMessaging = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const demandeIdFromUrl = queryParams.get('demandeId');
  const proprietaireIdFromUrl = queryParams.get('proprietaireId');
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchTenantConversations();
    }
  }, [user]);

  useEffect(() => {
    // Si on arrive avec des paramètres pour créer une nouvelle conversation
    if (proprietaireIdFromUrl && user) {
      createOrSelectConversation();
    }
  }, [proprietaireIdFromUrl, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createOrSelectConversation = async () => {
    try {
      // Vérifier si une conversation existe déjà avec ce propriétaire
      const existingConv = conversations.find(conv => conv.id_proprietaire == proprietaireIdFromUrl);
      
      if (existingConv) {
        selectConversation(existingConv);
      } else {
        // Créer une nouvelle conversation
        const response = await api.post('/locataires/conversations/create', {
          id_proprietaire: proprietaireIdFromUrl,
          id_bien: queryParams.get('bienId')
        });
        
        const newConv = response.data;
        setConversations([...conversations, newConv]);
        selectConversation(newConv);
      }
    } catch (error) {
      console.error('Erreur création conversation:', error);
    }
  };

  const fetchTenantConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/locataires/conversations');
      setConversations(response.data);
      
      // Si un demandeId est spécifié, on sélectionne la conv correspondante
      if (demandeIdFromUrl) {
          const conv = response.data.find(c => c.id_demande == demandeIdFromUrl);
          if (conv) {
              selectConversation(conv);
          }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur récupération conversations locataire:', error);
      setLoading(false);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    try {
      const response = await api.get(`/locataires/messages/${conversation.id_conversation}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Erreur récupération messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const payload = {
        contenu: newMessage,
        id_conversation: selectedConversation.id_conversation,
        id_destinataire: selectedConversation.id_proprietaire
      };
      
      const response = await api.post('/locataires/messages/send', payload);
      setMessages([...messages, response.data]);
      setNewMessage('');
      
      // Mettre à jour la dernière conversation
      const updatedConversations = conversations.map(conv => 
        conv.id_conversation === selectedConversation.id_conversation 
          ? { ...conv, dernier_message: newMessage, date_dernier_message: new Date() }
          : conv
      );
      setConversations(updatedConversations);
      
    } catch (error) {
      console.error('Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier";
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="bg-white border-bottom p-3">
        <h5 className="mb-0 fw-bold">Messagerie</h5>
        <small className="text-muted">Discutez avec les propriétaires</small>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Liste des conversations */}
        <div style={{ width: '350px', borderRight: '1px solid #e9ecef', overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div className="text-center p-4">
              <i className="bi bi-chat-dots fa-2x text-muted mb-3"></i>
              <p className="text-muted">Aucune conversation</p>
              <small className="text-muted">Commencez par visiter des biens et contacter des propriétaires</small>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id_conversation}
                className={`p-3 border-bottom cursor-pointer ${selectedConversation?.id_conversation === conv.id_conversation ? 'bg-light' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => selectConversation(conv)}
              >
                <div className="d-flex align-items-start">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                    {conv.proprietaire_prenoms?.[0] || 'P'}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-0 fw-bold">{conv.proprietaire_prenoms} {conv.proprietaire_nom}</h6>
                        <small className="text-muted">{conv.bien_titre}</small>
                      </div>
                      <small className="text-muted">{formatTime(conv.date_dernier_message)}</small>
                    </div>
                    <p className="mb-0 text-muted small truncate">{conv.dernier_message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Zone de conversation */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              {/* Header conversation */}
              <div className="bg-white border-bottom p-3">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: '35px', height: '35px' }}>
                    {selectedConversation.proprietaire_prenoms?.[0] || 'P'}
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">{selectedConversation.proprietaire_prenoms} {selectedConversation.proprietaire_nom}</h6>
                    <small className="text-muted">{selectedConversation.bien_titre}</small>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {messages.map((message, index) => (
                  <div key={index} className="mb-3">
                    {message.id_envoyeur === user.id ? (
                      <div className="d-flex justify-content-end">
                        <div className="bg-primary text-white rounded-3 px-3 py-2" style={{ maxWidth: '70%' }}>
                          <p className="mb-0 small">{message.contenu}</p>
                          <small className="text-white-50">{formatTime(message.date_envoi)}</small>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex justify-content-start">
                        <div className="bg-light rounded-3 px-3 py-2" style={{ maxWidth: '70%' }}>
                          <p className="mb-0 small">{message.contenu}</p>
                          <small className="text-muted">{formatTime(message.date_envoi)}</small>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulaire d'envoi */}
              <div className="bg-white border-top p-3">
                <form onSubmit={sendMessage} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sendingMessage || !newMessage.trim()}
                  >
                    {sendingMessage ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <i className="bi bi-send"></i>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <i className="bi bi-chat-left-text fa-3x text-muted mb-3"></i>
                <p className="text-muted">Sélectionnez une conversation pour commencer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantMessaging;
