import React from 'react';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Upload, 
  Download, 
  RotateCcw, 
  Inbox, 
  BarChart3
} from 'lucide-react';

interface NavbarProps {
  activeView: 'inbox' | 'insights';
  setActiveView: (view: 'inbox' | 'insights') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  backendOnline: boolean;
  onOpenNewModal: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onReseed: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  searchTerm,
  setSearchTerm,
  backendOnline,
  onOpenNewModal,
  onOpenImportModal,
  onExportCsv,
  onExportJson,
  onReseed,
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo-icon">
          <Sparkles size={22} />
        </div>
        <div>
          <div className="brand-title">
            Revenue Intelligence
            <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>v1.0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span className={`status-badge ${backendOnline ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              {backendOnline ? 'FastAPI Connected' : 'API Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="nav-center">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search accounts, leads, intelligence notes, rep..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="view-tabs">
          <button
            className={`view-tab ${activeView === 'inbox' ? 'active' : ''}`}
            onClick={() => setActiveView('inbox')}
          >
            <Inbox size={15} />
            Inbox
          </button>
          <button
            className={`view-tab ${activeView === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveView('insights')}
          >
            <BarChart3 size={15} />
            Insights
          </button>
        </div>
      </div>

      <div className="header-actions">
        <button className="btn btn-primary" onClick={onOpenNewModal}>
          <Plus size={16} />
          New Lead
        </button>

        <button className="btn btn-secondary" onClick={onOpenImportModal} title="Import CSV or JSON">
          <Upload size={15} />
          Import
        </button>

        <button className="btn btn-outline btn-sm" onClick={onExportCsv} title="Export CSV">
          <Download size={14} />
          CSV
        </button>

        <button className="btn btn-outline btn-sm" onClick={onExportJson} title="Export JSON">
          JSON
        </button>

        <button 
          className="btn btn-outline btn-sm" 
          onClick={onReseed} 
          title="Reseed Realistic Demo Data"
          style={{ opacity: 0.7 }}
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </header>
  );
};
