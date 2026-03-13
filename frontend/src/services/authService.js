// src/services/authService.js
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Helper pour construire les headers avec token
export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * INSCRIPTION (propriétaire ou locataire)
 * payload doit suivre exactement la doc :
 * - nom, prenoms, email, telephone, mot_de_passe, type_utilisateur, (adresse_fiscale si proprietaire)
 */
export async function registerUser(payload) {
  const res = await axios.post(`${API_BASE_URL}/auth/register`, payload);
  return res.data; // { message, token, user }
}

/**
 * CONNEXION simple (sans double compte)
 */
export async function login(email, mot_de_passe) {
  const res = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    mot_de_passe,
  });
  return res.data; // { message, token, user, ... } ou { confirmation_requise: true, ... }
}

/**
 * CONNEXION avec double compte (type_souhaite, confirmation)
 */
export async function loginWithType(email, mot_de_passe, type_souhaite, confirmation = false) {
  const res = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    mot_de_passe,
    type_souhaite,
    confirmation,
  });
  return res.data;
}

/**
 * PROFIL UTILISATEUR connecté
 */
export async function getProfile() {
  const res = await axios.get(`${API_BASE_URL}/auth/profile`, {
    headers: getAuthHeaders(),
  });
  return res.data; // { user: {...} }
}

/**
 * INVITER UN LOCATAIRE / DOUBLE COMPTE
 * (route protégée -> token requis)
 */
export async function inviterLocataire(payload) {
  const res = await axios.post(`${API_BASE_URL}/auth/inviter-locataire`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data; // { message, token_dev, type_invitation, note }
}

/**
 * CONFIRMER INVITATION
 */
export async function confirmerInvitation(token, mot_de_passe, telephone) {
  const res = await axios.post(`${API_BASE_URL}/auth/confirmer-invitation`, {
    token,
    mot_de_passe,
    telephone,
  });
  return res.data; // { message, token, user, double_compte }
}

/**
 * MOT DE PASSE OUBLIÉ
 */
export async function forgotPassword(email) {
  const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
  return res.data; // { message, reset_token_dev }
}

/**
 * RÉINITIALISER MOT DE PASSE
 */
export async function resetPassword(token, nouveau_mot_de_passe) {
  const res = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
    token,
    nouveau_mot_de_passe,
  });
  return res.data; // { message }
}
