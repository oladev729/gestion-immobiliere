import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import '../../styles/design-system.css';
import RevenueChart from '../../components/RevenueChart';
import MonthlyPerformanceChart from '../../components/MonthlyPerformanceChart';
import OwnerTenantRelationChart from '../../components/OwnerTenantRelationChart';

const OwnerDashboardModern = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    revenueChange: 0,
    orders: 0,
    ordersChange: 0,
    properties: 0,
    contracts: 0,
    maintenance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simuler des données pour le dashboard
      setStats({
        revenue: 7852000,
        revenueChange: 2.1,
        orders: 1000,
        ordersChange: -2.1,
        properties: 1000,
        contracts: 1000,

      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

const StatCard = ({ title, value, change, color = 'blue', isCurrency = false }) => {
    const isPositive = change > 0;
    const changeColor = isPositive ? 'green' : 'red';

    const colorClasses = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      orange: '#f59e0b'
    };

    return (
      <div className="stat-card animate-fade-in">
        <div className="stat-header">
          <div className="stat-label-box" style={{ backgroundColor: colorClasses[color], color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>
            {title.toUpperCase()}
          </div>
          <div className="stat-change" style={{ color: `var(--${changeColor}-500)` }}>
            {isPositive ? '+' : '-'} {Math.abs(change)}%
          </div>
        </div>
        <div className="stat-value">
          {isCurrency ? value.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
          }) : value.toLocaleString('fr-FR')}
        </div>
        <div className="stat-title">{title}</div>
      </div>
    );
  };

  const ChartCard = ({ title, children }) => (
    <div className="chart-card animate-fade-in">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );

  const SimpleBarChart = ({ data }) => (
    <div className="bar-chart">
      <div className="chart-bars">
        {data.map((item, index) => (
          <div key={index} className="bar-group">
            <div className="bar-container">
              <div
                className="bar current"
                style={{ height: `${item.current}%` }}
              />
              <div
                className="bar previous"
                style={{ height: `${item.previous}%` }}
              />
            </div>
            <div className="bar-label">{item.label}</div>
          </div>
        ))}
      </div>

    </div>
  );

  const DonutChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <div className="donut-chart">
        <div className="donut-container">
          <svg viewBox="0 0 100 100" className="donut-svg">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;

              const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
              const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);

              const largeArc = angle > 180 ? 1 : 0;

              currentAngle = endAngle;

              return (
                <path
                  key={index}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={item.color}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
          <div className="donut-center">
            <div className="donut-total">{total}</div>
            <div className="donut-label">Contrats</div>
          </div>
        </div>
        <div className="donut-legend">
          {data.map((item, index) => (
            <div key={index} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: item.color }} />
              <div className="legend-text">
                <div className="legend-label">{item.label}</div>
                <div className="legend-value">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const RatingCircles = ({ ratings }) => (
    <div className="rating-circles">
      {ratings.map((rating, index) => (
        <div key={index} className="rating-circle">
          <div className="circle-progress">
            <svg viewBox="0 0 100 100" className="progress-svg">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={rating.color}
                strokeWidth="8"
                strokeDasharray={`${(rating.value / 100) * 251.2} 251.2`}
                strokeDashoffset="62.8"
                transform="rotate(-90 50 50)"
                className="progress-circle"
              />
            </svg>
            <div className="progress-text">
              <div className="progress-value">{rating.value}%</div>
            </div>
          </div>
          <div className="rating-label">{rating.label}</div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  const barChartData = [
    { label: '1', current: 75, previous: 60 },
    { label: '2', current: 85, previous: 70 },
    { label: '3', current: 65, previous: 80 },
    { label: '4', current: 90, previous: 65 },
    { label: '5', current: 70, previous: 75 },
    { label: '6', current: 80, previous: 85 },
  ];

  const donutChartData = [
    { label: 'Revenus', value: 7852000, color: '#3b82f6' },
    { label: 'Biens', value: 1456, color: '#10b981' },
    { label: 'Contrat', value: 892, color: '#f59e0b' },
  ];

  const mostOrdered = [
    { name: 'Villa', price: 45000 },
    { name: 'Appartement', price: 75000 },
    { name: 'Studio', price: 45000 },
    { name: 'Maison', price: 45000 },
  ];

  const RelationIllustration = () => (
    <div className="relation-illustration">
      <div className="relation-entity">
        <div className="entity-icon owner">P</div>
        <div className="entity-label">Propriétaire</div>
      </div>
      <div className="relation-link">
        <div className="link-item up">
          <span className="link-text">Gestion</span>
        </div>
        <div className="link-icon">Bail</div>
        <div className="link-item down">
          <span className="link-text">Paiement</span>
        </div>
      </div>
      <div className="relation-entity">
        <div className="entity-icon tenant">L</div>
        <div className="entity-label">Locataire</div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-modern">
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="Revenus"
          value={stats.revenue}
          change={stats.revenueChange}
          color="green"
          isCurrency={true}
        />
        <StatCard
          title="Contrats"
          value={stats.orders}
          change={stats.ordersChange}
          color="blue"
        />
        <StatCard
          title="Biens"
          value={stats.properties}
          change={0}
          color="purple"
        />

      </div>

      {/* Content Row */}
      <div className="bottom-row">
        <ChartCard title="Répartition des Revenus">
          <RevenueChart />
        </ChartCard>

        <ChartCard title="Performance Mensuelle">
          <MonthlyPerformanceChart />
        </ChartCard>

        <ChartCard title="Les Biens les plus Loués">
          <div className="ordered-list">
            {mostOrdered.map((item, index) => (
              <div key={index} className="ordered-item">
                <div className="ordered-info">
                  <div className="ordered-name">{item.name}</div>
                  <div className="ordered-price">
                    {item.price.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Relation Propriétaire-Locataire">
          <OwnerTenantRelationChart />
        </ChartCard>
      </div>

      <style>{`
        .dashboard-modern {
          padding: 0.75rem;
          max-width: 1600px;
          margin: 0 auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .stat-card {
          background: white;
          border-radius: 0.5rem;
          padding: 0.75rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          border: 1px solid #e5e7eb;
          transition: all 250ms ease-in-out;
        }

        .stat-card:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          transform: translateY(-2px);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .stat-change {
          font-size: 0.65rem;
          font-weight: 600;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.25rem;
          line-height: 1.1;
        }

        .stat-title {
          font-size: 0.7rem;
          color: #6b7280;
          font-weight: 500;
        }

        .charts-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .bottom-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .chart-card {
          background: white;
          border-radius: 0.5rem;
          padding: 0.75rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          border: 1px solid #e5e7eb;
        }

        .chart-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.75rem;
        }

        .bar-chart {
          height: 200px;
        }

        .chart-bars {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 150px;
          margin-bottom: 1rem;
        }

        .bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .bar-container {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          height: 100%;
          width: 30px;
        }

        .bar {
          width: 12px;
          border-radius: 2px 2px 0 0;
          transition: height 500ms ease-in-out;
        }

        .bar.current {
          background: #3b82f6;
        }

        .bar.previous {
          background: #93c5fd;
        }

        .bar-label {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .donut-chart {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .donut-container {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .donut-svg {
          width: 100%;
          height: 100%;
        }

        .donut-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .donut-total {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }

        .donut-label {
          font-size: 0.625rem;
          color: #6b7280;
        }

        .donut-legend {
          margin-top: 1rem;
          width: 100%;
        }

        .donut-legend .legend-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.25rem 0;
        }

        .legend-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .legend-label {
          font-size: 0.75rem;
          color: #374151;
        }

        .legend-value {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1f2937;
        }

        .rating-circles {
          display: flex;
          justify-content: space-around;
          gap: 1rem;
        }

        .rating-circle {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .circle-progress {
          position: relative;
          width: 80px;
          height: 80px;
          margin-bottom: 0.5rem;
        }

        .progress-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .progress-circle {
          transition: stroke-dasharray 1s ease-in-out;
        }

        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .progress-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
        }

        .rating-label {
          font-size: 0.75rem;
          color: #6b7280;
          max-width: 60px;
        }

        .ordered-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .ordered-item {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          transition: background 200ms ease-in-out;
        }

        .ordered-item:hover {
          background: #f3f4f6;
        }

        .ordered-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .ordered-name {
          font-size: 0.875rem;
          color: #374151;
          font-weight: 500;
        }

        .ordered-price {
          font-size: 0.875rem;
          color: #1f2937;
          font-weight: 600;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-radius: 50%;
          border-top-color: #3b82f6;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 350ms ease-out;
        }

        .relation-illustration {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 0.5rem;
          margin-top: 0.5rem;
        }

        .relation-entity {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .entity-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .entity-icon.owner { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .entity-icon.tenant { background: linear-gradient(135deg, #10b981, #059669); }

        .entity-label {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.7rem;
        }

        .relation-link {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0 1rem;
        }

        .link-icon {
          font-size: 2.5rem;
          margin: 1rem 0;
          z-index: 10;
        }

        .link-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 500;
          position: relative;
        }

        .link-item.up { color: #3b82f6; }
        .link-item.down { color: #10b981; }

        .link-text {
          background: white;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }

        .link-arrow {
          font-size: 1.25rem;
          font-weight: bold;
        }

        @media (max-width: 1024px) {
          .charts-row {
            grid-template-columns: 1fr;
          }
          
          .bottom-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-modern {
            padding: 1rem;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .rating-circles {
            flex-direction: column;
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default OwnerDashboardModern;
