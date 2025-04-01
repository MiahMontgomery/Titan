import React, { useState } from 'react';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Titan - AI Project Management</h1>
        <p>Client-side build for Vercel deployment</p>
      </header>
      <main className="app-content">
        <div className="connection-status">
          <h2>Status: {loading ? 'Connecting...' : 'Ready'}</h2>
        </div>
        <div className="info-panel">
          <h3>Vercel Deployment</h3>
          <p>This is the client-side application for Titan AI Project Management System.</p>
          <p>The full application requires both the client (deployed on Vercel) and the server component (deployed separately).</p>
        </div>
      </main>
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Titan AI Project Management</p>
      </footer>
    </div>
  );
};

export default App;