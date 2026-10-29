import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download, BarChart3, PieChart as PieIcon, ShieldAlert, CheckCircle2,
  Calendar, Layers, Filter, Lock, ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { api } from '../lib/api';
import { TopNav } from '../components/TopNav';
import { useToast } from '../contexts/ToastContext';

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const BUREAUS = ['Approval Bureau', 'Policy Bureau', 'Anti-Ragging Cell', 'Women Cell', 'PGRC'];
const STATUS_COLORS: Record<string, string> = {
  'New': '#0E7C86',
  'Under Process': '#94A3B8',
  'Transferred': '#3B82F6',
  'Disposed': '#10B981',
  'Overdue': '#EF4444',
};

export function ReportsPage() {
  const { addToast } = useToast();
  const [region, setRegion] = useState('');
  const [bureau, setBureau] = useState('');
  const [status, setStatus] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const queryParams: Record<string, string> = {};
  if (region) queryParams.region = region;
  if (bureau) queryParams.bureau = bureau;
  if (status) queryParams.status = status;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['report-stats', queryParams],
    queryFn: () => api.getReportStats(queryParams),
    refetchInterval: 30000,
  });

  const { data: auditEvents = [] } = useQuery({
    queryKey: ['audit-trail-recent'],
    queryFn: () => api.getAuditTrail(),
    refetchInterval: 30000,
  });

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await api.exportCsv(queryParams);
      addToast({
        type: 'success',
        title: 'Export generated',
        message: 'CSV file downloaded and export event logged to audit trail.',
      });
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Export failed',
        message: e.message || 'Could not export data.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const totalCases = stats?.total_cases || 0;
  const openCases = stats?.open_cases || 0;
  const overdueCases = stats?.overdue_cases || 0;
  const complianceRate = totalCases > 0 ? Math.round(((totalCases - overdueCases) / totalCases) * 100) : 100;

  const bureauData = (stats?.by_bureau || []).map((b: any) => ({
    name: b.bureau,
    Open: b.open,
    Total: b.total,
  }));

  const statusData = (stats?.by_status || []).map((s: any) => ({
    name: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#64748B',
  }));

  const ageingData = (stats?.ageing_buckets || []).map((a: any) => ({
    bucket: `${a.bucket} Days`,
    count: a.count,
  }));

  const regionData = (stats?.by_region || []).map((r: any) => ({
    region: r.region,
    count: r.count,
  }));

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="text-teal-600" size={24} />
              AICTE Compliance & Performance Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Cross-bureau SLA compliance metrics, grievance turnaround times, and immutable audit logs.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="btn-primary"
            aria-label="Export filtered cases as CSV"
          >
            <Download size={15} />
            {isExporting ? 'Generating CSV...' : 'Export Filtered CSV'}
          </button>
        </div>

        {/* Filter bar */}
        <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-2">
            <Filter size={13} />
            Filter By:
          </span>

          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
            aria-label="Filter by region"
          >
            <option value="">All Regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            value={bureau}
            onChange={(e) => setBureau(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
            aria-label="Filter by bureau"
          >
            <option value="">All Bureaus / Cells</option>
            {BUREAUS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {['New', 'Under Process', 'Transferred', 'Disposed', 'Overdue'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {(region || bureau || status) && (
            <button
              onClick={() => { setRegion(''); setBureau(''); setStatus(''); }}
              className="text-xs text-teal-600 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Metric KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wide">Total Complaints</span>
              <Layers size={16} className="text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2">{totalCases}</p>
            <p className="text-xs text-slate-400 mt-1">Logged across all cells</p>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wide">Active In Progress</span>
              <Calendar size={16} className="text-teal-500" />
            </div>
            <p className="text-3xl font-bold text-teal-700 mt-2">{openCases}</p>
            <p className="text-xs text-slate-400 mt-1">Pending investigation/resolution</p>
          </div>

          <div className="card p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Overdue SLA</span>
              <ShieldAlert size={16} className="text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600 mt-2">{overdueCases}</p>
            <p className="text-xs text-red-500 mt-1">Breached response window</p>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wide">SLA Compliance</span>
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-700 mt-2">{complianceRate}%</p>
            <p className="text-xs text-slate-400 mt-1">Within standard timeline</p>
          </div>
        </div>

        {/* Charts Row 1: Bureau Breakdown & Status Donut */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* By Bureau */}
          <div className="card p-5">
            <h3 className="section-header text-sm mb-4">Case Distribution by Bureau / Cell</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bureauData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Total" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Open" fill="#0E7C86" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By Status */}
          <div className="card p-5">
            <h3 className="section-header text-sm mb-4">Complaint Status Breakdown</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Ageing Buckets & Regional Distribution */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Ageing */}
          <div className="card p-5">
            <h3 className="section-header text-sm mb-4">Ageing of Unresolved Cases</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageingData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regional */}
          <div className="card p-5">
            <h3 className="section-header text-sm mb-4">Regional Complaint Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Audit Trail Section */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="section-header text-sm">System Audit Log</h3>
              <span className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                <Lock size={10} />
                Append-only
              </span>
            </div>
            <span className="text-xs text-slate-400">Section 43A Compliant</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-left">
                  <th className="px-3 py-2 font-semibold">Timestamp</th>
                  <th className="px-3 py-2 font-semibold">Actor</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                  <th className="px-3 py-2 font-semibold">Target Entity</th>
                  <th className="px-3 py-2 font-semibold">Metadata / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(auditEvents as any[]).slice(0, 10).map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                      {new Date(ev.created_at).toLocaleString('en-GB')}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-700">
                      {ev.actor?.name || 'System'}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono bg-slate-100 text-teal-700 px-1.5 py-0.5 rounded font-semibold">
                        {ev.action}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {ev.entity_type}:{ev.entity_id?.slice(0, 8)}...
                    </td>
                    <td className="px-3 py-2 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                      {JSON.stringify(ev.metadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
