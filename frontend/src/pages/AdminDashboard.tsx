import { useState, useEffect } from 'react';
import { Lock, RefreshCw, Activity, AlertOctagon, CheckSquare } from 'lucide-react';

export default function AdminDashboard() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('adminKey') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const authenticate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiKey) return;
    
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${apiUrl}/reports/stats/summary`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminKey', apiKey);
        const data = await res.json();
        setStats(data);
        fetchReports();
      } else {
        alert("Invalid API Key");
        setIsAuthenticated(false);
        localStorage.removeItem('adminKey');
      }
    } catch (err) {
      console.error(err);
      alert("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${apiUrl}/reports`);
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await fetch(`${apiUrl}/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchReports();
      authenticate(); // refresh stats
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-auth if key exists in storage on load
  useEffect(() => {
    if (apiKey && !isAuthenticated) {
      authenticate();
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }} className="animate-fade-in">
        <div style={{ background: 'var(--surface-color)', padding: '3rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
          <Lock size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '1.5rem' }}>Admin Access</h2>
          <form onSubmit={authenticate}>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter Admin API Key" 
              value={apiKey} 
              onChange={e => setApiKey(e.target.value)} 
            />
            <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Command Center</h2>
        <button onClick={() => { fetchReports(); authenticate(); }} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={16}/> Total Reports</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalReports}</div>
          </div>
          <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--critical)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertOctagon size={16} color="var(--critical)"/> Critical Active</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.criticalReports}</div>
          </div>
          <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--low)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckSquare size={16} color="var(--low)"/> Resolved</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.resolvedReports}</div>
          </div>
        </div>
      )}

      <div className="glass" style={{ padding: '2rem', overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Recent Incidents</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Location</th>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>Urgency</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report: any) => (
              <tr key={report.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>{report.id.split('-')[0]}...</td>
                <td style={{ padding: '1rem' }}>{report.location}</td>
                <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{report.category}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: `var(--${report.urgency})`, 
                    color: 'white' 
                  }}>
                    {report.urgency}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <select 
                    value={report.status}
                    onChange={(e) => updateStatus(report.id, e.target.value)}
                    style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      color: 'var(--text-primary)', 
                      border: '1px solid var(--border-color)', 
                      padding: '0.5rem', 
                      borderRadius: '0.25rem' 
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="assigned">Assigned</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => alert(report.summary)}>View AI Summary</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reports.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No reports found.</p>}
      </div>
    </div>
  );
}
