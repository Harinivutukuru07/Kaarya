
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ArrowRightLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StockMovement {
  id: string;
  quantity: number;
  type: 'IN' | 'OUT';
  reason: string;
  timestamp: string;
  product: { name: string; sku: string };
  user: { name: string };
}

const Inventory = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['stockMovements'],
    queryFn: async () => {
      const res = await api.get('/stock-movements');
      return res.data;
    }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Inventory Operations</h1>
        <button className="btn btn-primary">
          <ArrowRightLeft size={18} /> Adjust Stock
        </button>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Product</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Type</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Qty</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Reason</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>User</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No stock movements found</td></tr>
            ) : (
              data?.data?.map((m: StockMovement) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    {new Date(m.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>{m.product.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.product.sku}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)',
                      background: m.type === 'IN' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: m.type === 'IN' ? 'var(--color-success)' : 'var(--color-danger)'
                    }}>
                      {m.type === 'IN' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                      {m.type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{m.quantity}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{m.reason}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{m.user.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
