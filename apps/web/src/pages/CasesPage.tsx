import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Plus, CheckCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { TopNav } from '../components/TopNav';
import { FilterSidebar } from '../components/FilterSidebar';
import { StatusChip } from '../components/StatusChip';
import { useToast } from '../contexts/ToastContext';

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];

function RegisterCaseForm({ bureaus, onSuccess }: { bureaus: any[]; onSuccess: (res: any) => void }) {
  const [form, setForm] = useState({
    aicte_permanent_id: '',
    subject: '',
    region: '',
    received_at: new Date().toISOString().split('T')[0],
  });
  const { addToast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: any) => api.registerCase(data),
    onSuccess: (res) => {
      addToast({ type: 'success', title: `Case ${res.case?.case_code} registered`, message: res.duplicate ? 'Duplicate detected (idempotent)' : 'Routing suggestion ready' });
      onSuccess(res);
      setForm({ aicte_permanent_id: '', subject: '', region: '', received_at: new Date().toISOString().split('T')[0] });
    },
    onError: (e: any) => {
      addToast({ type: 'error', title: 'Registration failed', message: e.message });
    },
  });

  return (
    <div className="card p-5">
      <h3 className="section-header mb-4">Register Case</h3>
      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
        className="space-y-3"
      >
        <div>
          <label htmlFor="reg-inst-id" className="block text-xs font-medium text-slate-600 mb-1">
            AICTE Permanent ID *
          </label>
          <input
            id="reg-inst-id"
            type="text"
            placeholder="e.g. DEMO-1042"
            value={form.aicte_permanent_id}
            onChange={(e) => setForm({ ...form, aicte_permanent_id: e.target.value })}
            className="input-field"
            required
            aria-label="AICTE Institution Permanent ID"
          />
        </div>
        <div>
          <label htmlFor="reg-subject" className="block text-xs font-medium text-slate-600 mb-1">
            Subject / Complaint *
          </label>
          <textarea
            id="reg-subject"
            placeholder="Describe the complaint..."
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="input-field resize-none"
            rows={3}
            required
            aria-label="Case subject"
          />
        </div>
        <div>
          <label htmlFor="reg-region" className="block text-xs font-medium text-slate-600 mb-1">
            Region
          </label>
          <select
            id="reg-region"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className="input-field"
            aria-label="Region"
          >
            <option value="">Select region</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="reg-received" className="block text-xs font-medium text-slate-600 mb-1">
            Received Date
          </label>
          <input
            id="reg-received"
            type="date"
            value={form.received_at}
            onChange={(e) => setForm({ ...form, received_at: e.target.value })}
            className="input-field"
            aria-label="Received date"
          />
        </div>
        <button
          id="register-case-submit-btn"
          type="submit"
          className="btn-primary w-full justify-center"
          disabled={mutation.isPending}
          aria-label="Submit case registration"
        >
          {mutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
          {mutation.isPending ? 'Registering...' : 'Register Case'}
        </button>
      </form>
    </div>
  );
}

function RoutingSuggestionCard({
  suggestion,
  caseRecord,
  bureaus,
  onConfirm,
}: {
  suggestion: any;
  caseRecord: any;
  bureaus: any[];
  onConfirm: () => void;
}) {
  const [showChange, setShowChange] = useState(false);
  const [selectedBureauId, setSelectedBureauId] = useState(suggestion?.suggested_bureau_id || '');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: (data: any) => api.confirmRouting(caseRecord.id, data),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Routing confirmed', message: `Case assigned to ${suggestion?.suggested_bureau_name}` });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onConfirm();
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Confirm failed', message: e.message }),
  });

  if (!suggestion || !caseRecord) return null;

  const handleConfirm = () => {
    const bureau = bureaus.find((b) => b.id === selectedBureauId);
    confirmMutation.mutate({
      bureau_id: selectedBureauId,
      category: suggestion.suggested_category,
      remarks: 'Confirmed by supervisor',
    });
  };

  return (
    <div className="card p-5 border-l-4 border-teal-500">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">
          Suggestions — {caseRecord.case_code}
        </h3>
        <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
          Needs supervisor review
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-sm font-medium">
          Suggested category: {suggestion.suggested_category}
        </span>
        <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-sm font-medium">
          Suggested cell: {suggestion.suggested_bureau_name}
        </span>
      </div>

      <div className="text-sm text-slate-600 mb-3 space-y-1">
        <p><span className="font-medium">Why:</span> {suggestion.why}</p>
        <p><span className="font-medium">Rules checked:</span> {suggestion.rules_checked?.join(', ')}</p>
      </div>

      {showChange && (
        <div className="mb-3">
          <label htmlFor="change-bureau-select" className="text-xs font-medium text-slate-600 mb-1 block">
            Change Bureau/Cell
          </label>
          <select
            id="change-bureau-select"
            value={selectedBureauId}
            onChange={(e) => setSelectedBureauId(e.target.value)}
            className="input-field"
            aria-label="Select different bureau"
          >
            {bureaus.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <button
          id="routing-confirm-btn"
          onClick={handleConfirm}
          disabled={confirmMutation.isPending}
          className="btn-primary"
          aria-label="Confirm routing suggestion"
        >
          <CheckCircle size={14} />
          Confirm
        </button>
        <button
          id="routing-change-btn"
          onClick={() => setShowChange(!showChange)}
          className="btn-outline"
          aria-label="Change routing suggestion"
        >
          Change
        </button>
      </div>
    </div>
  );
}

export function CasesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ bureaus: [], region: '', status: '' });
  const [search, setSearch] = useState('');
  const [pendingSuggestion, setPendingSuggestion] = useState<{ suggestion: any; caseRecord: any } | null>(null);

  const params: Record<string, string> = {};
  if (filters.region) params.region = filters.region;
  if (filters.status) params.status = filters.status;
  if (filters.bureaus?.length > 0) params.bureau = filters.bureaus[0];
  if (search) params.search = search;
  params.limit = '50';

  const { data: casesData, isLoading } = useQuery({
    queryKey: ['cases', params],
    queryFn: () => api.getCases(params),
    refetchInterval: 30000,
  });

  const { data: bureaus = [] } = useQuery({
    queryKey: ['bureaus'],
    queryFn: api.getBureaus,
  });

  const cases: any[] = casesData?.data || [];

  const handleRegistered = (res: any) => {
    if (res.routing_suggestion && !res.duplicate) {
      setPendingSuggestion({ suggestion: res.routing_suggestion, caseRecord: res.case });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Cases</h1>
          <div className="flex items-center gap-3">
            <button
              id="upload-csv-btn"
              onClick={() => navigate('/import')}
              className="btn-outline"
              aria-label="Upload CSV to import cases"
            >
              <Upload size={14} />
              Upload CSV
            </button>
            <button
              id="register-case-nav-btn"
              onClick={() => document.getElementById('reg-inst-id')?.focus()}
              className="btn-primary"
              aria-label="Register a new case"
            >
              <Plus size={14} />
              Register case
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          id="cases-search"
          type="search"
          placeholder="Search cases by ID, subject, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field mb-5"
          aria-label="Search cases"
        />

        <div className="flex gap-6">
          {/* Sidebar */}
          <FilterSidebar filters={filters} onChange={setFilters} />

          {/* Main content */}
          <div className="flex-1 space-y-5">
            {/* Registration form */}
            <RegisterCaseForm bureaus={bureaus as any[]} onSuccess={handleRegistered} />

            {/* Routing suggestion */}
            {pendingSuggestion && (
              <RoutingSuggestionCard
                suggestion={pendingSuggestion.suggestion}
                caseRecord={pendingSuggestion.caseRecord}
                bureaus={bureaus as any[]}
                onConfirm={() => setPendingSuggestion(null)}
              />
            )}

            {/* Cases table */}
            <div className="card">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="section-header">
                  Recent Cases
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({casesData?.total ?? 0} total)
                  </span>
                </h3>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-slate-400">Loading cases...</div>
              ) : cases.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No cases match your filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Case ID</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Institution</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bureau/Cell</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Due</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {cases.map((c: any) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                          onClick={() => navigate(`/cases/${c.id}`)}
                          aria-label={`Open case ${c.case_code}`}
                        >
                          <td className="px-4 py-3 font-mono text-teal-700 font-semibold">
                            {c.case_code}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-slate-800 font-medium truncate max-w-[160px]">
                              {c.institution?.canonical_name || '—'}
                            </p>
                            <p className="text-xs text-slate-400">{c.institution?.aicte_permanent_id}</p>
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <p className="truncate text-slate-700">{c.subject}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                              {c.bureau?.name || <span className="text-amber-600 italic">Unassigned</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusChip status={c.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{c.source_system}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {c.due_at
                              ? new Date(c.due_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <ChevronRight size={16} className="text-slate-300" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400">
        InSolver · SIH 2026 · Problem SIH26264 · Synthetic demo data
      </footer>
    </div>
  );
}
