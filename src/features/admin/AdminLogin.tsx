import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { adminClient } from '@/services/api/adminClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/store/toastStore';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState('admin@applyone.co');
  const [password, setPassword] = useState('Admin@ApplyOne2026!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Missing credentials', 'Please enter admin ID and password.');
      return;
    }

    setLoading(true);
    try {
      // Ensure the default admin exists in MongoDB
      await adminClient.seedAdmin().catch(() => {});

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
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

        <Card className="border-slate-800/80 bg-slate-900/90 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">
              Administrator Access
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-1">
              Restricted management console. Authorized company personnel only.
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 text-sm"
                  />
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-[11px] text-slate-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>
                  Default Credentials: <strong className="text-slate-200">admin@applyone.co</strong> / <strong className="text-slate-200">Admin@ApplyOne2026!</strong>
                </span>
              </div>

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
      </div>
    </div>
  );
}
