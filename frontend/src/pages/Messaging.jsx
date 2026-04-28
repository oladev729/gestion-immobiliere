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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      
      console.log('Toutes les conversations reçues:', response.data);
      console.log('Type utilisateur:', user?.type || user?.type_utilisateur);
      
      // Log détaillé de la première conversation pour déboguer
      if (response.data.length > 0) {
        console.log('Détails de la première conversation:', response.data[0]);
        console.log('Champs disponibles:', Object.keys(response.data[0]));
      }
      
      // Filtrage simple et efficace des conversations
      let filteredConversations = response.data.filter(conv => {
        const userId = parseInt(user.id);
        const expediteurId = parseInt(conv.id_expediteur);
        const destinataireId = parseInt(conv.id_destinataire);
        const autreId = parseInt(conv.autre_id);
        
        // L'utilisateur doit être soit l'expéditeur, soit le destinataire, soit l'interlocuteur identifié
        return (expediteurId === userId || destinataireId === userId || autreId === userId);
      });
      
      console.log('Conversations après filtrage simple:', filteredConversations);
      setConversations(filteredConversations);
      
      // Si un demandeId est spécifié, on sélectionne la conv correspondante
      if (demandeIdFromUrl) {
          const typeFromUrl = queryParams.get('type');
          console.log(`Recherche auto: demandeId=${demandeIdFromUrl}, type=${typeFromUrl}`);
          
          // Chercher dans toutes les conversations reçues
          const conv = response.data.find(c => {
              const matchId = (c.id_demande == demandeIdFromUrl || c.demandeId == demandeIdFromUrl);
              if (!typeFromUrl) return matchId;
              
              const isVisitor = (c.expediteur_type === 'visiteur' || c.destinataire_type === 'visiteur');
              if (typeFromUrl === 'visiteur') return matchId && isVisitor;
              if (typeFromUrl === 'locataire') return matchId && !isVisitor;
              return matchId;
          });

          if (conv) {
              console.log('Conversation trouvée et forcée:', conv);
              setConversations([conv]); // On garde uniquement cette conversation
              selectConversation(conv);
          } else {
              console.log('Aucune conversation trouvée pour demandeId:', demandeIdFromUrl);
              const tempConv = {
                id: `temp_${demandeIdFromUrl}`,
                id_demande: demandeIdFromUrl,
                autre_nom: 'Chargement...',
                autre_prenoms: '',
                bien_titre: 'Conversation associée',
                date_envoi: new Date().toISOString()
              };
              setConversations([tempConv]);
              selectConversation(tempConv);
          }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur récupération conversations:', error);
      setLoading(false);
    }
  };

  const fetchConversationByDemandeId = async (demandeId) => {
    try {
      console.log('Récupération directe de la conversation pour demandeId:', demandeId);
      const response = await api.get(`/messages/conversation/demande/${demandeId}`);
      const conversation = response.data;
      
      if (conversation) {
        console.log('Conversation récupérée avec succès:', conversation);
        // Ajouter la conversation à la liste
        setConversations(prev => [...prev, conversation]);
        // Sélectionner la conversation
        selectConversation(conversation);
      }
    } catch (error) {
      console.error('Erreur récupération conversation par demandeId:', error);
    }
  };

  const selectConversation = async (conversation) => {
    console.log('Sélection FORCÉE de la conversation:', conversation);
    console.log('ID demande:', conversation.id_demande || conversation.demandeId);
    console.log('Email associé:', conversation.autre_email);
    
    setSelectedConversation(conversation);
    
    // FORCER le chargement des messages par demandeId si disponible
    const demandeId = conversation.id_demande || conversation.demandeId;
    if (demandeId) {
        console.log('CHARGEMENT FORCÉ des messages par demandeId:', demandeId);
        fetchMessages(null, demandeId);
    } else {
        // Sinon, charger par utilisateur
        const otherUserId = conversation.autre_email || conversation.autre_id;
        console.log('Chargement des messages par utilisateur:', otherUserId);
        fetchMessages(otherUserId);
    }
  };

  const fetchMessages = async (userId, idDemande = null) => {
    try {
      let url;
      if (idDemande) {
        // Utiliser l'endpoint correct pour les messages par demande
        url = `/messages/conversation/visitor?id_demande=${idDemande}`;
      } else if (userId) {
        // Récupérer les messages par ID utilisateur
        url = `/messages/conversation/${userId}`;
      } else {
        console.error('Aucun ID fourni pour fetchMessages');
        return;
      }
      
      console.log('Récupération messages depuis:', url);
      const response = await api.get(url);
      console.log('Messages reçus:', response.data);
      setMessages(response.data);
    } catch (error) {
      console.error('Erreur récupération messages:', error);
      console.error('URL demandée:', url);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const typeFromUrl = queryParams.get('type');
      const isVisitor = typeFromUrl === 'visiteur' || selectedConversation.expediteur_type === 'visiteur' || selectedConversation.destinataire_type === 'visiteur';
      
      const payload = {
        contenu: newMessage,
        id_bien: selectedConversation.id_bien,
        id_demande: demandeIdFromUrl || selectedConversation.id_demande,
        destinataire_type: isVisitor ? 'visiteur' : 'utilisateur'
      };

      if (user) {
          payload.id_destinataire = selectedConversation.autre_id || selectedConversation.id_expediteur || selectedConversation.id_destinataire;
      } else {
          // Visiteur vers Propriétaire
          payload.id_expediteur = demandeIdFromUrl; 
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
              <button onClick={() => navigate('/login')} className="signin-btn mt-3 px-4 fw-bold">Se connecter</button>
          </div>
      )}

      {(user || demandeIdFromUrl) && (
      <div className="row justify-content-center g-4">
        {/* Liste des conversations (masquée pour les visiteurs) */}
        {user && (
        <div className="col-lg-4 col-md-5">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-chat-dots me-2"></i>
                  Messages
                </h5>
                <button 
                  className="btn btn-sm btn-light"
                  onClick={() => fetchConversations()}
                  title="Rafraîchir les conversations"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div className="text-center py-4" style={{ color: '#000000' }}>
                  <i className="bi bi-chat-square-dots display-4" style={{ color: '#6c757d' }}></i>
                  <p className="mt-2" style={{ color: '#000000', fontWeight: '500' }}>Aucune conversation</p>
                </div>
              ) : (
                conversations.map((conversation, index) => (
                  <div
                    key={`conv_${conversation.id || conversation.autre_id || index}_${conversation.autre_email}`}
                    className={`list-group-item list-group-item-action cursor-pointer ${
                      selectedConversation?.autre_id == conversation.autre_id ? 'active' : ''
                    }`}
                    onClick={() => selectConversation(conversation)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1 me-2">
                        <h6 className="mb-1 text-truncate">
                          {(() => {
                            // Afficher le nom avec les vrais champs disponibles
                            if (conversation.autre_prenoms && conversation.autre_nom) {
                              return `${conversation.autre_prenoms} ${conversation.autre_nom}`;
                            } else if (conversation.autre_email) {
                              // Extraire et formater le nom de l'email
                              const emailName = conversation.autre_email.split('@')[0];
                              // Remplacer les points et underscores par des espaces
                              const formattedName = emailName.replace(/[._]/g, ' ');
                              // Mettre en majuscule la première lettre
                              return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
                            } else {
                              return 'Utilisateur';
                            }
                          })()}
                        </h6>
                        <small className="text-muted d-block text-truncate">
                          {conversation.autre_email || ''}
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
                      {(() => {
                        // Afficher le nom avec les vrais champs disponibles
                        if (selectedConversation.autre_prenoms && selectedConversation.autre_nom) {
                          return `${selectedConversation.autre_prenoms} ${selectedConversation.autre_nom}`;
                        } else if (selectedConversation.autre_email) {
                          // Extraire et formater le nom de l'email
                          const emailName = selectedConversation.autre_email.split('@')[0];
                          // Remplacer les points et underscores par des espaces
                          const formattedName = emailName.replace(/[._]/g, ' ');
                          // Mettre en majuscule la première lettre
                          return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
                        } else {
                          return 'Utilisateur';
                        }
                      })()}
                    </h6>
                    <small className="text-muted text-truncate">
                      {selectedConversation.autre_email || ''}
                    </small>
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
                    {messages.map((message, index) => {
                      const isMyMessage = user 
                        ? (message.id_expediteur == user.id && message.expediteur_type !== 'visiteur')
                        : (message.expediteur_type === 'visiteur');
                      
                      return (
                      <div
                        key={`msg_${message.id || index}_${message.date_envoi}`}
                        className={`d-flex ${
                          isMyMessage ? 'justify-content-end' : 'justify-content-start'
                        }`}
                      >
                        <div
                          className={`rounded-3 px-3 py-2 ${
                            isMyMessage
                              ? 'bg-primary text-white'
                              : 'bg-light text-dark'
                          }`}
                          style={{ maxWidth: '70%', wordBreak: 'break-word' }}
                        >
                          <p className="mb-1">{message.contenu}</p>
                          <small className={`${
                            isMyMessage ? 'text-white-50' : 'text-muted'
                          }`}>
                            {formatTime(message.date_envoi)}
                            {message.lu && isMyMessage && ' · Lu'}
                          </small>
                        </div>
                      </div>
                    )})}
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
