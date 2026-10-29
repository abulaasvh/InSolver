import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, Clock, CheckCircle2, ChevronRight, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import { TopNav } from '../components/TopNav';
import { StatusChip } from '../components/StatusChip';

export function AlertsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'unread' | 'all'>('unread');

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', 'unread'],
    queryFn: api.getUnreadAlerts,
    refetchInterval: 15000,
  });

  const alertItems = alerts as any[];

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      <TopNav />
      <div className="max-w-4xl mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="text-teal-600" size={24} />
              SLA & Coordination Alerts
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Active alerts triggered by approaching deadlines, SLA breaches, and cross-cell coordination notices.
            </p>
          </div>
          <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold rounded-full">
            {alertItems.length} Active Alert{alertItems.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Alerts list */}
        {isLoading ? (
          <div className="card p-12 text-center text-slate-400">Loading alerts...</div>
        ) : alertItems.length === 0 ? (
          <div className="card p-12 text-center text-slate-400">
            <CheckCircle2 size={36} className="text-teal-500 mx-auto mb-2 opacity-70" />
            <p className="text-base font-semibold text-slate-700">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No unread alerts or pending SLA escalations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertItems.map((al: any) => {
              const isOverdue = al.rule === 'SLA_OVERDUE';
              const isDueSoon = al.rule === 'SLA_DUE_SOON';

              return (
                <div
                  key={al.id}
                  onClick={() => navigate(`/cases/${al.case_id}`)}
                  className={`card p-4 transition-all hover:shadow-md cursor-pointer flex items-center justify-between group ${
                    isOverdue ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-amber-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                      isOverdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {isOverdue ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-700">
                          {al.case?.case_code}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isOverdue ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isOverdue ? 'SLA Overdue' : 'Due Soon'}
                        </span>
                        {al.case?.status && <StatusChip status={al.case.status} />}
                      </div>

                      <p className="text-sm font-medium text-slate-800 mt-1">
                        {al.case?.subject || 'Case SLA deadline notification'}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Triggered {new Date(al.triggered_at).toLocaleString('en-GB')}
                        </span>
                        <span>Delivery: {al.delivery_status}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
