import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import PublicSubmit from './pages/PublicSubmit';
import AdminDashboard from './pages/AdminDashboard';
import { ShieldAlert, BarChart } from 'lucide-react';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={28} color="var(--primary)" />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em' }}>CrisisDesk <span style={{ color: 'var(--primary)' }}>AI</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Report Emergency</Link>
          <Link to="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart size={18} /> Admin</Link>
        </div>
      </nav>
      
      <main className="container">
        <Routes>
          <Route path="/" element={<PublicSubmit />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
