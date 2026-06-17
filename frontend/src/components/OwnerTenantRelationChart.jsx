import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const OwnerTenantRelationChart = ({ data }) => {
  const [relationData, setRelationData] = useState({
    totalProperties: 0,
    occupiedProperties: 0,
    totalTenants: 0
  });

  useEffect(() => {
    if (data) {
      setRelationData(data);
    }
  }, [data]);

  const occupancyRate = relationData.totalProperties > 0 
    ? Math.round((relationData.occupiedProperties / relationData.totalProperties) * 100)
    : 0;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-around', 
      alignItems: 'center',
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
          {relationData.totalProperties} biens
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
          {relationData.totalTenants} actifs
        </div>
      </div>

      {/* Taux d'occupation */}
      <div style={{
        background: occupancyRate >= 80 ? '#ecfdf5' : occupancyRate >= 60 ? '#fffbeb' : '#fef2f2',
        color: occupancyRate >= 80 ? '#065f46' : occupancyRate >= 60 ? '#92400e' : '#991b1b',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '0.875rem',
        fontWeight: '600'
      }}>
        Taux d'occupation: {occupancyRate}%
      </div>
    </div>
  );
};

export default OwnerTenantRelationChart;
