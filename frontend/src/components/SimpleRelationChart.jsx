import React, { useState, useEffect } from 'react';

const SimpleRelationChart = () => {
  const [data, setData] = useState({
    totalProperties: 12,
    occupiedProperties: 10,
    totalTenants: 10,
    activeContracts: 10
  });

  useEffect(() => {
    // Récupérer les vraies données depuis l'API
    // api.get('/dashboard/relation').then(res => setData(res.data));
  }, []);

  return (
    <div style={{ 
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
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
          Relation Propriétaire-Locataire
        </h3>
        <div style={{
          background: '#ecfdf5',
          color: '#065f46',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          Taux d'occupation: {Math.round((data.occupiedProperties / data.totalProperties) * 100)}%
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
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: '0 auto 0.5rem',
            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
          }}>
            👤
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
            Propriétaire
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            {data.totalProperties} biens
          </div>
        </div>

        {/* Flèches de connexion */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '60px',
            height: '2px',
            background: 'linear-gradient(90deg, #3b82f6, #10b981)',
            margin: '0.5rem 0'
          }}></div>
          <div style={{
            padding: '0.25rem 0.5rem',
            background: '#f3f4f6',
            borderRadius: '4px',
            fontSize: '0.625rem',
            color: '#374151',
            textAlign: 'center'
          }}>
            BAIL
          </div>
          <div style={{
            width: '60px',
            height: '2px',
            background: 'linear-gradient(90deg, #10b981, #f59e0b)',
            margin: '0.5rem 0'
          }}></div>
          <div style={{
            padding: '0.25rem 0.5rem',
            background: '#f3f4f6',
            borderRadius: '4px',
            fontSize: '0.625rem',
            color: '#374151',
            textAlign: 'center'
          }}>
            PAIEMENT
          </div>
        </div>

        {/* Locataire */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: '0 auto 0.5rem',
            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
          }}>
            👥
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
            Locataires
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            {data.totalTenants} actifs
          </div>
        </div>
      </div>

      {/* Statistiques simples */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '1rem' 
      }}>
        <div style={{
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Contrats actifs
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
            {data.activeContracts}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Biens occupés
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
            {data.occupiedProperties}/{data.totalProperties}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleRelationChart;
