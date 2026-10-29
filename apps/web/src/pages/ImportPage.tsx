import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, FileText, CheckCircle2, AlertCircle, RefreshCw,
  ArrowRight, Download, Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { TopNav } from '../components/TopNav';
import { useToast } from '../contexts/ToastContext';

interface CsvRow {
  aicte_permanent_id: string;
  subject: string;
  region?: string;
  source_system?: string;
  source_case_id?: string;
  received_at?: string;
}

const SAMPLE_CSV_DATA = `aicte_permanent_id,subject,region,source_system,source_case_id,received_at
DEMO-1042,Hostel mess cleanliness and drinking water hygiene complaint,South,AICTE_PORTAL,BATCH-2026-001,2026-10-28
DEMO-2011,Delay in issuance of final degree transcript,North,AICTE_PORTAL,BATCH-2026-002,2026-10-27
DEMO-3044,Dispute over library caution deposit refund,West,PGRC_PORTAL,BATCH-2026-003,2026-10-26
DEMO-4098,Harassment complaint by polytechnic workshop apprentice,East,AICTE_PORTAL,BATCH-2026-004,2026-10-25
DEMO-5012,Pharmacy lab chemicals expired and equipment unusable,Central,AICTE_PORTAL,BATCH-2026-005,2026-10-24`;

export function ImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const [ingesting, setIngesting] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    created: number;
    duplicates: number;
    errors: string[];
  } | null>(null);

  const parseCsv = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = parts[idx] || '';
      });

      if (obj.aicte_permanent_id && obj.subject) {
        rows.push({
          aicte_permanent_id: obj.aicte_permanent_id,
          subject: obj.subject,
          region: obj.region,
          source_system: obj.source_system || 'CSV_IMPORT',
          source_case_id: obj.source_case_id || `IMPORT-${Date.now()}-${i}`,
          received_at: obj.received_at || new Date().toISOString().split('T')[0],
        });
      }
    }

    setParsedRows(rows);
    setResults(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    setRawText(SAMPLE_CSV_DATA);
    parseCsv(SAMPLE_CSV_DATA);
    addToast({
      type: 'info',
      title: 'Sample CSV loaded',
      message: '5 valid synthetic records loaded for demonstration.',
    });
  };

  const handleRunIngestion = async () => {
    if (parsedRows.length === 0) return;
    setIngesting(true);

    let created = 0;
    let duplicates = 0;
    const errors: string[] = [];

    for (const row of parsedRows) {
      try {
        const res = await api.registerCase(row);
        if (res.duplicate) {
          duplicates++;
        } else {
          created++;
        }
      } catch (err: any) {
        errors.push(`${row.aicte_permanent_id}: ${err.message}`);
      }
    }

    setResults({
      total: parsedRows.length,
      created,
      duplicates,
      errors,
    });
    setIngesting(false);
    queryClient.invalidateQueries({ queryKey: ['cases'] });
    addToast({
      type: 'success',
      title: 'Batch Ingestion Finished',
      message: `${created} cases registered, ${duplicates} duplicates skipped.`,
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Upload className="text-teal-600" size={24} />
              Bulk Import Cases (CSV)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Batch intake complaints from institutional grievance portals. Features automatic deduplication and keyword routing.
            </p>
          </div>

          <button onClick={loadSample} className="btn-outline" aria-label="Load demo CSV dataset">
            <Sparkles size={14} className="text-amber-500" />
            Load Sample CSV
          </button>
        </div>

        {/* Upload Drop Zone Card */}
        <div className="card p-6 mb-6">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <Upload size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Choose a CSV file to import</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Columns: aicte_permanent_id, subject, region, source_system, source_case_id, received_at
            </p>

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600 cursor-pointer text-slate-500"
            />
          </div>
        </div>

        {/* Results Banner if finished */}
        {results && (
          <div className="card p-5 mb-6 border-l-4 border-l-teal-500 bg-teal-50/30">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="text-teal-600" size={16} />
              Ingestion Execution Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500">Total Rows:</span>
                <p className="text-lg font-bold text-slate-800">{results.total}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-teal-600 font-semibold">New Cases Registered:</span>
                <p className="text-lg font-bold text-teal-700">{results.created}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-amber-600 font-semibold">Duplicates Detected (Idempotent):</span>
                <p className="text-lg font-bold text-amber-700">{results.duplicates}</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="mt-3 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                <p className="font-semibold mb-1">Errors ({results.errors.length}):</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {results.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => navigate('/cases')}
              className="btn-primary text-xs mt-4"
            >
              View Cases Dashboard
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-header text-sm">
                Ready for Import ({parsedRows.length} records)
              </h3>
              <button
                onClick={handleRunIngestion}
                disabled={ingesting}
                className="btn-primary"
              >
                {ingesting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {ingesting ? 'Processing Ingestion...' : 'Execute Batch Import'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-left">
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">AICTE ID</th>
                    <th className="px-3 py-2 font-semibold">Subject</th>
                    <th className="px-3 py-2 font-semibold">Region</th>
                    <th className="px-3 py-2 font-semibold">Source System</th>
                    <th className="px-3 py-2 font-semibold">Received Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                      <td className="px-3 py-2 font-mono font-semibold text-teal-700">
                        {r.aicte_permanent_id}
                      </td>
                      <td className="px-3 py-2 text-slate-700 max-w-sm truncate">{r.subject}</td>
                      <td className="px-3 py-2 text-slate-500">{r.region || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{r.source_system}</td>
                      <td className="px-3 py-2 text-slate-400">{r.received_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
