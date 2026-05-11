import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// VERSION SIMPLIFIÉE POUR DÉBOGUER
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

  // Faire défiler vers le bas quand les messages changent
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
      console.log('� Conversations brutes reçues:', response.data);
      
      // Filtrage simple par utilisateur
      const filteredConversations = response.data.filter(conv => {
        const userId = parseInt(user.id);
        const expediteurId = parseInt(conv.id_expediteur);
        const destinataireId = parseInt(conv.id_destinataire);
        
        return (expediteurId === userId || destinataireId === userId);
      });
      
      console.log('🔍 Conversations filtrées:', filteredConversations);
      console.log('📊 Nombre de conversations filtrées:', filteredConversations.length);
      
      // AFFICHAGE DIRECT SANS REGROUPEMENT POUR DÉBOGAGE
      if (filteredConversations.length === 0) {
        console.log('⚠️ Aucune conversation après filtrage - affichage direct des données brutes');
        console.log('📥 Données brutes reçues:', response.data);
        
        // Vérifier si les IDs correspondent
        response.data.forEach((conv, index) => {
          console.log(`🔍 Conversation brute ${index + 1}:`, {
            id_expediteur: conv.id_expediteur,
            id_destinataire: conv.id_destinataire,
            user_id: user.id,
            match_expediteur: parseInt(conv.id_expediteur) === parseInt(user.id),
            match_destinataire: parseInt(conv.id_destinataire) === parseInt(user.id)
          });
        });
      }
      
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
      console.log('📊 Nombre de conversations finales:', displayConversations.length);
      
      // Vérifier la structure de chaque conversation
      displayConversations.forEach((conv, index) => {
        console.log(`🔍 Conversation ${index + 1}:`, {
          group_key: conv.group_key,
          bien_titre: conv.bien_titre,
          id_bien: conv.id_bien,
          autre_nom: conv.autre_nom,
          autre_prenoms: conv.autre_prenoms,
          contenu: conv.contenu?.substring(0, 50) + '...'
        });
      });
      
      setConversations(displayConversations);
      
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
    console.log('🎯 Sélection de la conversation:', conversation);
    console.log('🆔 ID demande:', conversation.id_demande || conversation.demandeId);
    console.log('📧 Email associé:', conversation.autre_email);
    console.log('🏠 ID bien:', conversation.id_bien);
    
    setSelectedConversation(conversation);
    
    // Éviter les boucles infinies - utiliser une clé unique
    const currentKey = `${conversation.id_demande || conversation.id_bien || 'general'}_${conversation.autre_email}`;
    const selectedKey = selectedConversation ? `${selectedConversation.id_demande || selectedConversation.id_bien || 'general'}_${selectedConversation.autre_email}` : null;
    
    if (selectedKey === currentKey) {
        console.log('⚠️ Conversation déjà sélectionnée, éviter le rechargement');
        return;
    }
    
    try {
        // FORCER le chargement des messages par demandeId si disponible
        const demandeId = conversation.id_demande || conversation.demandeId;
        if (demandeId) {
            console.log('📥 Chargement des messages par demandeId:', demandeId);
            await fetchMessagesByDemandeId(demandeId);
        } else {
            // Charger par utilisateur ET par bien pour filtrer correctement
            const otherUserId = conversation.autre_id || 
              (conversation.id_expediteur === parseInt(user.id) ? conversation.id_destinataire : conversation.id_expediteur);
            const bienId = conversation.id_bien;
            console.log('👤 Chargement des messages par utilisateur:', otherUserId, 'et bien:', bienId);
            await fetchMessages(otherUserId, null, bienId);
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des messages:', error);
        setMessages([]); // Vider les messages en cas d'erreur
    }
  };

  const fetchMessagesByDemandeId = async (demandeId) => {
    try {
      console.log('🌐 Récupération messages par demandeId:', demandeId);
      
      // Utiliser l'endpoint correct pour les messages par demandeId
      // Forcer l'inclusion du token JWT pour éviter les erreurs 401
      const token = localStorage.getItem('token');
      const response = await api.get(`/messages/conversation/demande/${demandeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📥 Messages reçus par demandeId:', response.data);
      console.log('📊 Nombre de messages:', response.data.length);
      
      // Vérifier si les messages ont la bonne structure
      if (response.data.length > 0) {
        console.log('🔍 Structure du premier message:', response.data[0]);
        console.log('🔍 Champs disponibles:', Object.keys(response.data[0]));
      }
      
      // Trier les messages par date pour l'affichage correct
      const sortedMessages = response.data.sort((a, b) => 
        new Date(a.date_envoi) - new Date(b.date_envoi)
      );
      
      // Forcer la mise à jour avec un nouvel état pour déclencher le re-rendu
      setMessages([]);
      setTimeout(() => {
        setMessages(sortedMessages);
      }, 50);
      
    } catch (error) {
      console.error('❌ Erreur récupération messages par demandeId:', error);
      console.error('❌ URL demandée:', `/messages/conversation/demande/${demandeId}`);
      console.error('❌ Détails erreur:', error.response?.data || error.message);
      
      // En cas d'erreur, essayer de charger par utilisateur si disponible
      if (selectedConversation && selectedConversation.autre_id) {
        console.log('🔄 Fallback: chargement par utilisateur:', selectedConversation.autre_id);
        await fetchMessages(selectedConversation.autre_id);
      } else {
        // Mettre un tableau vide pour éviter l'erreur d'affichage
        setMessages([]);
      }
    }
  };

  const fetchMessages = async (userId, idDemande = null, idBien = null) => {
    try {
      let url;
      
      if (idDemande) {
        url = `/messages/conversation/demande/${idDemande}`;
      } else if (userId) {
        url = `/messages/conversation/${userId}${idBien ? `?id_bien=${idBien}` : ''}`;
      } else {
        console.error('Aucun ID fourni pour fetchMessages');
        return;
      }
      
      console.log('📡 URL de récupération des messages:', url);
      console.log('👤 User ID:', userId);
      console.log('🏠 Bien ID:', idBien);
      
      const response = await api.get(url);
      console.log('📥 Messages reçus:', response.data);
      console.log('📊 Nombre de messages:', response.data.length);
      
      const sortedMessages = response.data.sort((a, b) => 
        new Date(a.date_envoi) - new Date(b.date_envoi)
      );
      
      console.log('📋 Messages triés:', sortedMessages);
      
      // Forcer la mise à jour avec un nouvel état pour déclencher le re-rendu
      setMessages([]);
      setTimeout(() => {
        setMessages(sortedMessages);
        console.log('✅ Messages affichés:', sortedMessages.length);
      }, 50);
      
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      console.error('❌ URL demandée:', url);
      console.error('❌ Détails erreur:', error.response?.data || error.message);
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
        console.log('⚠️ Message vide, envoi annulé');
        return;
    }

    console.log('✅ Début envoi message...');
    setSendingMessage(true);
    
    try {
      const payload = {
        contenu: newMessage.trim(),
        id_bien: selectedConversation.id_bien,
        id_demande: selectedConversation.id_demande || demandeIdFromUrl
      };

      // Déterminer le destinataire correctement
      if (user) {
        const currentUserId = parseInt(user.id);
        const expediteurId = parseInt(selectedConversation.id_expediteur);
        const destinataireId = parseInt(selectedConversation.id_destinataire);
        
        // Si l'utilisateur actuel est l'expéditeur, envoyer au destinataire
        if (currentUserId === expediteurId) {
          payload.id_destinataire = destinataireId;
        } 
        // Si l'utilisateur actuel est le destinataire, envoyer à l'expéditeur
        else if (currentUserId === destinataireId) {
          payload.id_destinataire = expediteurId;
        }
        // Fallback : utiliser autre_id si disponible
        else if (selectedConversation.autre_id) {
          payload.id_destinataire = selectedConversation.autre_id;
        }
        // Dernier fallback
        else {
          payload.id_destinataire = expediteurId === currentUserId ? destinataireId : expediteurId;
        }
        
        // Déterminer le type de destinataire
        const isVisitor = selectedConversation.expediteur_type === 'visiteur' || 
                         selectedConversation.destinataire_type === 'visiteur';
        payload.destinataire_type = isVisitor ? 'visiteur' : 'utilisateur';
      }

      console.log('📤 Payload d\'envoi:', payload);
      
      const response = await api.post('/messages/send', payload);
      console.log('✅ Message envoyé avec succès:', response.data);
      
      // Vider le champ de saisie immédiatement
      setNewMessage('');
      
      // Ajouter le nouveau message à la liste
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, response.data];
        // Trier par date pour maintenir l'ordre
        return updatedMessages.sort((a, b) => 
          new Date(a.date_envoi) - new Date(b.date_envoi)
        );
      });
      
      // Rafraîchir les conversations pour mettre à jour les infos
      fetchConversations();
      
      // Forcer le rechargement des messages après un court délai pour s'assurer que le message est bien là
      setTimeout(() => {
        const demandeId = selectedConversation.id_demande || demandeIdFromUrl;
        if (demandeId) {
          fetchMessagesByDemandeId(demandeId);
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      console.error('❌ Détails erreur:', error.response?.data || error.message);
      
      // Afficher une erreur à l'utilisateur
      alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
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
                    key={`conv_${conversation.group_key || conversation.id_bien || conversation.id || index}_${conversation.autre_email || Math.random()}`}
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
                        {conversation.id_bien && (
                          <small className="text-primary d-block">
                            <i className="bi bi-building me-1"></i>
                            Bien ID: {conversation.id_bien}
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
                      // Validation de sécurité pour éviter les erreurs
                      if (!message || !message.contenu) {
                        console.warn(`⚠️ Message invalide à l'index ${index}:`, message);
                        return null;
                      }
                      
                      // Logique simple et robuste pour déterminer si c'est mon message
                      const isMyMessage = user && (
                        message.id_expediteur == user.id || 
                        (message.expediteur_type === 'utilisateur' && message.id_expediteur == user.id)
                      );
                      
                      // Debug minimal pour identifier le problème
                      if (index === 0 || index === messages.length - 1) {
                        console.log(`🔍 Message ${index}:`, {
                          id_expediteur: message.id_expediteur,
                          user_id: user?.id,
                          isMyMessage,
                          contenu: message.contenu?.substring(0, 50) + '...'
                        });
                      }
                      
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
                    )}).filter(Boolean)} {/* Filtrer les messages null */}
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
