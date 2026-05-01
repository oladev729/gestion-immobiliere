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
      console.log('🔍 Recherche conversation avec propriétaire:', proprietaireIdFromUrl);
      console.log('📋 Conversations disponibles:', conversations);
      
      // Vérifier si une conversation existe déjà avec ce propriétaire
      const existingConv = conversations.find(conv => {
        // Utiliser la structure renvoyée par le backend
        const otherId = conv.autre_id || (conv.id_expediteur === parseInt(user.id) ? conv.id_destinataire : conv.id_expediteur);
        return otherId == proprietaireIdFromUrl;
      });
      
      console.log('🎯 Conversation trouvée:', existingConv);
      
      if (existingConv) {
        selectConversation(existingConv);
      } else {
        console.log('🔧 Création nouvelle conversation...');
        // Envoyer un message pour créer la conversation
        const response = await api.post('/messages/send', {
          id_destinataire: proprietaireIdFromUrl,
          contenu: 'Bonjour, je suis intéressé par votre bien',
          id_bien: queryParams.get('bienId') || 5
        });
        
        console.log('✅ Message envoyé pour créer conversation:', response.data);
        // Rafraîchir les conversations
        fetchTenantConversations();
      }
    } catch (error) {
      console.error('Erreur création conversation:', error);
    }
  };

  const fetchTenantConversations = async () => {
    try {
      setLoading(true);
      console.log('🔍 Début fetchTenantConversations pour utilisateur:', user?.id, user?.email);
      
      // Utiliser les routes universelles de messagerie
      const response = await api.get('/messages/conversations');
      console.log('📥 Conversations brutes reçues:', response.data);
      console.log('📊 Nombre de conversations brutes:', response.data.length);
      
      // Dédoublonner les conversations par propriétaire
      const uniqueConversations = [];
      const seenProprietaires = new Set();
      
      response.data.forEach((conv, index) => {
        console.log(`🔍 Analyse conversation ${index}:`, {
          conv: conv,
          id_expediteur: conv.id_expediteur,
          id_destinataire: conv.id_destinataire,
          autre_id: conv.autre_id,
          id_demande: conv.id_demande,
          contenu: conv.contenu
        });
        
        // Déterminer l'ID du propriétaire (l'autre personne)
        const currentUserId = parseInt(user.id);
        const expediteurId = parseInt(conv.id_expediteur);
        const destinataireId = parseInt(conv.id_destinataire);
        
        let proprietaireId;
        if (currentUserId === expediteurId) {
          proprietaireId = destinataireId;
        } else if (currentUserId === destinataireId) {
          proprietaireId = expediteurId;
        } else {
          proprietaireId = conv.autre_id;
        }
        
        console.log(`🎯 Propriétaire ID déterminé pour conversation ${index}:`, proprietaireId);
        
        // Si on n'a pas encore vu ce propriétaire, ajouter la conversation
        if (!seenProprietaires.has(proprietaireId)) {
          seenProprietaires.add(proprietaireId);
          uniqueConversations.push(conv);
          console.log(`✅ Conversation ${index} ajoutée:`, conv);
        } else {
          // Si on a déjà ce propriétaire, mettre à jour avec la conversation la plus récente
          const existingIndex = uniqueConversations.findIndex(c => {
            const existingPropId = c.autre_id || 
              (c.id_expediteur === parseInt(user.id) ? c.id_destinataire : c.id_expediteur);
            return existingPropId === proprietaireId;
          });
          
          if (existingIndex !== -1) {
            // Garder la conversation la plus récente
            const existingDate = new Date(uniqueConversations[existingIndex].date_envoi);
            const newDate = new Date(conv.date_envoi);
            if (newDate > existingDate) {
              uniqueConversations[existingIndex] = conv;
              console.log(`🔄 Conversation ${index} mise à jour (plus récente):`, conv);
            } else {
              console.log(`⏭ Conversation ${index} ignorée (moins récente):`, conv);
            }
          }
        }
      });
      
      console.log('📥 Conversations finales après dédoublonnage:', uniqueConversations);
      console.log('📊 Nombre final de conversations:', uniqueConversations.length);
      setConversations(uniqueConversations);
      
      // Si un demandeId est spécifié, on sélectionne la conv correspondante
      if (demandeIdFromUrl) {
          const conv = uniqueConversations.find(c => c.id_demande == demandeIdFromUrl);
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
    console.log('🎯 Sélection conversation locataire:', JSON.stringify(conversation, null, 2));
    setSelectedConversation(conversation);
    
    try {
      // Utiliser les routes universelles de messagerie
      let url;
      if (conversation.id_demande) {
        // Essayer l'endpoint par demandeId, mais avec fallback si ça échoue
        try {
          url = `/messages/conversation/demande/${conversation.id_demande}`;
          console.log('🌐 Tentative endpoint demandeId:', url);
          const response = await api.get(url);
          console.log('✅ Endpoint demandeId fonctionne:', response.data);
          console.log('📊 Nombre de messages reçus via demandeId:', response.data.length);
          
          // Trier les messages par date
          const sortedMessages = response.data.sort((a, b) => 
            new Date(a.date_envoi) - new Date(b.date_envoi)
          );
          
          console.log('📋 Messages triés:', sortedMessages);
          setMessages(sortedMessages);
          return; // Sortir de la fonction si ça marche
        } catch (demandeError) {
          console.warn('⚠️ Endpoint demandeId échoue, fallback vers endpoint utilisateur:', demandeError.message);
          // Continuer vers le fallback
        }
      }
      
      // Fallback : utiliser l'endpoint par utilisateur
      const currentUserId = parseInt(user.id);
      const expediteurId = parseInt(conversation.id_expediteur);
      const destinataireId = parseInt(conversation.id_destinataire);
      
      let otherId;
      if (currentUserId === expediteurId) {
        otherId = destinataireId;
      } else if (currentUserId === destinataireId) {
        otherId = expediteurId;
      } else {
        otherId = conversation.autre_id || (currentUserId === expediteurId ? destinataireId : expediteurId);
      }
      
      url = `/messages/conversation/${otherId}`;
      if (conversation.id_bien) {
        url += `?id_bien=${conversation.id_bien}`;
      }
      
      console.log('🌐 URL fallback utilisée:', url);
      console.log('👤 Utilisateur actuel:', user.id, 'Type:', user.type);
      console.log('🎯 Autre personne ID:', otherId);
      
      const response = await api.get(url);
      console.log('📥 Messages reçus (brut):', response.data);
      console.log('📊 Nombre de messages reçus via fallback:', response.data.length);
      
      // Vérifier la structure des messages
      if (response.data.length > 0) {
        console.log('📋 Structure premier message:', Object.keys(response.data[0]));
        console.log('📋 Premier message complet:', JSON.stringify(response.data[0], null, 2));
      } else {
        console.warn('⚠️ Aucun message reçu via fallback!');
      }
      
      // Trier les messages par date
      const sortedMessages = response.data.sort((a, b) => 
        new Date(a.date_envoi) - new Date(b.date_envoi)
      );
      
      console.log('📋 Messages finaux après tri:', sortedMessages);
      setMessages(sortedMessages);
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      console.error('❌ Détails erreur:', error.response?.data || error.message);
      console.error('❌ Status:', error.response?.status);
      // Mettre un tableau vide pour éviter les erreurs d'affichage
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    console.log('🚀 Envoi message locataire...');
    console.log('📝 Message:', newMessage);
    console.log('👤 Utilisateur:', JSON.stringify(user, null, 2));
    console.log('📋 Conversation:', JSON.stringify(selectedConversation, null, 2));

    setSendingMessage(true);
    try {
      // Déterminer correctement l'ID du destinataire (propriétaire)
      const currentUserId = parseInt(user.id);
      const expediteurId = parseInt(selectedConversation.id_expediteur);
      const destinataireId = parseInt(selectedConversation.id_destinataire);
      
      let destinataireFinal;
      
      // Si l'utilisateur actuel est l'expéditeur, envoyer au destinataire original
      if (currentUserId === expediteurId) {
        destinataireFinal = destinataireId;
      }
      // Si l'utilisateur actuel est le destinataire, envoyer à l'expéditeur original
      else if (currentUserId === destinataireId) {
        destinataireFinal = expediteurId;
      }
      // Fallback : utiliser autre_id si disponible
      else if (selectedConversation.autre_id) {
        destinataireFinal = selectedConversation.autre_id;
      }
      // Dernier fallback : utiliser l'ID qui n'est pas l'utilisateur actuel
      else {
        destinataireFinal = currentUserId === expediteurId ? destinataireId : expediteurId;
      }
      
      const payload = {
        contenu: newMessage.trim(),
        id_destinataire: destinataireFinal,
        id_bien: selectedConversation.id_bien,
        id_demande: selectedConversation.id_demande,
        destinataire_type: 'utilisateur',
        expediteur_type: 'utilisateur'
      };
      
      console.log('📤 Payload final:', payload);
      console.log('🎯 Destinataire final:', destinataireFinal);
      
      const response = await api.post('/messages/send', payload);
      console.log('✅ Message envoyé avec succès:', response.data);
      
      // Vider le champ de saisie
      setNewMessage('');
      
      // Ajouter immédiatement le nouveau message à la liste
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, response.data];
        // Trier par date pour maintenir l'ordre
        return updatedMessages.sort((a, b) => 
          new Date(a.date_envoi) - new Date(b.date_envoi)
        );
      });
      
      // Forcer le rechargement de la conversation actuelle après un court délai
      setTimeout(() => {
        console.log('🔄 Rechargement forcé de la conversation après envoi...');
        if (selectedConversation) {
          selectConversation(selectedConversation);
        }
      }, 200);
      
      // Faire défiler vers le bas
      setTimeout(() => {
        scrollToBottom();
      }, 300);
      
    } catch (error) {
      console.error('❌ Erreur envoi message locataire:', error);
      console.error('❌ Détails erreur:', error.response?.data || error.message);
      console.error('❌ Status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      alert(`Erreur lors de l'envoi du message: ${errorMessage}`);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    
    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Date invalide:', dateString);
        return '--:--';
      }
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('❌ Erreur formatage date:', dateString, error);
      return '--:--';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
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
    } catch (error) {
      console.error('❌ Erreur formatage date:', dateString, error);
      return '';
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
    <div className="py-4 container">
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
                  onClick={() => fetchTenantConversations()}
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
                              return 'Propriétaire';
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
                          return 'Propriétaire';
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
                      // Log détaillé pour comprendre le problème
                      console.log(`🔍 Message ${index} - Analyse complète:`, {
                        message: message,
                        userId: user?.id,
                        userIdInt: parseInt(user?.id),
                        expediteurId: message.id_expediteur,
                        expediteurIdInt: parseInt(message.id_expediteur) || 'undefined',
                        destinataireId: message.id_destinataire,
                        destinataireIdInt: parseInt(message.id_destinataire) || 'undefined',
                        expediteurType: message.expediteur_type,
                        destinataireType: message.destinataire_type,
                        tousLesChamps: Object.keys(message),
                        messageContenu: message.contenu,
                        messageExpediteurNom: message.expediteur_nom,
                        messageDestinataireNom: message.destinataire_nom
                      });
                      
                      // Logique améliorée pour déterminer si c'est mon message
                      let isMyMessage = false;
                      let raison = '';
                      
                      if (user?.id) {
                        const currentUserId = parseInt(user.id);
                        
                        // Cas 1: id_expediteur existe et correspond à l'utilisateur
                        if (message.id_expediteur && parseInt(message.id_expediteur) === currentUserId) {
                          isMyMessage = true;
                          raison = 'id_expediteur correspond à l utilisateur';
                        }
                        // Cas 2: id_destinataire existe et correspond à l'utilisateur (message reçu)
                        else if (message.id_destinataire && parseInt(message.id_destinataire) === currentUserId) {
                          isMyMessage = false;
                          raison = 'id_destinataire correspond à l utilisateur (message reçu)';
                        }
                        // Cas 3: Vérifier avec les noms
                        else if (message.expediteur_nom && message.destinataire_nom) {
                          const userNom = (user.prenoms || '') + ' ' + (user.nom || '');
                          if (message.expediteur_nom === userNom.trim()) {
                            isMyMessage = true;
                            raison = 'expediteur_nom correspond à l utilisateur';
                          } else if (message.destinataire_nom === userNom.trim()) {
                            isMyMessage = false;
                            raison = 'destinataire_nom correspond à l utilisateur (message reçu)';
                          }
                        }
                      }
                      
                      console.log(`🎨 Résultat isMyMessage pour message ${index}:`, {
                        isMyMessage: isMyMessage,
                        raison: raison,
                        expediteurId: message.id_expediteur,
                        destinataireId: message.id_destinataire,
                        userId: user?.id,
                        expediteurNom: message.expediteur_nom,
                        destinataireNom: message.destinataire_nom,
                        userPrenoms: user?.prenoms,
                        userNom: user?.nom
                      });
                      
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
    </div>
  );
};

export default TenantMessaging;
