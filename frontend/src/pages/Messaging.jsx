import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Messaging = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const demandeIdFromUrl = queryParams.get('demandeId');
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else if (demandeIdFromUrl) {
      // Mode visiteur
      fetchVisitorContext();
    } else {
      setLoading(false);
    }
  }, [user, demandeIdFromUrl]);

  const fetchVisitorContext = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/visiteurs/messages/${demandeIdFromUrl}`);
      setVisitorInfo(response.data.visitorInfo);
      setMessages(response.data.messages);
      setSelectedConversation({
        isVisitorMode: true,
        autre_nom: response.data.visitorInfo?.proprietaire_nom || 'Propriétaire',
        autre_prenoms: response.data.visitorInfo?.proprietaire_prenoms || '',
        autre_email: response.data.visitorInfo?.proprietaire_email,
        id_bien: response.data.visitorInfo?.id_bien
      });
      setLoading(false);
    } catch (error) {
      console.error('Erreur récupération contexte visiteur:', error);
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
      
      // Si un demandeId est spécifié pour un proprio, on sélectionne la conv correspondante
      if (demandeIdFromUrl) {
          const conv = response.data.find(c => c.id_demande == demandeIdFromUrl);
          if (conv) {
              selectConversation(conv);
          } else {
              // Nouveau visiteur sans conversation préalable
              fetchNewVisitorConversation(demandeIdFromUrl);
          }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur récupération conversations:', error);
      setLoading(false);
    }
  };

  const fetchNewVisitorConversation = async (demandeId) => {
    try {
      setLoading(true);
      const response = await api.get(`/visiteurs/messages/${demandeId}`);
      const visitor = response.data.visitorInfo;
      setMessages(response.data.messages || []);
      setSelectedConversation({
        id_demande: demandeId,
        id_bien: visitor.id_bien,
        autre_nom: visitor.nom,
        autre_prenoms: visitor.prenoms,
        autre_email: visitor.email,
        bien_titre: visitor.bien_titre
      });
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement nouveau visiteur:', error);
      setLoading(false);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    // Déterminer l'ID de l'autre utilisateur ou l'ID de demande
    if (conversation.id_demande) {
        fetchMessages(null, conversation.id_demande);
    } else {
        const otherUserId = conversation.autre_email ? conversation.autre_email : conversation.autre_id;
        fetchMessages(otherUserId);
    }
  };

  const fetchMessages = async (userId, idDemande = null) => {
    try {
      const url = idDemande 
        ? `/messages/conversation/visitor?id_demande=${idDemande}`
        : `/messages/conversation/${userId}`;
      const response = await api.get(url);
      setMessages(response.data);
    } catch (error) {
      console.error('Erreur récupération messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const payload = {
        contenu: newMessage,
        id_bien: selectedConversation.id_bien,
        id_demande: demandeIdFromUrl || selectedConversation.id_demande,
        destinataire_type: user ? (selectedConversation.id_demande ? 'visiteur' : 'utilisateur') : 'utilisateur'
      };

      if (user) {
          payload.id_destinataire = selectedConversation.autre_id || selectedConversation.id_expediteur || selectedConversation.id_destinataire;
          // Si c'est un visiteur, l'id_destinataire n'est pas utilisé tel quel sur le backend mais on le passe par sécurité
      } else {
          // Visiteur vers Propriétaire
          payload.id_expediteur = demandeIdFromUrl; // Utilisé comme id_demande sur le backend
      }

      await api.post('/messages/send', payload);
      
      setNewMessage('');
      if (user) {
        if (selectedConversation.id_demande) {
          fetchMessages(null, selectedConversation.id_demande);
        } else {
          const otherId = selectedConversation.autre_id || selectedConversation.id_expediteur || selectedConversation.id_destinataire;
          fetchMessages(otherId);
        }
        fetchConversations();
      } else {
        fetchVisitorContext();
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
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
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 container">
      <>
      {!user && !demandeIdFromUrl && (
          <div className="alert alert-info shadow-sm border-0 rounded-4 p-4 text-center">
              <h4 className="fw-bold">Accès restreint</h4>
              <p className="mb-0">Veuillez vous connecter pour accéder à votre messagerie ou utiliser le lien fourni après votre demande de visite.</p>
              <button onClick={() => navigate('/login')} className="btn btn-primary mt-3 px-4 rounded-3 fw-bold">Se connecter</button>
          </div>
      )}

      {(user || demandeIdFromUrl) && (
      <div className="row justify-content-center g-4">
        {/* Liste des conversations (masquée pour les visiteurs) */}
        {user && (
        <div className="col-lg-4 col-md-5">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-chat-dots me-2"></i>
                Messages
              </h5>
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div className="text-center py-4" style={{ color: '#000000' }}>
                  <i className="bi bi-chat-square-dots display-4" style={{ color: '#6c757d' }}></i>
                  <p className="mt-2" style={{ color: '#000000', fontWeight: '500' }}>Aucune conversation</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id || conversation.autre_id}
                    className={`list-group-item list-group-item-action cursor-pointer ${
                      selectedConversation?.autre_id == conversation.autre_id ? 'active' : ''
                    }`}
                    onClick={() => selectConversation(conversation)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1 me-2">
                        <h6 className="mb-1 text-truncate">
                          {conversation.autre_prenoms} {conversation.autre_nom}
                        </h6>
                        <small className="text-muted d-block text-truncate">
                          {conversation.autre_email}
                        </small>
                        {conversation.bien_titre && (
                          <small className="text-muted d-block">
                            <i className="bi bi-house-door me-1"></i>
                            {conversation.bien_titre}
                          </small>
                        )}
                      </div>
                      <div className="text-end flex-shrink-0">
                        <small className="text-muted d-block">
                          {formatDate(conversation.date_envoi)}
                        </small>
                        <small className="text-muted">
                          {formatTime(conversation.date_envoi)}
                        </small>
                        {conversation.non_lus > 0 && (
                          <span className="badge bg-danger ms-2">{conversation.non_lus}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        )}

        {/* Conversation sélectionnée */}
        <div className={`${user ? 'col-lg-8 col-md-7' : 'col-lg-10'}`}>
          {selectedConversation ? (
            <div className="card h-100">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1 me-2">
                    <h6 className="mb-0 text-truncate">
                      <i className="bi bi-person-circle me-2"></i>
                      {selectedConversation.autre_prenoms} {selectedConversation.autre_nom}
                    </h6>
                    <small className="text-muted text-truncate">{selectedConversation.autre_email}</small>
                    {selectedConversation.bien_titre && (
                      <small className="text-muted d-block">
                        <i className="bi bi-house-door me-1"></i>
                        {selectedConversation.bien_titre}
                      </small>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="card-body" style={{ height: '400px', overflowY: 'auto' }}>
                {messages.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-chat-square display-4"></i>
                    <p className="mt-2">Aucun message dans cette conversation</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`d-flex ${
                          message.id_expediteur === user?.id ? 'justify-content-end' : 'justify-content-start'
                        }`}
                      >
                        <div
                          className={`rounded-3 px-3 py-2 ${
                            message.id_expediteur === user?.id
                              ? 'bg-primary text-white'
                              : 'bg-light text-dark'
                          }`}
                          style={{ maxWidth: '70%', wordBreak: 'break-word' }}
                        >
                          <p className="mb-1">{message.contenu}</p>
                          <small className={`${
                            message.id_expediteur === user?.id ? 'text-white-50' : 'text-muted'
                          }`}>
                            {formatTime(message.date_envoi)}
                            {message.lu && message.id_expediteur === user?.id && ' · Lu'}
                          </small>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Formulaire d'envoi */}
              <div className="card-footer bg-light">
                <form onSubmit={sendMessage}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sendingMessage}
                    />
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                    >
                      {sendingMessage ? (
                        <span className="spinner-border spinner-border-sm me-2"></span>
                      ) : (
                        <i className="bi bi-send"></i>
                      )}
                      Envoyer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="card h-100">
              <div className="card-body d-flex justify-content-center align-items-center" style={{ backgroundColor: '#ffffff' }}>
                <div className="text-center">
                  <i className="bi bi-chat-square display-1" style={{ color: '#6c757d' }}></i>
                  <h5 className="mt-3" style={{ color: '#000000', fontWeight: '600' }}>Sélectionnez une conversation</h5>
                  <p style={{ color: '#000000', fontSize: '1rem' }}>Choisissez une conversation dans la liste pour commencer à discuter</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
      </>
    </div>
  );
};

export default Messaging;
