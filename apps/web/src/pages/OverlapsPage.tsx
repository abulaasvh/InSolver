import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Link2, Sparkles, CheckCircle, XCircle, Clock, AlertTriangle,
  ArrowRight, ExternalLink, RefreshCw, Filter, Search
} from 'lucide-react';
import { api } from '../lib/api';
import { TopNav } from '../components/TopNav';
import { StatusChip } from '../components/StatusChip';
import { useToast } from '../contexts/ToastContext';

function ConfidenceBadge({ band, score }: { band: string; score: number }) {
  const percentage = Math.round(score * 100);
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  if (band === 'High') color = 'bg-teal-50 text-teal-800 border-teal-200';
  else if (band === 'Medium') color = 'bg-amber-50 text-amber-800 border-amber-200';

  return (
    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${color}`}>
      <span className={`w-2 h-2 rounded-full ${
        band === 'High' ? 'bg-teal-500' : band === 'Medium' ? 'bg-amber-500' : 'bg-slate-400'
      }`} />
      <span>{band} Confidence ({percentage}%)</span>
    </div>
  );
}

export function OverlapsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'suggested' | 'confirmed' | 'rejected' | 'deferred'>('suggested');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const { data: overlaps = [], isLoading, isRefetching } = useQuery({
    queryKey: ['overlaps'],
    queryFn: () => api.getOverlaps(),
    refetchInterval: 30000,
  });

  const runDetectionMutation = useMutation({
    mutationFn: () => api.runOverlapDetection(),
    onSuccess: (res: any) => {
      addToast({
        type: 'success',
        title: 'Overlap Detection Finished',
        message: res.message || 'Detection job completed.',
      });
      queryClient.invalidateQueries({ queryKey: ['overlaps'] });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Detection Failed',
        message: err.message,
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: string; reason?: string }) =>
      api.reviewOverlap(id, action, reason),
    onSuccess: (_, variables) => {
      addToast({
        type: variables.action === 'confirmed' ? 'success' : variables.action === 'rejected' ? 'warning' : 'info',
        title: `Overlap marked as ${variables.action}`,
        message: 'Action logged and audited.',
      });
      setRejectingId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['overlaps'] });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Review action failed',
        message: err.message,
      });
    },
  });

  const allItems = overlaps as any[];
  const totalCount = allItems.length;
  const suggestedCount = allItems.filter((o) => o.review_status === 'suggested').length;
  const confirmedCount = allItems.filter((o) => o.review_status === 'confirmed').length;
  const rejectedCount = allItems.filter((o) => o.review_status === 'rejected').length;
  const deferredCount = allItems.filter((o) => o.review_status === 'deferred').length;

  const filteredItems = allItems.filter((item) => {
    if (activeTab !== 'all' && item.review_status !== activeTab) return false;
    if (confidenceFilter !== 'all' && item.confidence_band !== confidenceFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const codeA = item.case_a?.case_code?.toLowerCase() || '';
      const codeB = item.case_b?.case_code?.toLowerCase() || '';
      const subA = item.case_a?.subject?.toLowerCase() || '';
      const subB = item.case_b?.subject?.toLowerCase() || '';
      const instName = item.case_a?.institution?.canonical_name?.toLowerCase() || '';
      if (!codeA.includes(q) && !codeB.includes(q) && !subA.includes(q) && !subB.includes(q) && !instName.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="text-teal-600" size={24} />
              Cross-Cell Overlaps & Duplicate Coordination
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Multi-criteria detection detects related complaints across AICTE cells. No complaints are merged automatically; supervisor confirmation required.
            </p>
          </div>

          <button
            onClick={() => runDetectionMutation.mutate()}
            disabled={runDetectionMutation.isPending}
            className="btn-primary"
            aria-label="Run automated overlap detection"
          >
            {runDetectionMutation.isPending ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            {runDetectionMutation.isPending ? 'Analyzing Cases...' : 'Run Detection Engine'}
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Identified</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</p>
          </div>
          <div className="card p-4 border-l-4 border-amber-500 bg-amber-50/20">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Awaiting Review</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{suggestedCount}</p>
          </div>
          <div className="card p-4 border-l-4 border-teal-500 bg-teal-50/20">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Confirmed Linkages</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">{confirmedCount}</p>
          </div>
          <div className="card p-4 border-l-4 border-slate-400">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rejected</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">{rejectedCount}</p>
          </div>
        </div>

        {/* Filter Bar & Tabs */}
        <div className="card p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'suggested', label: `Needs Review (${suggestedCount})` },
              { id: 'all', label: `All (${totalCount})` },
              { id: 'confirmed', label: `Confirmed (${confirmedCount})` },
              { id: 'rejected', label: `Rejected (${rejectedCount})` },
              { id: 'deferred', label: `Deferred (${deferredCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-teal-500"
              aria-label="Filter by confidence band"
            >
              <option value="all">All Confidence Bands</option>
              <option value="High">High Confidence</option>
              <option value="Medium">Medium Confidence</option>
              <option value="Low">Low Confidence</option>
            </select>

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search case code, institute..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg w-52 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Overlaps List */}
        {isLoading ? (
          <div className="card p-12 text-center text-slate-400">Loading overlap relationships...</div>
        ) : filteredItems.length === 0 ? (
          <div className="card p-12 text-center text-slate-400">
            No overlaps match the selected filter criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((rel: any) => {
              const isSuggested = rel.review_status === 'suggested';
              const isConfirmed = rel.review_status === 'confirmed';
              const isRejected = rel.review_status === 'rejected';
              const isDeferred = rel.review_status === 'deferred';

              return (
                <div
                  key={rel.id}
                  className={`card p-5 transition-shadow hover:shadow-md ${
                    isConfirmed
                      ? 'border-l-4 border-l-teal-500'
                      : isRejected
                      ? 'border-l-4 border-l-red-400 opacity-80'
                      : 'border-l-4 border-l-amber-500'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        REL-{rel.id.slice(0, 8)}
                      </span>
                      <ConfidenceBadge band={rel.confidence_band} score={rel.score} />
                      <span className="text-xs text-slate-400">
                        Detected {new Date(rel.created_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfirmed && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                          <CheckCircle size={13} /> Link Confirmed
                        </span>
                      )}
                      {isRejected && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                          <XCircle size={13} /> Rejected
                        </span>
                      )}
                      {isDeferred && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Clock size={13} /> Deferred
                        </span>
                      )}
                      {isSuggested && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                          <AlertTriangle size={13} /> Action Required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Institution info if available */}
                  {rel.case_a?.institution && (
                    <div className="pt-3 pb-2 text-xs text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Institution:</span>
                      <span>{rel.case_a.institution.canonical_name}</span>
                      <span className="text-slate-400 font-mono">({rel.case_a.institution.aicte_permanent_id})</span>
                    </div>
                  )}

                  {/* Cases Comparison Grid */}
                  <div className="grid md:grid-cols-2 gap-4 my-3 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    {/* Case A */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => navigate(`/cases/${rel.case_a?.id}`)}
                          className="font-mono text-sm font-bold text-teal-700 hover:underline flex items-center gap-1"
                        >
                          {rel.case_a?.case_code}
                          <ExternalLink size={12} />
                        </button>
                        <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {rel.case_a?.bureau?.name || 'Unassigned'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2">{rel.case_a?.subject}</p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                        <StatusChip status={rel.case_a?.status || 'New'} />
                        <span>Source: {rel.case_a?.source_system}</span>
                      </div>
                    </div>

                    {/* Case B */}
                    <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => navigate(`/cases/${rel.case_b?.id}`)}
                          className="font-mono text-sm font-bold text-teal-700 hover:underline flex items-center gap-1"
                        >
                          {rel.case_b?.case_code}
                          <ExternalLink size={12} />
                        </button>
                        <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {rel.case_b?.bureau?.name || 'Unassigned'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2">{rel.case_b?.subject}</p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                        <StatusChip status={rel.case_b?.status || 'New'} />
                        <span>Source: {rel.case_b?.source_system}</span>
                      </div>
                    </div>
                  </div>

                  {/* Overlap Reasons */}
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Detection Rationale & Match Signals
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(rel.reasons || []).map((r: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-md shadow-2xs"
                        >
                          <strong className="text-slate-900">{r.label}:</strong> {r.detail}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Reviewer Note if already reviewed */}
                  {rel.reason && (
                    <div className="mt-3 text-xs bg-slate-100/70 p-2.5 rounded-lg text-slate-600 border border-slate-200">
                      <span className="font-semibold text-slate-800">Review Note:</span> {rel.reason}
                      {rel.reviewer && <span className="text-slate-400 ml-1">— {rel.reviewer.name}</span>}
                    </div>
                  )}

                  {/* Actions / Review Controls */}
                  {isSuggested && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {rejectingId === rel.id && (
                        <div className="mb-3 space-y-2 bg-red-50/50 p-3 rounded-lg border border-red-100">
                          <label className="text-xs font-semibold text-red-800 block">
                            Mandatory Rejection Justification:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Distinct complaints filed by different complainants"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="input-field text-xs"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => reviewMutation.mutate({ id: rel.id, action: 'confirmed' })}
                          disabled={reviewMutation.isPending}
                          className="btn-primary text-xs py-1.5"
                          aria-label={`Confirm link between ${rel.case_a?.case_code} and ${rel.case_b?.case_code}`}
                        >
                          <CheckCircle size={13} />
                          Confirm Joint Coordination
                        </button>

                        <button
                          onClick={() => {
                            if (rejectingId === rel.id) {
                              if (!rejectReason.trim()) {
                                addToast({ type: 'warning', title: 'Reason required', message: 'Please provide a rejection reason' });
                                return;
                              }
                              reviewMutation.mutate({ id: rel.id, action: 'rejected', reason: rejectReason });
                            } else {
                              setRejectingId(rel.id);
                              setRejectReason('Different issue, handled separately');
                            }
                          }}
                          disabled={reviewMutation.isPending}
                          className="btn-outline text-xs py-1.5 text-red-700 border-red-200 hover:bg-red-50"
                        >
                          <XCircle size={13} />
                          {rejectingId === rel.id ? 'Submit Rejection' : 'Reject Overlap'}
                        </button>

                        {rejectingId === rel.id && (
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            className="text-xs text-slate-500 hover:underline px-2"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          onClick={() => reviewMutation.mutate({ id: rel.id, action: 'deferred' })}
                          disabled={reviewMutation.isPending}
                          className="btn-outline text-xs py-1.5 text-amber-700 border-amber-200 hover:bg-amber-50"
                        >
                          <Clock size={13} />
                          Defer for Later
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
