import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/store/toastStore';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, BriefcaseBusiness, CheckCircle2 } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Missing credentials', 'Please enter admin ID and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.success) {
        toast.success('Admin Authenticated', 'Welcome to the ApplyOne Executive Portal.');
        navigate('/portal-access');
      } else {
        toast.error('Authentication Failed', result.error || result.message || 'Invalid admin credentials.');
      }
    } catch (err: any) {
      toast.error('Login Error', err.message || 'Unable to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center px-4 py-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10 grid lg:grid-cols-2 overflow-hidden rounded-3xl border border-slate-800 shadow-2xl shadow-blue-950/50">
        <motion.section initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950">
          <div className="flex items-center gap-3"><img src="/logo.png" alt="ApplyOne" className="w-9 h-9 rounded-lg object-contain bg-white/10" /><span className="font-extrabold text-white text-lg">Apply<span className="text-cyan-300">One</span></span></div>
          <div><div className="w-12 h-12 mb-5 rounded-2xl bg-cyan-300/15 text-cyan-200 flex items-center justify-center"><BriefcaseBusiness className="w-6 h-6" /></div><h1 className="text-3xl font-extrabold leading-tight text-white">Operations, applications, and subscribers—one secure workspace.</h1><p className="mt-4 text-sm leading-6 text-blue-100/80">Manage the ApplyOne platform with real-time operational visibility and protected administration.</p></div>
          <div className="space-y-2 text-sm text-blue-100/90"><p className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-300" /> Role-protected access</p><p className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-300" /> Session validation and audit-aware operations</p></div>
        </motion.section>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/95 p-6 sm:p-10">
        <div className="flex justify-center mb-6 lg:hidden">
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl shadow-xl">
            <img src="/logo.png" alt="ApplyOne" className="w-8 h-8 object-contain rounded-lg" />
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base tracking-tight leading-none">
                Apply<span className="text-cyan-400">One</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
                Executive Portal
              </span>
            </div>
          </div>
        </div>

        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">
              Welcome back, Admin
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-1">
              Manage ApplyOne operations from one powerful workspace.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin ID / Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@applyone.co"
                    autoComplete="username"
                    required
                    className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                    className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 text-slate-400"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-cyan-500" /> Remember this device</label><a href="/forgot-password" className="text-cyan-400 hover:text-cyan-300">Forgot password?</a></div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all text-sm mt-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : (
                  <>
                    Sign In to Portal <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
