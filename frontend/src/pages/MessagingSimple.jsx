import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const MessagingSimple = () => {
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      console.log('🚀 Chargement des conversations pour utilisateur:', user.id);
      
      const response = await api.get('/messages/conversations');
      console.log('📥 Conversations brutes reçues:', response.data);
      
      // Filtrage simple par utilisateur
      const filteredConversations = response.data.filter(conv => {
        const userId = parseInt(user.id);
        const expediteurId = parseInt(conv.id_expediteur);
        const destinataireId = parseInt(conv.id_destinataire);
        
        return (expediteurId === userId || destinataireId === userId);
      });
      
      console.log('🔍 Conversations filtrées:', filteredConversations);
      
      // Regroupement PAR BIEN - solution simple
      const conversationsParBien = {};
      
      filteredConversations.forEach(conv => {
        const bienId = conv.id_bien || 'general';
        
        if (!conversationsParBien[bienId]) {
          conversationsParBien[bienId] = {
            bien_id: bienId,
            bien_titre: conv.bien_titre || 'Discussion générale',
            conversations: [],
            dernier_message: conv
          };
        }
        
        conversationsParBien[bienId].conversations.push(conv);
        
        // Garder le message le plus récent comme représentant
        if (new Date(conv.date_envoi) > new Date(conversationsParBien[bienId].dernier_message.date_envoi)) {
          conversationsParBien[bienId].dernier_message = conv;
        }
      });
      
      const finalConversations = Object.values(conversationsParBien);
      console.log('🎯 Conversations groupées par bien:', finalConversations);
      
      // Créer une structure simple pour l'affichage
      const displayConversations = finalConversations.map(group => ({
        ...group.dernier_message,
        group_key: `${group.bien_id}`,
        bien_titre: group.bien_titre,
        id_bien: group.bien_id,
        nombre_messages: group.conversations.length
      }));
      
      console.log('💬 Conversations finales pour affichage:', displayConversations);
      setConversations(displayConversations);
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération conversations:', error);
      setLoading(false);
    }
  };

  const selectConversation = async (conversation) => {
    console.log('🎯 Sélection de la conversation:', conversation);
    setSelectedConversation(conversation);
    
    try {
      const otherUserId = conversation.id_expediteur === parseInt(user.id) 
        ? conversation.id_destinataire 
        : conversation.id_expediteur;
      
      let url = `/messages/conversation/${otherUserId}`;
      if (conversation.id_bien) {
        url += `?id_bien=${conversation.id_bien}`;
      }
      
      console.log('📥 Chargement messages depuis:', url);
      const response = await api.get(url);
      
      const sortedMessages = response.data.sort((a, b) => 
        new Date(a.date_envoi) - new Date(b.date_envoi)
      );
      
      setMessages(sortedMessages);
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    
    try {
      const payload = {
        contenu: newMessage.trim(),
        id_bien: selectedConversation.id_bien,
        id_destinataire: selectedConversation.id_expediteur === parseInt(user.id) 
          ? selectedConversation.id_destinataire 
          : selectedConversation.id_expediteur
      };

      const response = await api.post('/messages/send', payload);
      
      setMessages(prev => [...prev, response.data].sort((a, b) => 
        new Date(a.date_envoi) - new Date(b.date_envoi)
      ));
      
      setNewMessage('');
      fetchConversations(); // Rafraîchir la liste
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
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
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 container">
      {!user && (
        <div className="alert alert-info shadow-sm border-0 rounded-4 p-4 text-center">
          <h4 className="fw-bold">Accès restreint</h4>
          <p className="mb-0">Veuillez vous connecter pour accéder à votre messagerie</p>
          <button onClick={() => navigate('/login')} className="signin-btn mt-3 px-4 fw-bold">Se connecter</button>
        </div>
      )}

      {user && (
        <div className="row justify-content-center g-4">
          {/* Liste des conversations */}
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
                  <div className="text-center py-4">
                    <i className="bi bi-chat-square-dots display-4" style={{ color: '#6c757d' }}></i>
                    <p className="mt-2">Aucune conversation</p>
                  </div>
                ) : (
                  conversations.map((conversation, index) => (
                    <div
                      key={`conv_${conversation.group_key}_${index}`}
                      className={`list-group-item list-group-item-action cursor-pointer ${
                        selectedConversation?.group_key === conversation.group_key ? 'active' : ''
                      }`}
                      onClick={() => selectConversation(conversation)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1 me-2">
                          <h6 className="mb-1 text-truncate">
                            {(() => {
                              if (conversation.autre_prenoms && conversation.autre_nom) {
                                return `${conversation.autre_prenoms} ${conversation.autre_nom}`;
                              } else if (conversation.autre_email) {
                                const emailName = conversation.autre_email.split('@')[0];
                                const formattedName = emailName.replace(/[._]/g, ' ');
                                return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
                              } else {
                                return 'Utilisateur';
                              }
                            })()}
                          </h6>
                          <small className="text-muted d-block text-truncate">
                            {conversation.autre_email || ''}
                          </small>
                          <div className="mt-1">
                            <small className="text-primary d-block">
                              <i className="bi bi-house-door me-1"></i>
                              {conversation.bien_titre}
                            </small>
                            {conversation.id_bien && (
                              <small className="text-secondary d-block">
                                <i className="bi bi-building me-1"></i>
                                Bien ID: {conversation.id_bien}
                              </small>
                            )}
                            <small className="text-muted d-block">
                              <i className="bi bi-chat me-1"></i>
                              {conversation.nombre_messages || 1} message(s)
                            </small>
                          </div>
                        </div>
                        <div className="text-end flex-shrink-0">
                          <small className="text-muted d-block">
                            {formatDate(conversation.date_envoi)}
                          </small>
                          <small className="text-muted">
                            {formatTime(conversation.date_envoi)}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Conversation sélectionnée */}
          <div className="col-lg-8 col-md-7">
            {selectedConversation ? (
              <div className="card h-100">
                <div className="card-header bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="flex-grow-1 me-2">
                      <h6 className="mb-0 text-truncate">
                        <i className="bi bi-person-circle me-2"></i>
                        {(() => {
                          if (selectedConversation.autre_prenoms && selectedConversation.autre_nom) {
                            return `${selectedConversation.autre_prenoms} ${selectedConversation.autre_nom}`;
                          } else if (selectedConversation.autre_email) {
                            const emailName = selectedConversation.autre_email.split('@')[0];
                            const formattedName = emailName.replace(/[._]/g, ' ');
                            return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
                          } else {
                            return 'Utilisateur';
                          }
                        })()}
                      </h6>
                      <small className="text-muted text-truncate">
                        {selectedConversation.autre_email || ''}
                      </small>
                      <div className="mt-1">
                        <small className="text-primary d-block">
                          <i className="bi bi-house-door me-1"></i>
                          {selectedConversation.bien_titre}
                        </small>
                        {selectedConversation.id_bien && (
                          <small className="text-secondary d-block">
                            <i className="bi bi-building me-1"></i>
                            Bien ID: {selectedConversation.id_bien}
                          </small>
                        )}
                      </div>
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
                        const isMyMessage = user && (
                          message.id_expediteur == user.id || 
                          (message.expediteur_type === 'utilisateur' && message.id_expediteur == user.id)
                        );
                        
                        return (
                          <div
                            key={`msg_${message.id_message || index}_${message.date_envoi || Date.now()}`}
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
                                {message.date_envoi && formatTime(message.date_envoi)}
                                {message.lu && isMyMessage && ' · Lu'}
                              </small>
                            </div>
                          </div>
                        );
                      })}
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
                <div className="card-body d-flex justify-content-center align-items-center">
                  <div className="text-center">
                    <i className="bi bi-chat-square display-1" style={{ color: '#6c757d' }}></i>
                    <h5 className="mt-3">Sélectionnez une conversation</h5>
                    <p>Choisissez une conversation dans la liste pour commencer à discuter</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingSimple;
