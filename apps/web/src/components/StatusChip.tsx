import React from 'react';

type StatusType = 'New' | 'Under Process' | 'Transferred' | 'Disposed' | 'Overdue';

const STATUS_STYLES: Record<StatusType, string> = {
  'New': 'bg-teal-50 text-teal-700 border border-teal-200',
  'Under Process': 'bg-slate-100 text-slate-600 border border-slate-200',
  'Transferred': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Disposed': 'bg-green-50 text-green-700 border border-green-200',
  'Overdue': 'bg-red-50 text-red-700 border border-red-200',
};

const STATUS_DOT: Record<StatusType, string> = {
  'New': 'bg-teal-500',
  'Under Process': 'bg-slate-400',
  'Transferred': 'bg-blue-500',
  'Disposed': 'bg-green-500',
  'Overdue': 'bg-red-500',
};

export function StatusChip({ status }: { status: string }) {
  const style = STATUS_STYLES[status as StatusType] || 'bg-slate-100 text-slate-600 border border-slate-200';
  const dot = STATUS_DOT[status as StatusType] || 'bg-slate-400';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}
