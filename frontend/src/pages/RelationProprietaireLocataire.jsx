import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const RelationProprietaireLocataire = () => {
  const [relationData, setRelationData] = useState({
    totalProperties: 0,
    occupiedProperties: 0,
    totalTenants: 0,
    activeContracts: 0,
    pendingRent: 0,
    averageRentDuration: 0
  });

  useEffect(() => {
    fetchRelationData();
  }, []);

  const fetchRelationData = async () => {
    try {
      // Simuler des données - à remplacer avec vraies API
      setRelationData({
        totalProperties: 12,
        occupiedProperties: 10,
        totalTenants: 10,
        activeContracts: 10,
        pendingRent: 2,
        averageRentDuration: 18 // mois
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des données de relation:', error);
    }
  };

  const occupancyRate = relationData.totalProperties > 0 
    ? Math.round((relationData.occupiedProperties / relationData.totalProperties) * 100)
    : 0;

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
              🏠
            </div>
            <div>
              <h1 style={{ 
                margin: '0', 
                fontSize: '1.5rem', 
                fontWeight: '700',
                color: '#1f2937'
              }}>
                Relation Propriétaire-Locataire
              </h1>
              <p style={{ 
                margin: '0', 
                fontSize: '0.875rem', 
                color: '#6b7280',
                marginTop: '0.25rem'
              }}>
                Vue d'ensemble de votre portefeuille et relations locatives
              </p>
            </div>
          </div>
        </div>

        {/* Carte principale de relation */}
        <div style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
        }}>
          {/* Header avec taux d'occupation */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: '#111827',
              margin: 0
            }}>
              Vue Relationnelle
            </h3>
            <div style={{
              background: occupancyRate >= 80 ? '#ecfdf5' : occupancyRate >= 60 ? '#fffbeb' : '#fef2f2',
              color: occupancyRate >= 80 ? '#065f46' : occupancyRate >= 60 ? '#92400e' : '#991b1b',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              Taux d'occupation: {occupancyRate}%
            </div>
          </div>

          {/* Visualisation principale */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center',
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '8px'
          }}>
            {/* Propriétaire */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 auto 0.75rem',
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
              }}>
                👤
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                Propriétaire
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {relationData.totalProperties} biens
              </div>
            </div>

            {/* Flèches de connexion */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '80px',
                height: '3px',
                background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                margin: '0.75rem 0'
              }}></div>
              <div style={{
                padding: '0.5rem 0.75rem',
                background: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#374151',
                textAlign: 'center',
                fontWeight: '600'
              }}>
                BAIL
              </div>
              <div style={{
                width: '80px',
                height: '3px',
                background: 'linear-gradient(90deg, #10b981, #f59e0b)',
                margin: '0.75rem 0'
              }}></div>
              <div style={{
                padding: '0.5rem 0.75rem',
                background: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#374151',
                textAlign: 'center',
                fontWeight: '600'
              }}>
                PAIEMENT
              </div>
            </div>

            {/* Locataire */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 auto 0.75rem',
                boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
              }}>
                👥
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                Locataires
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {relationData.totalTenants} actifs
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            <div style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Contrats actifs
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                {relationData.activeContracts}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Loyers en attente
              </div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: relationData.pendingRent > 0 ? '#dc2626' : '#059669' 
              }}>
                {relationData.pendingRent}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Durée moyenne
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                {relationData.averageRentDuration}
                <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.25rem' }}>
                  mois
                </span>
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Biens occupés
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                {relationData.occupiedProperties}/{relationData.totalProperties}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: '#f9fafb', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
              Actions rapides
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                📊 Voir les contrats
              </button>
              <button style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                💰 Gérer les paiements
              </button>
              <button style={{
                padding: '0.5rem 1rem',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                🏠 Voir les biens
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationProprietaireLocataire;
