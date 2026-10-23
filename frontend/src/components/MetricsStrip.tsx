import type { Metrics } from '../types';
import { DollarSign, AlertCircle, Clock, CheckCircle2, TrendingUp, Users } from 'lucide-react';

interface MetricsStripProps {
  metrics: Metrics;
}

export const MetricsStrip: React.FC<MetricsStripProps> = ({ metrics }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="metrics-strip">
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Pipeline Value</span>
          <div className="kpi-icon" style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)' }}>
            <DollarSign size={18} />
          </div>
        </div>
        <div className="kpi-value">{formatCurrency(metrics.totalPipelineValue)}</div>
        <div className="kpi-subtitle">
          <TrendingUp size={12} color="#10b981" />
          <span>Active Pipeline Across Teams</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Closed Won</span>
          <div className="kpi-icon" style={{ background: 'var(--emerald-bg)', color: 'var(--emerald)' }}>
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="kpi-value" style={{ color: 'var(--emerald)' }}>
          {formatCurrency(metrics.closedWonValue)}
        </div>
        <div className="kpi-subtitle">
          <span>Realized Contract Revenue</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Overdue Follow-ups</span>
          <div className="kpi-icon" style={{ background: 'var(--rose-bg)', color: 'var(--rose)' }}>
            <Clock size={18} />
          </div>
        </div>
        <div className="kpi-value" style={{ color: metrics.pending > 0 ? 'var(--rose)' : 'inherit' }}>
          {metrics.pending}
        </div>
        <div className="kpi-subtitle" style={{ color: metrics.pending > 0 ? 'var(--rose)' : 'var(--text-muted)' }}>
          <AlertCircle size={12} />
          <span>{metrics.pending > 0 ? 'Action required immediately' : 'All caught up'}</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">High Priority Leads</span>
          <div className="kpi-icon" style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}>
            <AlertCircle size={18} />
          </div>
        </div>
        <div className="kpi-value" style={{ color: 'var(--amber)' }}>
          {metrics.highPriority}
        </div>
        <div className="kpi-subtitle">
          <span>Executive & Tier 1 deals</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Total Conversations</span>
          <div className="kpi-icon" style={{ background: 'var(--sky-bg)', color: 'var(--sky)' }}>
            <Users size={18} />
          </div>
        </div>
        <div className="kpi-value">{metrics.total}</div>
        <div className="kpi-subtitle">
          <span>Avg Deal: {formatCurrency(metrics.avgDealSize)}</span>
        </div>
      </div>
    </div>
  );
};
