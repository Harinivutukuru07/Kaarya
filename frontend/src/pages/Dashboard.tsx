import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard Overview</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Customers</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-brand-main)' }}>248</div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Products</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-info)' }}>84</div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Low Stock Items</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>7</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Draft Challans</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>12</div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Confirmed Challans</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>36</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
