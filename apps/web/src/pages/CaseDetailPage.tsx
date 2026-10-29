import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, AlertTriangle, Edit3, Save, X, User, Clock, Calendar,
  MessageSquare, ChevronRight, CheckCircle, Lock
} from 'lucide-react';
import { api } from '../lib/api';
import { TopNav } from '../components/TopNav';
import { StatusChip } from '../components/StatusChip';
import { useToast } from '../contexts/ToastContext';

function AuditTrailCard({ events, caseId }: { events: any[]; caseId: string }) {
  const { data: auditEvents = [] } = useQuery({
    queryKey: ['audit', 'case', caseId],
    queryFn: () => api.getAuditTrail('case', caseId),
  });

  const allEvents = [
    ...(events || []).map((e: any) => ({
      ...e,
      source: 'case_event',
      label: e.event_type,
      text: e.remarks,
      time: e.created_at,
      actor: e.actor?.name || 'System',
    })),
    ...(auditEvents as any[]).map((e: any) => ({
      ...e,
      source: 'audit',
      label: e.action,
      text: JSON.stringify(e.metadata || {}).replace(/[{}"]/g, '').replace(/,/g, ', ').slice(0, 120),
      time: e.created_at,
      actor: e.actor?.name || 'System',
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="section-header">Audit Trail</h3>
        <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
          <Lock size={10} />
          Append-only
        </span>
      </div>

      {allEvents.length === 0 ? (
        <p className="text-sm text-slate-400">No events yet.</p>
      ) : (
        <div className="space-y-3">
          {allEvents.slice(0, 15).map((e: any, i: number) => (
            <div key={e.id + i} className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                    {e.label?.replace(/_/g, ' ').replace(/\./g, ' ›')}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(e.time).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className="text-xs text-slate-400">by {e.actor}</span>
                </div>
                {e.text && (
                  <p className="text-xs text-slate-500 mt-0.5 ml-0.5">{e.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditableField({
  label,
  value,
  onSave,
  type = 'text',
  icon: Icon,
}: {
  label: string;
  value: string;
  onSave: (val: string) => void;
  type?: string;
  icon?: any;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />}
      <div className="flex-1">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        {editing ? (
          <div className="flex gap-2">
            <input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="input-field text-sm flex-1"
              aria-label={`Edit ${label}`}
            />
            <button onClick={handleSave} className="btn-primary py-1 px-2 text-xs" aria-label={`Save ${label}`}>
              <Save size={12} />
            </button>
            <button onClick={() => { setEditing(false); setDraft(value); }} className="btn-outline py-1 px-2 text-xs" aria-label="Cancel edit">
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="text-sm text-slate-700">{value || '—'}</span>
            <button
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-100 rounded"
              aria-label={`Edit ${label}`}
            >
              <Edit3 size={12} className="text-slate-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: caseRecord, isLoading, error } = useQuery({
    queryKey: ['case', id],
    queryFn: () => api.getCase(id!),
    refetchInterval: 30000,
  });

  const { data: bureaus = [] } = useQuery({
    queryKey: ['bureaus'],
    queryFn: api.getBureaus,
  });

  const { data: queue = [] } = useQuery({
    queryKey: ['my-queue'],
    queryFn: api.getMyQueue,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateCase(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      addToast({ type: 'success', title: 'Case updated', message: 'Changes saved and audited.' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Update failed', message: e.message }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F8FC]"><TopNav />
        <div className="flex items-center justify-center h-64 text-slate-400">Loading case...</div>
      </div>
    );
  }

  if (error || !caseRecord) {
    return (
      <div className="min-h-screen bg-[#F5F8FC]"><TopNav />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-red-600">Case not found.</p>
          <button onClick={() => navigate('/cases')} className="btn-outline mt-3">Back to Cases</button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const dueAt = caseRecord.due_at ? new Date(caseRecord.due_at) : null;
  const daysUntilDue = dueAt ? Math.ceil((dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 2 && daysUntilDue >= 0;
  const isOverdue = caseRecord.status === 'Overdue' || (daysUntilDue !== null && daysUntilDue < 0);

  const handleFieldSave = (field: string, value: string) => {
    const data: any = {};
    if (field === 'next_action') data.next_action = value;
    else if (field === 'due_at') data.due_at = value;
    else if (field === 'coordination_note') data.coordination_note = value;
    else if (field === 'lead_team') data.lead_team = value;
    updateMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Back */}
        <button
          onClick={() => navigate('/cases')}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          aria-label="Back to cases"
        >
          <ArrowLeft size={14} />
          Cases
        </button>

        {/* Case header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {caseRecord.case_code} · {caseRecord.subject}
            </h1>
            <StatusChip status={caseRecord.status} />
          </div>
          <p className="text-sm text-slate-500">
            {caseRecord.institution?.canonical_name} · {caseRecord.bureau?.name || 'Unassigned'}
            {' · '}
            <span className="text-xs text-slate-400">
              Source: {caseRecord.source_system} / {caseRecord.source_case_id}
            </span>
            {' · '}
            <span className="text-xs text-slate-400">
              Synced: {new Date(caseRecord.synced_at).toLocaleString('en-GB')}
            </span>
          </p>
        </div>

        {/* Due Soon / Overdue Banner */}
        {(isDueSoon || isOverdue) && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-5 border ${
            isOverdue
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <AlertTriangle size={16} />
            <span className="font-semibold text-sm">
              {isOverdue ? 'Overdue' : 'Due soon'}
            </span>
            <span className="text-sm">
              {isOverdue
                ? `Reply was due ${Math.abs(daysUntilDue!)} day(s) ago`
                : `Reply due in ${daysUntilDue} day(s)`}
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-5">
          {/* Main content: 2 cols */}
          <div className="col-span-2 space-y-5">
            {/* Case fields */}
            <div className="card p-5 space-y-4">
              <h3 className="section-header border-b border-slate-100 pb-3">Case Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <EditableField
                  label="Owner"
                  value={caseRecord.officer?.name || 'Unassigned'}
                  icon={User}
                  onSave={(val) => {}}
                />
                <div className="flex items-start gap-2">
                  <Clock size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-0.5">Last action</p>
                    <p className="text-sm text-slate-700">{caseRecord.last_action || '—'}</p>
                    {caseRecord.last_action_at && (
                      <p className="text-xs text-slate-400">
                        {new Date(caseRecord.last_action_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                <EditableField
                  label="Next action"
                  value={caseRecord.next_action || ''}
                  icon={ChevronRight}
                  onSave={(val) => handleFieldSave('next_action', val)}
                />
                <EditableField
                  label="Deadline"
                  value={caseRecord.due_at ? new Date(caseRecord.due_at).toISOString().split('T')[0] : ''}
                  type="date"
                  icon={Calendar}
                  onSave={(val) => handleFieldSave('due_at', val)}
                />
              </div>

              {/* Coordination Note */}
              {(caseRecord.coordination_note || caseRecord.lead_team) && (
                <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={14} className="text-teal-600" />
                    <span className="text-sm font-semibold text-teal-700">Coordination note</span>
                  </div>
                  {caseRecord.lead_team && (
                    <p className="text-sm text-teal-700">
                      <span className="font-medium">Lead team:</span> {caseRecord.lead_team}
                    </p>
                  )}
                  {caseRecord.coordination_note && (
                    <p className="text-sm text-teal-700 mt-1">{caseRecord.coordination_note}</p>
                  )}
                </div>
              )}

              {/* Add coordination note */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                <EditableField
                  label="Add coordination note"
                  value={caseRecord.coordination_note || ''}
                  icon={MessageSquare}
                  onSave={(val) => handleFieldSave('coordination_note', val)}
                />
              </div>
            </div>

            {/* Case Events / Case relationships */}
            {((caseRecord.relationships_as_a?.length > 0) || (caseRecord.relationships_as_b?.length > 0)) && (
              <div className="card p-5">
                <h3 className="section-header mb-3">Linked Cases</h3>
                <div className="space-y-2">
                  {[...(caseRecord.relationships_as_a || []), ...(caseRecord.relationships_as_b || [])].map((rel: any) => {
                    const other = rel.case_a?.case_code === caseRecord.case_code ? rel.case_b : rel.case_a;
                    return (
                      <div key={rel.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                          <span className="font-mono text-sm font-semibold text-teal-700">{other?.case_code}</span>
                          <span className="ml-2 text-xs text-slate-500">{other?.bureau?.name}</span>
                          <span className="ml-2 text-xs text-slate-400">{other?.subject?.slice(0, 60)}...</span>
                        </div>
                        <StatusChip status={rel.review_status === 'confirmed' ? 'Disposed' : rel.review_status === 'rejected' ? 'Overdue' : 'New'} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Audit trail */}
            <AuditTrailCard events={caseRecord.events || []} caseId={caseRecord.id} />
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* My Queue */}
            <div className="card p-4">
              <h3 className="section-header mb-3">My Queue</h3>
              {(queue as any[]).length === 0 ? (
                <p className="text-xs text-slate-400">No cases in queue.</p>
              ) : (
                <div className="space-y-2">
                  {(queue as any[]).slice(0, 8).map((q: any) => (
                    <div
                      key={q.id}
                      onClick={() => navigate(`/cases/${q.id}`)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        q.id === id ? 'bg-teal-50 border border-teal-200' : 'hover:bg-slate-50'
                      }`}
                      aria-label={`View queue case ${q.case_code}`}
                    >
                      <div>
                        <p className="font-mono text-xs font-semibold text-teal-700">{q.case_code}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[140px]">{q.subject}</p>
                      </div>
                      <StatusChip status={q.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status update */}
            <div className="card p-4">
              <h3 className="section-header mb-3">Update Status</h3>
              <div className="space-y-2">
                {['New', 'Under Process', 'Transferred', 'Disposed'].map((s) => (
                  <button
                    key={s}
                    id={`status-update-${s.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => updateMutation.mutate({ status: s })}
                    disabled={caseRecord.status === s || updateMutation.isPending}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      caseRecord.status === s
                        ? 'bg-teal-50 text-teal-700 border border-teal-200 font-semibold'
                        : 'hover:bg-slate-50 text-slate-600 border border-slate-100'
                    }`}
                    aria-label={`Set status to ${s}`}
                  >
                    {s}
                    {caseRecord.status === s && <CheckCircle size={12} className="inline ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
