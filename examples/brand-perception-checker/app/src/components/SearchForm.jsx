import React from 'react';

export function SearchForm({ brandName, setBrandName, loading, onAnalyze }) {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div className="badge-v1">V1.5.3 SNAPSHOT</div>
        <h1 className="gradient-text" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
          Brand Perception Checker
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          See how AI answers describe your brand — and how that compares to real-world market perception.
        </p>
      </div>

      <div className="search-container">
        <input 
          type="text" 
          placeholder="Brand name..." 
          className="search-input"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAnalyze()}
        />
        <button onClick={onAnalyze} className="btn-analyze" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </>
  );
}
