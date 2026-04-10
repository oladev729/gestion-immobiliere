import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import '../../styles/design-system.css';

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
        orders: 2568,
        ordersChange: -2.1,
        properties: 12,
        contracts: 8,
        maintenance: 3
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon, color = 'blue' }) => {
    const isPositive = change > 0;
    const changeColor = isPositive ? 'green' : 'red';
    
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };

    return (
      <div className="stat-card animate-fade-in">
        <div className="stat-header">
          <div className="stat-icon" style={{
            background: `linear-gradient(135deg, ${colorClasses[color].replace('from-', '#').replace(' to-', ', #')})`
          }}>
            <span className="icon-text">{icon}</span>
          </div>
          <div className="stat-change" style={{ color: `var(--${changeColor}-500)` }}>
            {isPositive ? '↑' : '↓'} {Math.abs(change)}% vs semaine dernière
          </div>
        </div>
        <div className="stat-value">
          {value.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
          })}
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
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color current" />
          <span>6 derniers jours</span>
        </div>
        <div className="legend-item">
          <div className="legend-color previous" />
          <span>Semaine dernière</span>
        </div>
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
            <div className="donut-label">Commandes</div>
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
    { label: 'Après-midi', value: 1890, color: '#3b82f6' },
    { label: 'Soir', value: 1456, color: '#10b981' },
    { label: 'Matin', value: 892, color: '#f59e0b' },
  ];

  const ratingsData = [
    { label: 'Hygiène', value: 85, color: '#3b82f6' },
    { label: 'Goût', value: 85, color: '#10b981' },
    { label: 'Emballage', value: 92, color: '#f59e0b' },
  ];

  const mostOrdered = [
    { name: 'Fresh Salad Bowl', price: 45000 },
    { name: 'Chicken Noodles', price: 75000 },
    { name: 'Smoothie Fruits', price: 45000 },
    { name: 'Hot Chicken Wings', price: 45000 },
  ];

  return (
    <div className="dashboard-modern">
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard 
          title="Revenus" 
          value={stats.revenue} 
          change={stats.revenueChange}
          icon="💰"
          color="green"
        />
        <StatCard 
          title="Commandes" 
          value={stats.orders} 
          change={stats.ordersChange}
          icon="📦"
          color="blue"
        />
        <StatCard 
          title="Biens" 
          value={stats.properties} 
          change={0}
          icon="🏢"
          color="purple"
        />
        <StatCard 
          title="Maintenance" 
          value={stats.maintenance} 
          change={0}
          icon="🔧"
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <ChartCard title="Revenus - 1 au 12 Décembre 2020">
          <SimpleBarChart data={barChartData} />
        </ChartCard>
        
        <ChartCard title="Temps de Commande">
          <DonutChart data={donutChartData} />
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        <ChartCard title="Votre Note">
          <RatingCircles ratings={ratingsData} />
        </ChartCard>
        
        <ChartCard title="Plats les Plus Commandés">
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
      </div>

      <style jsx>{`
        .dashboard-modern {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
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
          margin-bottom: 1rem;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .stat-change {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .stat-title {
          font-size: 0.875rem;
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
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
          border: 1px solid #e5e7eb;
        }

        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1.5rem;
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
