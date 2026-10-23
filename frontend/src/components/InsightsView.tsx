import React from 'react';
import type { Conversation, Metrics } from '../types';
import { 
  TrendingUp, 
  ShieldAlert, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Building2
} from 'lucide-react';

interface InsightsViewProps {
  metrics: Metrics;
  conversations: Conversation[];
  onSelectConversation: (id: number) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  metrics,
  conversations,
  onSelectConversation,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const stages = [
    { name: 'Discovery', color: '#6366f1' },
    { name: 'Evaluation', color: '#0ea5e9' },
    { name: 'Proposal', color: '#f59e0b' },
    { name: 'Security Review', color: '#a855f7' },
    { name: 'Negotiation', color: '#ec4899' },
    { name: 'Closing', color: '#8b5cf6' },
    { name: 'Closed Won', color: '#10b981' },
  ];

  const maxStageCount = Math.max(...Object.values(metrics.stageBreakdown || {}), 1);
  const maxRoutingCount = Math.max(...Object.values(metrics.routingBreakdown || {}), 1);

  const now = React.useMemo(() => new Date(), []);

  // Identify risk items
  const highRiskItems = conversations.filter(
    (c) =>
      c.sentiment === 'Negative' ||
      ((c.priority || '').toLowerCase() === 'high' && (!c.follow_up_date || new Date(c.follow_up_date) <= now))
  );

  return (
    <div className="insights-container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Deal Stage Funnel */}
        <div className="chart-card">
          <div className="detail-card-title">
            <Layers size={16} color="var(--accent-primary)" />
            Pipeline Distribution by Deal Stage
          </div>
          <div style={{ marginTop: '16px' }}>
            {stages.map((st) => {
              const count = metrics.stageBreakdown[st.name] || 0;
              const pct = Math.round((count / maxStageCount) * 100);
              return (
                <div key={st.name} className="bar-row">
                  <div className="bar-label">{st.name}</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: st.color,
                      }}
                    />
                  </div>
                  <div className="bar-value">{count} deals</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Routing Team Workload */}
        <div className="chart-card">
          <div className="detail-card-title">
            <TrendingUp size={16} color="var(--emerald)" />
            Revenue & Workload by Routing Team
          </div>
          <div style={{ marginTop: '16px' }}>
            {Object.entries(metrics.routingBreakdown || {}).map(([team, count]) => {
              const pct = Math.round((count / maxRoutingCount) * 100);
              const teamRevenue = conversations
                .filter((c) => c.routing === team)
                .reduce((acc, c) => acc + (c.deal_value || 0), 0);

              return (
                <div key={team} className="bar-row">
                  <div className="bar-label">{team}</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                      }}
                    />
                  </div>
                  <div className="bar-value" style={{ width: '90px' }}>
                    {formatCurrency(teamRevenue)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Critical Executive Attention & Risks */}
      <div className="chart-card">
        <div className="detail-card-title" style={{ color: 'var(--rose)' }}>
          <ShieldAlert size={18} color="var(--rose)" />
          Immediate Attention & Pipeline Risks ({highRiskItems.length})
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Deals flagged with negative customer sentiment or overdue high-priority action deadlines.
        </p>

        {highRiskItems.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--emerald)' }}>
            <CheckCircle2 size={24} style={{ margin: '0 auto 8px' }} />
            <p>No high-risk pipeline bottlenecks detected!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
            {highRiskItems.map((item) => (
              <div
                key={item.id}
                className="conv-card"
                style={{ borderLeft: '4px solid var(--rose)' }}
                onClick={() => onSelectConversation(item.id)}
              >
                <div className="conv-card-header">
                  <span className="conv-company">
                    <Building2 size={15} color="var(--rose)" />
                    {item.company}
                  </span>
                  <span className="conv-amount">{formatCurrency(item.deal_value || 0)}</span>
                </div>
                <div className="conv-meta">
                  <span>{item.customer}</span>
                  <span>•</span>
                  <span>Rep: {item.owner || 'Unassigned'}</span>
                </div>
                <p className="conv-summary-snippet" style={{ color: 'var(--text-primary)' }}>
                  {item.summary}
                </p>
                <div className="conv-tags" style={{ marginTop: '8px' }}>
                  <span className="badge badge-high">{item.priority}</span>
                  {item.sentiment === 'Negative' && (
                    <span className="badge" style={{ background: 'var(--rose-bg)', color: 'var(--rose)' }}>
                      Churn Risk
                    </span>
                  )}
                  <span className="badge badge-alert">
                    <Clock size={11} /> Overdue Follow-up
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
