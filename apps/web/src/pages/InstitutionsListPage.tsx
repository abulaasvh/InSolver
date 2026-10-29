import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, MapPin, Hash, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { TopNav } from '../components/TopNav';
import { FilterSidebar } from '../components/FilterSidebar';

export function InstitutionsListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ bureaus: [], region: '', status: '' });
  const [search, setSearch] = useState('');
  const [aicteSearch, setAicteSearch] = useState('');

  const params: Record<string, string> = { limit: '30' };
  if (filters.region) params.region = filters.region;
  if (search) params.search = search;

  const { data, isLoading } = useQuery({
    queryKey: ['institutions', params],
    queryFn: () => api.getInstitutions(params),
  });

  const institutions: any[] = data?.data || [];

  const handleAicteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (aicteSearch.trim()) {
      navigate(`/institutions/${aicteSearch.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Institutions</h1>
        </div>

        {/* AICTE ID quick lookup (AC-01) */}
        <form onSubmit={handleAicteSearch} className="card p-4 mb-5 flex gap-3">
          <div className="flex-1">
            <label htmlFor="aicte-id-search" className="block text-xs font-medium text-slate-600 mb-1">
              Search by exact AICTE Permanent ID (AC-01)
            </label>
            <input
              id="aicte-id-search"
              type="text"
              placeholder="e.g. DEMO-1042"
              value={aicteSearch}
              onChange={(e) => setAicteSearch(e.target.value)}
              className="input-field"
              aria-label="Search institution by AICTE ID"
            />
          </div>
          <button
            type="submit"
            className="btn-primary self-end"
            aria-label="Look up institution by AICTE ID"
          >
            <Search size={14} />
            Look up
          </button>
        </form>

        {/* General search */}
        <input
          id="institution-text-search"
          type="search"
          placeholder="Search by name, alias..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field mb-5"
          aria-label="Search institutions by name"
        />

        <div className="flex gap-6">
          <FilterSidebar filters={filters} onChange={setFilters} />

          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">Loading institutions...</div>
            ) : institutions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No institutions found.</div>
            ) : (
              <div className="grid gap-3">
                {institutions.map((inst: any) => (
                  <div
                    key={inst.id}
                    className="card p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => navigate(`/institutions/${inst.id}`)}
                    aria-label={`View institution ${inst.canonical_name}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 size={18} className="text-[#14325C]" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{inst.canonical_name}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Hash size={10} />
                            {inst.aicte_permanent_id}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {inst.region}
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            {inst._count?.cases || 0} cases
                          </span>
                          <span className={`px-2 py-0.5 rounded ${
                            inst.verification_status === 'verified'
                              ? 'bg-green-50 text-green-600'
                              : inst.verification_status === 'pending'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {inst.verification_status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
