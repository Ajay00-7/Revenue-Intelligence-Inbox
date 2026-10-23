import React, { useState } from 'react';
import type { Conversation } from '../types';
import { 
  Building2, 
  User, 
  Mail, 
  Clock, 
  Sparkles, 
  Check, 
  Trash2, 
  Save, 
  AlertCircle,
  FileEdit,
  DollarSign
} from 'lucide-react';

interface InboxViewProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onUpdate: (id: number, payload: Partial<Conversation>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  routingFilter: string;
  setRoutingFilter: (val: string) => void;
  stageFilter: string;
  setStageFilter: (val: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  conversations,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
  priorityFilter,
  setPriorityFilter,
  routingFilter,
  setRoutingFilter,
  stageFilter,
  setStageFilter,
}) => {
  const selectedConv = conversations.find((c) => c.id === selectedId) || conversations[0] || null;
  const [sortBy, setSortBy] = useState<'value' | 'date' | 'priority'>('date');
  const [prevId, setPrevId] = useState<number | undefined>(selectedConv?.id);
  const [editingNotes, setEditingNotes] = useState<string>(selectedConv?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  if (selectedConv && selectedConv.id !== prevId) {
    setPrevId(selectedConv.id);
    setEditingNotes(selectedConv.notes || '');
  }

  // Sort conversations
  const sortedConversations = [...conversations].sort((a, b) => {
    if (sortBy === 'value') {
      return (b.deal_value || 0) - (a.deal_value || 0);
    }
    if (sortBy === 'priority') {
      const pMap: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      const pa = pMap[(a.priority || '').toLowerCase()] || 0;
      const pb = pMap[(b.priority || '').toLowerCase()] || 0;
      return pb - pa;
    }
    // Date default
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const now = React.useMemo(() => new Date(), []);
  const isOverdue = (dateStr?: string | null) => {
    if (!dateStr) return true;
    return new Date(dateStr) <= now;
  };

  const handleSaveNotes = async () => {
    if (!selectedConv) return;
    setIsSaving(true);
    try {
      await onUpdate(selectedConv.id, {
        notes: editingNotes,
        manual_override: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = async (field: keyof Conversation, value: any) => {
    if (!selectedConv) return;
    await onUpdate(selectedConv.id, {
      [field]: value,
      manual_override: true,
    });
  };

  const handleMarkFollowUpDone = async () => {
    if (!selectedConv) return;
    // Set follow up to 7 days from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    await onUpdate(selectedConv.id, {
      follow_up_date: nextWeek.toISOString(),
      manual_override: true,
    });
  };

  return (
    <div className="inbox-container">
      {/* Left Feed List Pane */}
      <div className="feed-pane">
        <div className="feed-filters">
          <div className="filter-row">
            <button
              className={`filter-chip ${priorityFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('all')}
            >
              All Priorities
            </button>
            <button
              className={`filter-chip ${priorityFilter === 'high' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('high')}
            >
              High Priority
            </button>
            <button
              className={`filter-chip ${priorityFilter === 'medium' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('medium')}
            >
              Medium
            </button>
            <button
              className={`filter-chip ${priorityFilter === 'low' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('low')}
            >
              Low
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="filter-select"
              value={routingFilter}
              onChange={(e) => setRoutingFilter(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="all">All Routing Teams</option>
              <option value="Enterprise Sales">Enterprise Sales</option>
              <option value="Customer Success">Customer Success</option>
              <option value="Mid-Market">Mid-Market</option>
              <option value="Inbound Sales">Inbound Sales</option>
            </select>

            <select
              className="filter-select"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="all">All Deal Stages</option>
              <option value="Discovery">Discovery</option>
              <option value="Evaluation">Evaluation</option>
              <option value="Proposal">Proposal</option>
              <option value="Security Review">Security Review</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closing">Closing</option>
              <option value="Closed Won">Closed Won</option>
            </select>

            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              title="Sort Feed"
            >
              <option value="date">Newest</option>
              <option value="value">Highest Value</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        <div className="feed-list">
          {sortedConversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: 600, fontSize: '15px' }}>No conversations match filters</p>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>Try clearing filters or search query.</p>
            </div>
          ) : (
            sortedConversations.map((conv) => {
              const overdue = isOverdue(conv.follow_up_date);
              const isSelected = selectedConv?.id === conv.id;
              const pLower = (conv.priority || 'medium').toLowerCase();

              return (
                <div
                  key={conv.id}
                  className={`conv-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelect(conv.id)}
                >
                  <div className="conv-card-header">
                    <span className="conv-company">
                      <Building2 size={15} color="var(--accent-primary)" />
                      {conv.company || 'Unknown Company'}
                    </span>
                    <span className="conv-amount">{formatCurrency(conv.deal_value)}</span>
                  </div>

                  <div className="conv-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={13} />
                      {conv.customer || 'Unknown Lead'}
                    </span>
                    <span>•</span>
                    <span>{conv.source_id}</span>
                    {conv.manual_override && (
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                        Overridden
                      </span>
                    )}
                  </div>

                  <div className="conv-summary-snippet">
                    {conv.summary || 'No conversation summary recorded.'}
                  </div>

                  <div className="conv-tags">
                    <span className={`badge badge-${pLower}`}>
                      {conv.priority || 'Medium'}
                    </span>

                    {conv.stage && (
                      <span className="badge badge-stage">{conv.stage}</span>
                    )}

                    {conv.routing && (
                      <span className="badge badge-routing">{conv.routing}</span>
                    )}

                    {overdue && (
                      <span className="badge badge-alert">
                        <Clock size={11} /> Overdue
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className="detail-pane">
        {selectedConv ? (
          <>
            <div className="detail-header-card">
              <div className="detail-title-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2>{selectedConv.company || 'Unnamed Account'}</h2>
                  <span className="badge badge-routing">{selectedConv.source_id}</span>
                </div>
                <div className="detail-sub" style={{ marginTop: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={14} color="var(--accent-primary)" />
                    <strong>{selectedConv.customer || 'Unassigned Lead'}</strong>
                  </span>
                  {selectedConv.contact && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Mail size={14} />
                      {selectedConv.contact}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    Rep: <strong>{selectedConv.owner || 'Unassigned'}</strong>
                  </span>
                </div>
              </div>

              <div className="detail-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleMarkFollowUpDone}
                  title="Reschedule follow-up to +7 days"
                >
                  <Check size={14} color="#10b981" />
                  Snooze 7d
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--rose)' }}
                  onClick={() => onDelete(selectedConv.id)}
                  title="Delete this record"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="intelligence-grid">
              {/* Main Intelligence Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="detail-card">
                  <div className="detail-card-title">
                    <Sparkles size={16} color="var(--accent-primary)" />
                    AI Intelligence Summary & Analysis
                  </div>
                  <div className="summary-box">
                    {selectedConv.summary || 'No conversation transcript analysis available.'}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="field-group">
                      <label className="field-label">Primary Outcome / Status</label>
                      <input
                        type="text"
                        className="field-input"
                        value={selectedConv.outcome || ''}
                        onChange={(e) => handleFieldChange('outcome', e.target.value)}
                        placeholder="e.g. Proposal Sent, Meeting Scheduled"
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Customer Sentiment</label>
                      <select
                        className="field-select"
                        value={selectedConv.sentiment || 'Positive'}
                        onChange={(e) => handleFieldChange('sentiment', e.target.value)}
                      >
                        <option value="Positive">Positive (High Intent)</option>
                        <option value="Neutral">Neutral (Evaluating)</option>
                        <option value="Negative">Negative (Churn Risk)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sales Rep Notes with Manual Override */}
                <div className="detail-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div className="detail-card-title" style={{ margin: 0 }}>
                      <FileEdit size={16} color="var(--accent-primary)" />
                      Sales Rep Notes & Action Items
                    </div>
                    {selectedConv.manual_override && (
                      <span className="badge" style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)' }}>
                        Manual Override Active
                      </span>
                    )}
                  </div>

                  <div className="field-group">
                    <textarea
                      className="field-textarea"
                      placeholder="Add strategic account notes, objections, pricing negotiations..."
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveNotes}
                      disabled={isSaving}
                    >
                      <Save size={14} />
                      {isSaving ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Deal Controls & Metadata Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="detail-card">
                  <div className="detail-card-title">
                    <DollarSign size={16} color="var(--emerald)" />
                    Revenue & Deal Settings
                  </div>

                  <div className="field-group">
                    <label className="field-label">Estimated Deal Value ($)</label>
                    <input
                      type="number"
                      className="field-input"
                      value={selectedConv.deal_value || 0}
                      onChange={(e) => handleFieldChange('deal_value', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Deal Pipeline Stage</label>
                    <select
                      className="field-select"
                      value={selectedConv.stage || 'Discovery'}
                      onChange={(e) => handleFieldChange('stage', e.target.value)}
                    >
                      <option value="Discovery">Discovery</option>
                      <option value="Evaluation">Evaluation</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Security Review">Security Review</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Closing">Closing</option>
                      <option value="Closed Won">Closed Won</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Lead Prioritization</label>
                    <select
                      className="field-select"
                      value={selectedConv.priority || 'Medium'}
                      onChange={(e) => handleFieldChange('priority', e.target.value)}
                    >
                      <option value="High">High (Immediate Exec Focus)</option>
                      <option value="Medium">Medium (Standard Pipeline)</option>
                      <option value="Low">Low (Nurture/Trial)</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Routing Team</label>
                    <select
                      className="field-select"
                      value={selectedConv.routing || 'Enterprise Sales'}
                      onChange={(e) => handleFieldChange('routing', e.target.value)}
                    >
                      <option value="Enterprise Sales">Enterprise Sales</option>
                      <option value="Customer Success">Customer Success</option>
                      <option value="Mid-Market">Mid-Market</option>
                      <option value="Inbound Sales">Inbound Sales</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Follow-up Deadline</label>
                    <input
                      type="datetime-local"
                      className="field-input"
                      value={
                        selectedConv.follow_up_date
                          ? new Date(selectedConv.follow_up_date).toISOString().slice(0, 16)
                          : ''
                      }
                      onChange={(e) => handleFieldChange('follow_up_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    />
                    {isOverdue(selectedConv.follow_up_date) && (
                      <span style={{ fontSize: '12px', color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <AlertCircle size={13} /> Follow-up is past due
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Select a conversation from the feed to view revenue intelligence
          </div>
        )}
      </div>
    </div>
  );
};
