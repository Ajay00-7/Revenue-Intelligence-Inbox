import { useState, useEffect, useCallback } from 'react';
import type { Conversation, Metrics } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { MetricsStrip } from './components/MetricsStrip';
import { InboxView } from './components/InboxView';
import { InsightsView } from './components/InsightsView';
import { NewConversationModal } from './components/NewConversationModal';
import { ImportModal } from './components/ImportModal';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';

export function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'inbox' | 'insights'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [routingFilter, setRoutingFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [backendOnline, setBackendOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const addToast = (type: 'success' | 'error', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch conversations and metrics
  const loadData = useCallback(async () => {
    try {
      const [convs, m] = await Promise.all([
        api.getConversations({
          search: searchTerm,
          priority: priorityFilter,
          routing: routingFilter,
          stage: stageFilter,
        }),
        api.getMetrics(),
      ]);
      setConversations(convs);
      setMetrics(m);
      setBackendOnline(true);
      if (convs.length > 0 && selectedId === null) {
        setSelectedId(convs[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, priorityFilter, routingFilter, stageFilter, selectedId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic health & sync poll every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      api.checkHealth().then((isHealthy) => {
        setBackendOnline(isHealthy);
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async (id: number, payload: Partial<Conversation>) => {
    try {
      const updated = await api.updateConversation(id, payload);
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
      // Refresh metrics silently
      api.getMetrics().then(setMetrics).catch(() => {});
      addToast('success', 'Changes updated successfully');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update record');
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
      api.getMetrics().then(setMetrics).catch(() => {});
      addToast('success', 'Conversation deleted');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete record');
    }
  };

  const handleCreate = async (convData: Partial<Conversation>) => {
    try {
      const created = await api.createConversation(convData);
      setConversations((prev) => [created, ...prev]);
      setSelectedId(created.id);
      api.getMetrics().then(setMetrics).catch(() => {});
      addToast('success', `Created lead ${created.company}`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create lead');
      throw err;
    }
  };

  const handleImport = async (file: File) => {
    try {
      const summary = await api.importFile(file);
      await loadData();
      addToast('success', `Imported: ${summary.new} new, ${summary.updated} updated`);
      return summary;
    } catch (err: any) {
      addToast('error', err.message || 'Import failed');
      throw err;
    }
  };

  const handleExportCsv = async () => {
    try {
      await api.exportCsv();
      addToast('success', 'CSV export downloaded');
    } catch (err: any) {
      addToast('error', err.message || 'Export failed');
    }
  };

  const handleExportJson = async () => {
    try {
      await api.exportJson();
      addToast('success', 'JSON export downloaded');
    } catch (err: any) {
      addToast('error', err.message || 'Export failed');
    }
  };

  const handleReseed = async () => {
    if (!confirm('Reset all demo data back to default high-revenue sample leads?')) return;
    try {
      await api.reseed();
      await loadData();
      addToast('success', 'Demo data reseeded');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to reseed data');
    }
  };

  return (
    <>
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        backendOnline={backendOnline}
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        onReseed={handleReseed}
      />

      <MetricsStrip metrics={metrics} />

      <main className="app-content">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-secondary)' }}>
            Loading Revenue Intelligence Hub...
          </div>
        ) : activeView === 'inbox' ? (
          <InboxView
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            routingFilter={routingFilter}
            setRoutingFilter={setRoutingFilter}
            stageFilter={stageFilter}
            setStageFilter={setStageFilter}
          />
        ) : (
          <InsightsView
            metrics={metrics}
            conversations={conversations}
            onSelectConversation={(id) => {
              setSelectedId(id);
              setActiveView('inbox');
            }}
          />
        )}
      </main>

      <NewConversationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreate}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />

      <Toast toasts={toasts} onDismiss={removeToast} />
    </>
  );
}

export default App;
