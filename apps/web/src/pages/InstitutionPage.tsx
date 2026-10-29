import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, MapPin, Hash, CheckCircle, XCircle, Clock,
  Link2, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { api } from '../lib/api';
import { TopNav } from '../components/TopNav';
import { FilterSidebar } from '../components/FilterSidebar';
import { StatusChip } from '../components/StatusChip';
import { useToast } from '../contexts/ToastContext';

function ConfidenceBar({ band }: { band: 'Low' | 'Medium' | 'High' }) {
  const bars = 3;
  const filled = band === 'High' ? 3 : band === 'Medium' ? 2 : 1;
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 w-6 rounded-full ${
            i < filled
              ? band === 'High'
                ? 'bg-teal-500'
                : band === 'Medium'
                ? 'bg-amber-400'
                : 'bg-slate-400'
              : 'bg-slate-100'
          }`}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1">{band}</span>
    </div>
  );
}

function OverlapCard({ rel, onReviewed }: { rel: any; onReviewed: () => void }) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const { addToast } = useToast();

  const reviewMutation = useMutation({
    mutationFn: ({ action, reason }: { action: string; reason?: string }) =>
      api.reviewOverlap(rel.id, action, reason),
    onSuccess: (_, { action }) => {
      addToast({
        type: action === 'confirmed' ? 'success' : action === 'rejected' ? 'warning' : 'info',
        title: `Overlap ${action}`,
        message: action === 'confirmed' ? 'Link confirmed and audit recorded.' : `Action logged.`,
      });
      onReviewed();
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Action failed', message: e.message }),
  });

  const isConfirmed = rel.review_status === 'confirmed';
  const isRejected = rel.review_status === 'rejected';
  const isDeferred = rel.review_status === 'deferred';
  const isSuggested = rel.review_status === 'suggested';

  const otherCase = rel.case_a?.id ? rel.case_b : rel.case_a;

  return (
    <div className={`card p-4 ${isConfirmed ? 'border-teal-200 bg-teal-50/20' : isRejected ? 'border-red-200 bg-red-50/20' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link2 size={14} className="text-slate-400" />
          <span className="font-mono text-sm font-semibold text-slate-800">
            {rel.case_a?.case_code} ↔ {rel.case_b?.case_code}
          </span>
        </div>
        <ConfidenceBar band={rel.confidence_band} />
      </div>

      <div className="text-xs text-slate-600 mb-1">{rel.case_a?.bureau?.name} ↔ {rel.case_b?.bureau?.name}</div>

      {/* Reason chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(rel.reasons || []).map((r: any, i: number) => (
          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full border border-slate-200">
            {r.label}
          </span>
        ))}
      </div>

      {/* Status */}
      {isConfirmed && (
        <div className="flex items-center gap-2 text-sm text-teal-700 font-semibold mb-2">
          <CheckCircle size={14} />
          Link confirmed
          {rel.reviewer && <span className="text-xs font-normal text-slate-500">by {rel.reviewer.name}</span>}
        </div>
      )}
      {isRejected && (
        <div className="mb-2">
          <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
            <XCircle size={14} />
            Rejected
            {rel.reviewer && <span className="text-xs font-normal text-slate-500">by {rel.reviewer.name}</span>}
          </div>
          {rel.reason && (
            <p className="text-xs text-slate-500 mt-1 ml-5">Reason: {rel.reason}</p>
          )}
        </div>
      )}
      {isDeferred && (
        <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold mb-2">
          <Clock size={14} />
          Deferred — queued for later review
        </div>
      )}

      {/* Actions (only for suggested) */}
      {isSuggested && (
        <div className="space-y-2">
          {showRejectInput && (
            <div>
              <input
                id={`reject-reason-${rel.id}`}
                type="text"
                placeholder="Reason for rejection (required)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="input-field text-sm"
                aria-label="Rejection reason"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              id={`overlap-confirm-${rel.id}`}
              onClick={() => reviewMutation.mutate({ action: 'confirmed' })}
              disabled={reviewMutation.isPending}
              className="btn-primary text-xs py-1.5"
              aria-label="Confirm overlap link"
            >
              <CheckCircle size={12} />
              Confirm
            </button>
            <button
              id={`overlap-reject-${rel.id}`}
              onClick={() => {
                if (showRejectInput) {
                  if (!rejectReason.trim()) {
                    return;
                  }
                  reviewMutation.mutate({ action: 'rejected', reason: rejectReason });
                  setShowRejectInput(false);
                } else {
                  setShowRejectInput(true);
                }
              }}
              disabled={reviewMutation.isPending}
              className="btn-outline text-xs py-1.5 text-red-600 border-red-200 hover:bg-red-50"
              aria-label="Reject overlap link"
            >
              <XCircle size={12} />
              {showRejectInput ? 'Submit Reject' : 'Reject'}
            </button>
            <button
              id={`overlap-defer-${rel.id}`}
              onClick={() => reviewMutation.mutate({ action: 'deferred' })}
              disabled={reviewMutation.isPending}
              className="btn-outline text-xs py-1.5"
              aria-label="Defer overlap review"
            >
              <Clock size={12} />
              Defer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseTimeline({ cases }: { cases: any[] }) {
  const navigate = useNavigate();
  return (
    <div className="card p-4">
      <h3 className="section-header mb-4">Case Timeline</h3>
      <div className="relative">
        {cases.map((c: any, i: number) => (
          <div key={c.id} className="flex gap-3 mb-4 last:mb-0">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 mt-1 ${
                c.status === 'New' ? 'border-teal-500 bg-teal-100' :
                c.status === 'Overdue' ? 'border-red-500 bg-red-100' :
                c.status === 'Disposed' ? 'border-green-500 bg-green-100' :
                'border-slate-400 bg-slate-100'
              }`} />
              {i < cases.length - 1 && (
                <div className="w-0.5 flex-1 bg-slate-200 my-1" />
              )}
            </div>
            <div
              className="flex-1 pb-2 cursor-pointer hover:bg-slate-50 rounded-lg p-2 -ml-2 transition-colors"
              onClick={() => navigate(`/cases/${c.id}`)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-teal-700 font-semibold">{c.case_code}</span>
                <StatusChip status={c.status} />
              </div>
              <p className="text-sm text-slate-700 font-medium leading-tight">{c.subject}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">
                  {new Date(c.received_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                {c.bureau && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {c.bureau.name}
                  </span>
                )}
              </div>
              {/* Show linked cases */}
              {(c.relationships_as_a?.length > 0 || c.relationships_as_b?.length > 0) && (
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Link2 size={10} />
                  {(c.relationships_as_a?.length || 0) + (c.relationships_as_b?.length || 0)} link(s)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InstitutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ bureaus: [], region: '', status: '' });

  const isAicteId = id && (id.startsWith('DEMO-') || id.startsWith('PERM-'));

  const { data: institution, isLoading, error } = useQuery({
    queryKey: ['institution', id],
    queryFn: () => isAicteId ? api.getInstitutionByAicteId(id!) : api.getInstitution(id!),
  });

  const { data: overlaps = [] } = useQuery({
    queryKey: ['overlaps', institution?.id],
    queryFn: () => api.getOverlaps(institution?.id),
    enabled: !!institution?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F8FC]">
        <TopNav />
        <div className="flex items-center justify-center h-64 text-slate-400">Loading institution...</div>
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="min-h-screen bg-[#F5F8FC]">
        <TopNav />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-red-600">Institution not found.</p>
          <button onClick={() => navigate('/institutions')} className="btn-outline mt-3">Back</button>
        </div>
      </div>
    );
  }

  const overlapsForInst = (overlaps as any[]).filter(
    (r) => r.case_a?.institution_id === institution.id || r.case_b?.institution_id === institution.id
  );
  const suggestedOverlaps = overlapsForInst.filter((r) => r.review_status === 'suggested');

  // Filter cases by sidebar filters
  let filteredCases = (institution.cases || []) as any[];
  if (filters.status) filteredCases = filteredCases.filter((c: any) => c.status === filters.status);
  if (filters.region) {
    // Institution page—region filter doesn't make much sense, but we keep consistent UX
  }
  if (filters.bureaus?.length > 0) {
    filteredCases = filteredCases.filter((c: any) =>
      !c.bureau || filters.bureaus.includes(c.bureau.name)
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Back */}
        <button
          onClick={() => navigate('/institutions')}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          aria-label="Back to institutions list"
        >
          <ArrowLeft size={14} />
          Institutions
        </button>

        {/* Institution header */}
        <div className="card p-5 mb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={24} className="text-navy-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{institution.canonical_name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Hash size={12} />
                      AICTE ID: {institution.aicte_permanent_id}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      Region: {institution.region}
                    </span>
                    <span>{institution._count?.cases || institution.cases?.length || 0} cases</span>
                  </div>
                  {institution.aliases?.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      Also known as: {institution.aliases.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    institution.verification_status === 'verified'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : institution.verification_status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {institution.verification_status}
                  </span>
                  <span className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-xs font-medium">
                    Nothing merged automatically
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <FilterSidebar filters={filters} onChange={setFilters} />

          <div className="flex-1 grid grid-cols-2 gap-5">
            {/* Case Timeline */}
            <CaseTimeline cases={filteredCases} />

            {/* Overlaps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="section-header">
                  Overlaps
                  {suggestedOverlaps.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      — {suggestedOverlaps.length} possible link{suggestedOverlaps.length > 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
                {suggestedOverlaps.length > 0 && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                    <AlertTriangle size={10} className="inline mr-1" />
                    Needs review
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {overlapsForInst.length === 0 ? (
                  <div className="card p-4 text-sm text-slate-400 text-center">
                    No overlap relationships found.
                  </div>
                ) : (
                  overlapsForInst.map((rel: any) => (
                    <OverlapCard
                      key={rel.id}
                      rel={rel}
                      onReviewed={() => queryClient.invalidateQueries({ queryKey: ['overlaps', institution.id] })}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
