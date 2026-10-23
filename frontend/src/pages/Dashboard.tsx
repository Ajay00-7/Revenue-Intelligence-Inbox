import React, { useEffect, useState } from 'react';
import type { Metrics } from '../types';
import { api } from '../api';
import { MetricsStrip } from '../components/MetricsStrip';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    pending: 0,
    highPriority: 0,
    totalPipelineValue: 0,
    closedWonValue: 0,
    avgDealSize: 0,
    priorityBreakdown: {},
    stageBreakdown: {},
    routingBreakdown: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getMetrics();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <MetricsStrip metrics={metrics} />
    </div>
  );
};

export default Dashboard;
