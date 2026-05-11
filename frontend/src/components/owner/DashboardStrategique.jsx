import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ProgressBar, Alert } from 'react-bootstrap';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import api from '../services/api';

const DashboardStrategique = () => {
  const [stats, setStats] = useState({
    tauxOccupation: 0,
    revenusMensuels: 0,
    impayesCount: 0,
    totalBiens: 0,
    totalLocataires: 0,
    performanceMensuelle: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/strategique');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Configuration des graphiques
  const occupationData = {
    labels: ['Occupés', 'Disponibles'],
    datasets: [{
      data: [stats.tauxOccupation, 100 - stats.tauxOccupation],
      backgroundColor: ['#28a745', '#dc3545'],
      borderWidth: 0
    }]
  };

  const revenusData = {
    labels: stats.performanceMensuelle.map(p => p.mois),
    datasets: [{
      label: 'Revenus Mensuels',
      data: stats.performanceMensuelle.map(p => p.revenus),
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      tension: 0.4
    }]
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="dashboard-strategique p-4">
      <h2 className="mb-4">📊 Tableau de Bord Stratégique</h2>
      
      {/* KPIs Principaux */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{stats.tauxOccupation}%</h3>
              <p>Taux d'Occupation</p>
              <ProgressBar now={stats.tauxOccupation} variant="success" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{stats.revenusMensuels.toLocaleString()} FCFA</h3>
              <p>Revenus Mensuels</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-danger">{stats.impayesCount}</h3>
              <p>Impayés</p>
              {stats.impayesCount > 0 && (
                <Alert variant="danger" className="mt-2">
                  Action requise
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3>{stats.totalBiens}</h3>
              <p>Total Biens</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Graphiques */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>Taux d'Occupation</Card.Header>
            <Card.Body>
              <Doughnut data={occupationData} options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>Performance Mensuelle</Card.Header>
            <Card.Body>
              <Line data={revenusData} options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return value.toLocaleString() + ' FCFA';
                      }
                    }
                  }
                }
              }} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardStrategique;
