import React, { useState } from 'react';
import type { Conversation } from '../types';
import { X, Plus } from 'lucide-react';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (conv: Partial<Conversation>) => Promise<void>;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState(() => ({
    source_id: `REV-${Math.floor(1000 + Math.random() * 9000)}`,
    company: '',
    customer: '',
    contact: '',
    owner: 'Marcus Vance',
    deal_value: 50000,
    priority: 'High',
    stage: 'Discovery',
    sentiment: 'Positive',
    routing: 'Enterprise Sales',
    summary: '',
    notes: '',
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.customer) {
      setError('Company name and customer name are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        ...formData,
        date: new Date().toISOString(),
        follow_up_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="brand-logo-icon" style={{ width: '28px', height: '28px' }}>
              <Plus size={16} />
            </div>
            <h3 className="modal-title">New Revenue Deal / Lead</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--rose-bg)', color: 'var(--rose)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="field-group">
              <label className="field-label">Source ID</label>
              <input
                type="text"
                className="field-input"
                value={formData.source_id}
                onChange={(e) => setFormData({ ...formData, source_id: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">Company / Account Name *</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. Acme Corp"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="field-group">
              <label className="field-label">Customer Contact Name *</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. Jane Doe"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">Contact Email</label>
              <input
                type="email"
                className="field-input"
                placeholder="jane@acme.com"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="field-group">
              <label className="field-label">Deal Value ($)</label>
              <input
                type="number"
                className="field-input"
                value={formData.deal_value}
                onChange={(e) => setFormData({ ...formData, deal_value: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Priority</label>
              <select
                className="field-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Stage</label>
              <select
                className="field-select"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="field-group">
              <label className="field-label">Routing Assignment</label>
              <select
                className="field-select"
                value={formData.routing}
                onChange={(e) => setFormData({ ...formData, routing: e.target.value })}
              >
                <option value="Enterprise Sales">Enterprise Sales</option>
                <option value="Customer Success">Customer Success</option>
                <option value="Mid-Market">Mid-Market</option>
                <option value="Inbound Sales">Inbound Sales</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Account Executive (Owner)</label>
              <input
                type="text"
                className="field-input"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">AI Conversation Intelligence Summary</label>
            <textarea
              className="field-textarea"
              placeholder="Summary of customer requirements, conversation transcript key takeaways, next steps..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              style={{ minHeight: '80px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
