import React, { useState } from 'react';
import type { ImportSummary } from '../types';
import { X, UploadCloud, CheckCircle2, AlertTriangle, Download } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<ImportSummary>;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const summary = await onImport(selectedFile);
      setResult(summary);
    } catch (err: any) {
      setError(err.message || 'Import failed. Check file format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      'source_id,customer,company,contact,owner,date,summary,outcome,priority,follow_up_date,routing,deal_value,stage,sentiment\n' +
      'REV-SAMPLE-1,Alexander Bell,TeleVox Global,alex@televox.io,Marcus Vance,2026-10-23T10:00:00,Interested in 500 seat unified communication rollout.,Proposal Sent,High,2026-10-25T14:00:00,Enterprise Sales,75000,Proposal,Positive\n' +
      'REV-SAMPLE-2,Megan Fox,Quantum Dynamics,mfox@quantum.tech,Elena Rostova,2026-10-22T14:30:00,Requested security documentation and SOC2 audit.,Meeting Scheduled,Medium,2026-10-26T11:00:00,Mid-Market,40000,Security Review,Neutral';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_conversations.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="brand-logo-icon" style={{ width: '28px', height: '28px' }}>
              <UploadCloud size={16} />
            </div>
            <h3 className="modal-title">Import Conversation Data</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Upload a <strong>.CSV</strong> or <strong>.JSON</strong> file with conversation records.
          Records require at least a unique <code>source_id</code>.
        </p>

        {error && (
          <div style={{ background: 'var(--rose-bg)', color: 'var(--rose)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
            <AlertTriangle size={15} style={{ display: 'inline', marginRight: '6px' }} />
            {error}
          </div>
        )}

        {result ? (
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald)', fontWeight: 700, marginBottom: '12px' }}>
              <CheckCircle2 size={18} />
              Import Processed Successfully
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--emerald)' }}>{result.new}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>New Leads</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sky)' }}>{result.updated}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Updated</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-muted)' }}>{result.unchanged}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Unchanged</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--amber)' }}>{result.duplicates}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Overrides Kept</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--rose)' }}>
                Errors: {result.errors.join(', ')}
              </div>
            )}
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: '2px dashed var(--bg-card-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px 20px',
              textAlign: 'center',
              background: 'var(--bg-surface-elevated)',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".csv,.json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <UploadCloud size={36} color="var(--accent-primary)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedFile ? selectedFile.name : 'Click to browse or drop CSV/JSON file here'}
            </div>
            {selectedFile && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleDownloadSample}
          >
            <Download size={13} />
            Download Sample CSV
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {result ? 'Done' : 'Cancel'}
            </button>
            {!result && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!selectedFile || isUploading}
                onClick={handleUpload}
              >
                {isUploading ? 'Importing...' : 'Start Import'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
