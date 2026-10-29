import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const DEMO_USERS = [
  {
    role: 'Supervisor',
    name: 'A. Rao',
    email: 'a.rao@aicte.gov.in',
    desc: 'Triage, route verification, overlap review & escalation',
    color: 'border-teal-500 bg-teal-50 text-teal-800',
  },
  {
    role: 'Desk Officer',
    name: 'S. Iyer',
    email: 's.iyer@aicte.gov.in',
    desc: 'PGRC Cell case owner, investigation & resolution',
    color: 'border-blue-500 bg-blue-50 text-blue-800',
  },
  {
    role: 'Executive / Management',
    name: 'R. Sharma',
    email: 'r.sharma@aicte.gov.in',
    desc: 'National oversight, cross-cell KPI & SLA dashboards',
    color: 'border-purple-500 bg-purple-50 text-purple-800',
  },
  {
    role: 'Regional Officer',
    name: 'V. Nair',
    email: 'v.nair@aicte.gov.in',
    desc: 'South Regional Office jurisdiction',
    color: 'border-amber-500 bg-amber-50 text-amber-800',
  },
  {
    role: 'Auditor',
    name: 'Independent Auditor',
    email: 'auditor@aicte.gov.in',
    desc: 'Read-only immutable audit trail & compliance verification',
    color: 'border-slate-500 bg-slate-50 text-slate-800',
  },
];

export function LoginPage() {
  const [email, setEmail] = useState('a.rao@aicte.gov.in');
  const [password, setPassword] = useState('Demo@1234');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await login(targetEmail, targetPassword);
      addToast({
        type: 'success',
        title: 'Logged in successfully',
        message: `Welcome to InSolver AICTE Portal`,
      });
      navigate('/cases');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
      addToast({
        type: 'error',
        title: 'Authentication failed',
        message: err.message || 'Please verify email and password',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Demo@1234');
    handleLogin(demoEmail, 'Demo@1234');
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col justify-between">
      {/* Top synthetic banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-xs text-amber-800 font-medium">
        <Shield size={14} className="text-amber-600" />
        <span>InSolver · Smart India Hackathon 2026 Prototype · Problem Statement SIH26264 · Synthetic AICTE Environment</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid md:grid-cols-5 gap-8 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Left panel: Branding & Role Switcher */}
          <div className="md:col-span-2 bg-[#14325C] text-white p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl font-black tracking-tight text-white">In</span>
                <span className="text-2xl font-black tracking-tight text-teal-400">Solver</span>
              </div>
              
              <h2 className="text-lg font-bold text-white mb-2 leading-snug">
                AICTE Complaint Monitoring & Coordination
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed mb-6">
                Unified cross-cell intelligence platform resolving institutional complaints, duplicate prevention, and automated SLA enforcement.
              </p>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-teal-300">
                  Quick Demo Role Switcher
                </p>
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.email}
                    onClick={() => handleQuickLogin(u.email)}
                    type="button"
                    className="w-full text-left p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{u.role}</span>
                      <UserCheck size={12} className="text-teal-300 opacity-70 group-hover:opacity-100" />
                    </div>
                    <p className="text-[10px] text-slate-300 truncate">{u.name} · {u.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-slate-400">
              Default password for all test roles is <code className="text-teal-300 font-mono">Demo@1234</code>
            </div>
          </div>

          {/* Right panel: Sign in form */}
          <div className="md:col-span-3 p-8 flex flex-col justify-center">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Sign in to your account</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your official AICTE portal credentials or choose a test role from the left.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@aicte.gov.in"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In to InSolver'}
                {!isSubmitting && <ArrowRight size={14} />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Security: RBAC & Audit Log Enforced</span>
              <span>v1.0.0 SIH Prototype</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
        InSolver · AICTE Central Complaint Resolution System · Synthetic demo dataset
      </footer>
    </div>
  );
}
