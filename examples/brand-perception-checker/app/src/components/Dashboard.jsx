import { motion } from 'framer-motion';
import { Globe, Fingerprint, Layout, CheckCircle, Shield, Activity } from 'lucide-react';

export function Dashboard({ report }) {
  if (!report) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid-3">
        <div className="glass-panel">
          <div className="card-title">
            AI Consensus
            <Fingerprint size={16} color="var(--accent-color)" />
          </div>
          <div className="card-value">{report.ai_perception?.consensus || 'Neutral'}</div>
          <div className="card-sub">Confidence: {report.ai_perception?.confidence || 'High'}</div>
        </div>
        <div className="glass-panel">
          <div className="card-title">
            Model Agreement
            <Layout size={16} color="var(--accent-color)" />
          </div>
          <div className="card-value">{report.ai_perception?.provider_disagreement === 'Low' ? 'High' : (report.ai_perception?.provider_disagreement === 'Medium' ? 'Medium' : 'Low')}</div>
          <div className="card-sub">Indicator across {report.ai_perception?.models?.length || 3} models</div>
        </div>
        <div className="glass-panel">
          <div className="card-title">
            Market Presence
            <Globe size={16} color="var(--accent-color)" />
          </div>
          <div className="card-value">{report.market_perception?.market_presence || 'Unknown'}</div>
          <div className="card-sub">Trend: {report.market_perception?.sentiment_trend || 'Neutral'}</div>
        </div>
      </div>

      <div className="glass-panel col-12 alignment-panel" style={{ marginBottom: '40px' }}>
        <CheckCircle size={20} color="var(--accent-color)" style={{ marginTop: '2px' }} />
        <div>
          <div className="alignment-title">
            AI vs Market Alignment: {report.alignment?.ai_vs_market || 'Aligned'}
          </div>
          <div className="alignment-desc">
            Comparing LLM intrinsic knowledge with current SERP snippets. 
            {report.alignment?.ai_vs_market === 'Aligned' 
              ? ' Your AI representation matches live web content.' 
              : ` Potential gap identified: ${report.alignment?.key_gap}`}
          </div>
        </div>
      </div>

      <div className="grid-bento">
        <div className="glass-panel col-8">
          <div className="section-header" style={{ marginTop: 0 }}>
            <Activity size={18} />
            AI Perception Analysis
          </div>
          <table>
            <thead>
              <tr>
                <th>AI Model</th>
                <th>Sentiment</th>
                <th>Positioning</th>
                <th>Core Values</th>
                <th>Risks</th>
              </tr>
            </thead>
            <tbody>
              {report.ai_perception?.models?.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{m.model}</td>
                  <td>
                    <div className={`sentiment-badge ${
                      m.sentiment?.toLowerCase().includes('positive') ? 'sentiment-positive' : 
                      m.sentiment?.toLowerCase().includes('negative') ? 'sentiment-negative' : 
                      'sentiment-neutral'
                    }`}>
                      {m.sentiment}
                    </div>
                  </td>
                  <td>{m.positioning}</td>
                  <td>
                    {m.core_values?.slice(0, 3).map((v, j) => (
                      <div key={j} className="list-item">{v}</div>
                    ))}
                  </td>
                  <td>
                    {m.risk_mentions?.length > 0 ? m.risk_mentions.slice(0, 2).map((r, j) => (
                      <div key={j} className="list-item">{r}</div>
                    )) : <span className="empty-state">None</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-panel col-4">
          <div className="section-header" style={{ marginTop: 0 }}>
            <Globe size={18} />
            Market Snapshot
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <div className="market-label">Dominant Themes</div>
            <div>
              {report.market_perception?.dominant_themes?.length > 0 ? (
                report.market_perception.dominant_themes.map((t, i) => (
                  <span key={i} className="theme-pill">{t}</span>
                ))
              ) : (
                <span className="empty-state-pill">No themes detected</span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div className="market-label">People Also Ask</div>
            <div>
              {report.market_perception?.paa?.slice(0, 3).map((p, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', borderBottom: '1px solid #1a1a1b', paddingBottom: '8px' }}>
                  {p}
                </div>
              ))}
              {!report.market_perception?.paa?.length && <div className="empty-state">No queries found</div>}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div className="market-label">Competitor Adjacency</div>
            <div>
              {report.market_perception?.competitor_proximity?.length > 0 ? (
                report.market_perception.competitor_proximity.map((c, i) => (
                  <span key={i} className="competitor-pill">{c}</span>
                ))
              ) : (
                <span className="empty-state-pill">No competitors</span>
              )}
            </div>
          </div>

          <div>
            <div className="market-label">Market Risk Signals</div>
            <div style={{ marginBottom: '24px' }}>
              {report.market_perception?.risk_signals?.length > 0 ? (
                report.market_perception.risk_signals.map((r, i) => (
                  <div key={i} className="list-item" style={{ color: 'var(--danger)' }}>{r}</div>
                ))
              ) : (
                <div className="empty-state">None identified</div>
              )}
            </div>
          </div>

          <div>
            <div className="market-label">Trending News</div>
            <div>
              {report.market_perception?.trending_news?.length > 0 ? (
                report.market_perception.trending_news.map((news, i) => (
                  <div key={i} className="list-item">
                    <a href={news.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
                      {news.title}
                    </a>
                    {news.source && <span style={{ opacity: 0.6, fontSize: '0.8rem', marginLeft: '8px' }}>— {news.source}</span>}
                  </div>
                ))
              ) : (
                <div className="empty-state">No recent news found</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="transparency-panel">
        <div className="section-header" style={{ marginTop: 0 }}>
          <Shield size={18} />
          Transparency & Evidence
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 2 }}>
          This report is a deterministic aggregation of live data. No hidden scoring or black-box weighting.
          <br />
          Generated on {new Date().toLocaleString()} • All data is public.
        </p>
      </div>
    </motion.div>
  );
}
