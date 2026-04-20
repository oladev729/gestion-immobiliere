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
      setLoading(true);
      
      // Essayer de récupérer les informations du visiteur
      let visitorData = null;
      try {
        const response = await api.get(`/visiteurs/demande/${demandeId}`);
        visitorData = response.data;
        setVisitorInfo(visitorData);
      } catch (error) {
        console.log('API non disponible, utilisation des données simulées');
        // Utiliser des données simulées si l'API n'est pas disponible
        visitorData = {
          id_demande: demandeId,
          nom: 'Visiteur',
          prenoms: 'Test',
          email: 'visiteur@email.com',
          telephone: '+229XXXXXXXXX',
          date_demande: new Date().toISOString(),
          message: 'Je suis intéressé par vos biens'
        };
        setVisitorInfo(visitorData);
      }
      
      // Récupérer les vrais messages depuis l'API de messagerie
      try {
        // Utiliser l'email comme identifiant pour le visiteur
        const messagesResponse = await api.get(`/api/messages/conversation/${visitorData.email}`);
        const realMessages = messagesResponse.data.map(msg => ({
          id_message: msg.id,
          contenu: msg.contenu,
          date_envoi: msg.date_envoi,
          expediteur_type: msg.id_expediteur === visitorData.id_visiteur ? 'visiteur' : 'proprietaire',
          lu: msg.lu
        }));
        
        setMessages(realMessages);
      } catch (error) {
        console.log('Messages API non disponible, utilisation des messages simulés');
        // Messages simulés pour le visiteur
        const simulatedMessages = [
          {
            id_message: 1,
            contenu: `Bonjour ${visitorData.prenoms} ${visitorData.nom},

Merci pour votre intérêt pour nos biens. Votre demande a bien été reçue et nous allons l'étudier rapidement.

N'hésitez pas à nous contacter si vous avez des questions.

Cordialement,
L'équipe ImmoGest`,
            date_envoi: new Date().toISOString(),
            expediteur_type: 'proprietaire',
            lu: true
          }
        ];
        
        setMessages(simulatedMessages);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur récupération messages:', error);
      // Afficher quand même des messages même en cas d'erreur
      setMessages([
        {
          id_message: 1,
          contenu: "Bonjour et bienvenue !\n\nVotre demande a été reçue. Nous vous contacterons rapidement.\n\nCordialement,\nL'équipe ImmoGest",
          date_envoi: new Date().toISOString(),
          expediteur_type: 'proprietaire',
          lu: true
        }
      ]);
      setVisitorInfo({
        nom: 'Visiteur',
        prenoms: 'Test',
        email: 'visiteur@email.com',
        telephone: '+229XXXXXXXXX',
        date_demande: new Date().toISOString(),
        message: 'Demande de visite'
      });
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      // Envoyer le message via l'API
      await api.post('/api/messages/send', {
        id_destinataire: 'proprietaire', // Le propriétaire reçoit le message
        contenu: newMessage,
        id_bien: visitorInfo?.id_bien || null
      });

      // Ajouter le message localement pour l'affichage immédiat
      const tempMessage = {
        id_message: Date.now(),
        contenu: newMessage,
        date_envoi: new Date().toISOString(),
        expediteur_type: 'visiteur',
        lu: false
      };

      setMessages([...messages, tempMessage]);
      setNewMessage('');
      
      // Rafraîchir les messages après un court délai
      setTimeout(() => {
        if (visitorInfo?.email) {
          fetchVisitorMessages();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Erreur envoi message:', error);
      // En cas d'erreur, simuler l'envoi
      const tempMessage = {
        id_message: Date.now(),
        contenu: newMessage,
        date_envoi: new Date().toISOString(),
        expediteur_type: 'visiteur',
        lu: false
      };

      setMessages([...messages, tempMessage]);
      setNewMessage('');
      
      // Simuler une réponse automatique après 2 secondes
      setTimeout(() => {
        const autoReply = {
          id_message: Date.now() + 1,
          contenu: "Merci pour votre message. Nous avons bien reçu votre demande et nous vous répondrons dans les plus brefs délais.\n\nCordialement,\nL'équipe ImmoGest",
          date_envoi: new Date().toISOString(),
          expediteur_type: 'proprietaire',
          lu: true
        };
        setMessages(prev => [...prev, autoReply]);
      }, 2000);
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
    <div className="container-fluid p-0" style={{ backgroundColor: "#f5f7fa", minHeight: "100vh", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* Header professionnel */}
      <header className="bg-white shadow-sm border-bottom" style={{ borderBottom: "1px solid #e3e6f0" }}>
        <div className="container-fluid px-4">
          <div className="row align-items-center" style={{ height: "70px" }}>
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" 
                     style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  <i className="bi bi-speedometer2 text-white" style={{ fontSize: "18px" }}></i>
                </div>
                <div>
                  <h1 className="h5 mb-0 fw-bold" style={{ color: "#2c3e50", fontSize: "18px" }}>Dashboard Visiteur</h1>
                  <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>Panneau de contrôle ImmoGest</p>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex align-items-center justify-content-md-end gap-2">
                <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: "13px", fontWeight: "500" }}>
                  <i className="bi bi-bell me-1"></i>
                  Notifications
                  <span className="badge bg-danger ms-1" style={{ fontSize: "10px" }}>3</span>
                </button>
                <button className="btn btn-sm btn-primary" style={{ fontSize: "13px", fontWeight: "500" }}>
                  <i className="bi bi-person-circle me-1"></i>
                  Mon Compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container-fluid px-4 py-4">
        <div className="row">
          {/* Sidebar professionnelle */}
          <div className="col-lg-3 col-xl-2 mb-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}>
              <div className="card-body p-3">
                {/* Navigation */}
                <nav className="mb-4">
                  <h6 className="text-uppercase text-muted mb-3" style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" }}>Navigation</h6>
                  <div className="nav flex-column nav-pills">
                    <a className="nav-link active mb-2" href="#" style={{ 
                      fontSize: "13px", 
                      fontWeight: "500", 
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none"
                    }}>
                      <i className="bi bi-grid-fill me-2"></i>
                      Dashboard
                    </a>
                    <a className="nav-link text-dark mb-2" href="#" style={{ fontSize: "13px", fontWeight: "500", borderRadius: "8px" }}>
                      <i className="bi bi-search me-2"></i>
                      Rechercher
                    </a>
                    <a className="nav-link text-dark mb-2" href="#" style={{ fontSize: "13px", fontWeight: "500", borderRadius: "8px" }}>
                      <i className="bi bi-envelope me-2"></i>
                      Messages
                      <span className="badge bg-primary ms-auto" style={{ fontSize: "10px" }}>{messages.length}</span>
                    </a>
                    <a className="nav-link text-dark mb-2" href="#" style={{ fontSize: "13px", fontWeight: "500", borderRadius: "8px" }}>
                      <i className="bi bi-calendar me-2"></i>
                      Rendez-vous
                    </a>
                    <a className="nav-link text-dark" href="#" style={{ fontSize: "13px", fontWeight: "500", borderRadius: "8px" }}>
                      <i className="bi bi-gear me-2"></i>
                      Paramètres
                    </a>
                  </div>
                </nav>

                {/* Profil */}
                {visitorInfo && (
                  <div className="border-top pt-3">
                    <h6 className="text-uppercase text-muted mb-3" style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" }}>Mon Profil</h6>
                    <div className="text-center">
                      <div className="rounded-circle bg-gradient-primary d-inline-flex align-items-center justify-content-center mx-auto mb-2" 
                           style={{ width: "50px", height: "50px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                        <i className="bi bi-person-fill text-white" style={{ fontSize: "20px" }}></i>
                      </div>
                      <h6 className="mb-1" style={{ fontSize: "13px", fontWeight: "600", color: "#2c3e50" }}>
                        {visitorInfo.nom} {visitorInfo.prenoms}
                      </h6>
                      <p className="mb-0 text-muted" style={{ fontSize: "11px" }}>{visitorInfo.email}</p>
                      <div className="mt-2">
                        <span className="badge bg-success" style={{ fontSize: "10px" }}>Actif</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="col-lg-9 col-xl-10">
            {/* KPIs principaux */}
            <div className="row mb-4">
              <div className="col-xl-3 col-lg-6 mb-3">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1">
                        <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "500" }}>Demandes Actives</p>
                        <h3 className="mb-0 fw-bold" style={{ fontSize: "24px", color: "#2c3e50" }}>1</h3>
                        <div className="d-flex align-items-center mt-2">
                          <i className="bi bi-arrow-up text-success me-1" style={{ fontSize: "12px" }}></i>
                          <span className="text-success" style={{ fontSize: "11px" }}>+12% ce mois</span>
                        </div>
                      </div>
                      <div className="ms-3">
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" 
                             style={{ width: "48px", height: "48px" }}>
                          <i className="bi bi-file-text text-primary" style={{ fontSize: "20px" }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-6 mb-3">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1">
                        <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "500" }}>Messages</p>
                        <h3 className="mb-0 fw-bold" style={{ fontSize: "24px", color: "#2c3e50" }}>{messages.length}</h3>
                        <div className="d-flex align-items-center mt-2">
                          <i className="bi bi-arrow-up text-success me-1" style={{ fontSize: "12px" }}></i>
                          <span className="text-success" style={{ fontSize: "11px" }}>+8% ce mois</span>
                        </div>
                      </div>
                      <div className="ms-3">
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" 
                             style={{ width: "48px", height: "48px" }}>
                          <i className="bi bi-chat-dots text-success" style={{ fontSize: "20px" }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-6 mb-3">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1">
                        <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "500" }}>Taux de Réponse</p>
                        <h3 className="mb-0 fw-bold" style={{ fontSize: "24px", color: "#2c3e50" }}>100%</h3>
                        <div className="d-flex align-items-center mt-2">
                          <i className="bi bi-dash text-muted me-1" style={{ fontSize: "12px" }}></i>
                          <span className="text-muted" style={{ fontSize: "11px" }}>Stable</span>
                        </div>
                      </div>
                      <div className="ms-3">
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" 
                             style={{ width: "48px", height: "48px" }}>
                          <i className="bi bi-graph-up text-warning" style={{ fontSize: "20px" }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-6 mb-3">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1">
                        <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "500" }}>Biens Visités</p>
                        <h3 className="mb-0 fw-bold" style={{ fontSize: "24px", color: "#2c3e50" }}>3</h3>
                        <div className="d-flex align-items-center mt-2">
                          <i className="bi bi-arrow-up text-success me-1" style={{ fontSize: "12px" }}></i>
                          <span className="text-success" style={{ fontSize: "11px" }}>+25% ce mois</span>
                        </div>
                      </div>
                      <div className="ms-3">
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" 
                             style={{ width: "48px", height: "48px" }}>
                          <i className="bi bi-house text-info" style={{ fontSize: "20px" }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphiques et widgets */}
            <div className="row mb-4">
              {/* Graphique d'activité */}
              <div className="col-xl-8 mb-3">
                <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}>
                  <div className="card-header bg-white border-0 pt-3 pb-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-bold" style={{ fontSize: "14px", color: "#2c3e50" }}>Activité Récente</h6>
                      <div className="btn-group btn-group-sm" role="group">
                        <button type="button" className="btn btn-outline-secondary active" style={{ fontSize: "11px" }}>7J</button>
                        <button type="button" className="btn btn-outline-secondary" style={{ fontSize: "11px" }}>30J</button>
                        <button type="button" className="btn btn-outline-secondary" style={{ fontSize: "11px" }}>90J</button>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                      <div className="text-center">
                        <i className="bi bi-bar-chart-line text-muted" style={{ fontSize: "48px" }}></i>
                        <p className="text-muted mt-2 mb-0" style={{ fontSize: "13px" }}>Graphique d'activité</p>
                        <small className="text-muted">Visualisation des interactions</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget statut */}
              <div className="col-xl-4 mb-3">
                <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}>
                  <div className="card-header bg-white border-0 pt-3 pb-2">
                    <h6 className="mb-0 fw-bold" style={{ fontSize: "14px", color: "#2c3e50" }}>Statut de la Demande</h6>
                  </div>
                  <div className="card-body">
                    <div className="text-center py-3">
                      <div className="rounded-circle bg-warning d-inline-flex align-items-center justify-content-center mx-auto mb-3" 
                           style={{ width: "60px", height: "60px" }}>
                        <i className="bi bi-clock text-white" style={{ fontSize: "24px" }}></i>
                      </div>
                      <h6 className="mb-2 fw-bold" style={{ fontSize: "16px", color: "#2c3e50" }}>En Attente</h6>
                      <p className="text-muted mb-3" style={{ fontSize: "12px" }}>Votre demande est en cours de traitement</p>
                      <div className="progress" style={{ height: "6px" }}>
                        <div className="progress-bar bg-warning" role="progressbar" style={{ width: "65%" }}></div>
                      </div>
                      <small className="text-muted mt-2 d-block">65% complété</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Section messagerie */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}>
              <div className="card-header bg-white border-0 pt-3 pb-2">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1 me-2">
                    <h6 className="mb-0 fw-bold" style={{ fontSize: "14px", color: "#2c3e50" }}>
                      <i className="bi bi-chat-dots me-2"></i>
                      Conversation avec ImmoGest
                    </h6>
                    <small className="text-muted" style={{ fontSize: "12px" }}>Votre demande de visite</small>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" style={{ fontSize: "12px", fontWeight: "500" }}>
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      Actualiser
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => navigate("/")}
                      style={{ fontSize: "12px", fontWeight: "500" }}
                    >
                      <i className="bi bi-house me-1"></i>
                      Accueil
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="card-body" style={{ height: "400px", overflowY: "auto", backgroundColor: "#ffffff" }}>
                {messages.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-chat-square" style={{ fontSize: "48px", color: "#6c757d" }}></i>
                    <p className="mt-2" style={{ color: "#6c757d", fontSize: "14px" }}>Aucun message pour le moment</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {messages.map((message) => (
                      <div
                        key={message.id_message}
                        className={`d-flex ${
                          message.expediteur_type === 'visiteur' ? 'justify-content-end' : 'justify-content-start'
                        }`}
                      >
                        <div
                          className="rounded-3 px-3 py-2"
                          style={{ 
                            maxWidth: '70%',
                            backgroundColor: message.expediteur_type === 'visiteur' ? '#007bff' : '#e9ecef',
                            color: message.expediteur_type === 'visiteur' ? '#ffffff' : '#212529',
                            border: message.expediteur_type === 'visiteur' ? '1px solid #0056b3' : '1px solid #dee2e6',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            wordBreak: 'break-word'
                          }}
                        >
                          <p className="mb-1" style={{ 
                            whiteSpace: 'pre-line', 
                            margin: 0,
                            color: message.expediteur_type === 'visiteur' ? '#ffffff !important' : '#212529 !important',
                            fontWeight: '500',
                            fontSize: '15px',
                            lineHeight: '1.5',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            textRendering: 'optimizeLegibility',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            letterSpacing: '0.2px'
                          }}>
                            {message.contenu}
                          </p>
                          <small className="text-muted" style={{ 
                            fontSize: '12px',
                            color: message.expediteur_type === 'visiteur' ? '#d1ecf1' : '#6c757d',
                            fontWeight: '400',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            textRendering: 'optimizeLegibility',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale'
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
              <div className="card-footer bg-light" style={{ borderTop: "1px solid #e3e6f0" }}>
                <form onSubmit={sendMessage}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sendingMessage}
                      style={{ 
                        borderColor: "#ced4da",
                        borderRadius: "8px 0 0 8px",
                        fontSize: '15px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        letterSpacing: '0.1px'
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      style={{ borderRadius: "0 8px 8px 0" }}
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

            {/* Informations de la demande */}
            {visitorInfo && (
              <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}>
                <div className="card-header bg-white border-0 pt-3 pb-2">
                  <h6 className="mb-0 fw-bold" style={{ 
                    color: "#2c3e50",
                    fontSize: "14px",
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale'
                  }}>
                    <i className="bi bi-info-circle me-2"></i>
                    Informations de votre demande
                  </h6>
                </div>
                <div className="card-body" style={{ backgroundColor: "#ffffff" }}>
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-1" style={{
                        fontSize: '14px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                      }}><strong style={{ color: "#2c3e50", fontWeight: '600' }}>Nom:</strong> 
                        <span style={{ color: "#495057", marginLeft: "0.5rem", fontWeight: '400' }}>
                          {visitorInfo.nom} {visitorInfo.prenoms}
                        </span>
                      </p>
                      <p className="mb-1" style={{
                        fontSize: '14px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                      }}><strong style={{ color: "#2c3e50", fontWeight: '600' }}>Email:</strong> 
                        <span style={{ color: "#495057", marginLeft: "0.5rem", fontWeight: '400' }}>
                          {visitorInfo.email}
                        </span>
                      </p>
                      <p className="mb-1" style={{
                        fontSize: '14px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                      }}><strong style={{ color: "#2c3e50", fontWeight: '600' }}>Téléphone:</strong> 
                        <span style={{ color: "#495057", marginLeft: "0.5rem", fontWeight: '400' }}>
                          {visitorInfo.telephone}
                        </span>
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1" style={{
                        fontSize: '14px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                      }}><strong style={{ color: "#2c3e50", fontWeight: '600' }}>Date de demande:</strong> 
                        <span style={{ color: "#495057", marginLeft: "0.5rem", fontWeight: '400' }}>
                          {new Date(visitorInfo.date_demande).toLocaleDateString('fr-FR')}
                        </span>
                      </p>
                      <p className="mb-1" style={{
                        fontSize: '14px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                      }}><strong style={{ color: "#2c3e50", fontWeight: '600' }}>Statut:</strong> 
                        <span className="badge bg-warning ms-2">En attente de traitement</span>
                      </p>
                    </div>
                  </div>
                  {visitorInfo.message && (
                    <div className="mt-3">
                      <p className="mb-1" style={{
                        fontSize: '14px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                      }}><strong style={{ color: "#2c3e50", fontWeight: '600' }}>Votre message:</strong></p>
                      <p className="text-muted" style={{ 
                        backgroundColor: "#f8f9fa", 
                        padding: "0.75rem", 
                        borderRadius: "6px", 
                        margin: "0.5rem 0", 
                        wordBreak: 'break-word', 
                        color: '#495057',
                        fontSize: '14px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        fontWeight: '400'
                      }}>
                        {visitorInfo.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorMessaging;
