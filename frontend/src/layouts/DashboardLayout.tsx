
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Users, Package, ArrowRightLeft, FileText, LogOut } from 'lucide-react';

const DashboardLayout = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ margin: 0, color: 'var(--color-brand-main)' }}>KAARYA</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Operations Portal</span>
        </div>
        
        <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <Link to="/" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/customers" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <Users size={18} /> Customers
          </Link>
          <Link to="/products" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <Package size={18} /> Products
          </Link>
          <Link to="/inventory" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <ArrowRightLeft size={18} /> Inventory
          </Link>
          <Link to="/challans" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <FileText size={18} /> Challans
          </Link>
        </nav>
        
        <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <div>{user.name}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{user.role}</div>
          </div>
          <button onClick={logout} className="btn btn-danger" style={{ width: '100%' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div style={{ fontWeight: 500 }}>KAARYA | Connected Business Operations</div>
          <div className="glass-panel" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', borderRadius: 'var(--radius-full)' }}>
            Status: Active
          </div>
        </header>
        
        <div className="page-content animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
