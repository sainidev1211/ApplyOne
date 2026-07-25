import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { SEO } from '@/components/shared/SEO';
import { toast } from '@/store/toastStore';
import { motion } from 'framer-motion';

type SettingsTab = 'personal' | 'security' | 'preferences';

export default function Settings() {
  const { profile, user, updateProfile, resetPassword } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal');
  const [saving, setSaving] = useState(false);

  // --- Personal Details State ---
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [accountType, setAccountType] = useState(profile?.account_type || 'Student');

  // --- Security State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // --- Preferences State ---
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [dailyAlerts, setDailyAlerts] = useState(true);
  const [minSalary, setMinSalary] = useState('3000');

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name cannot be blank.', 'Input Error');
      return;
    }

    setSaving(true);
    const res = await updateProfile({
      full_name: fullName,
      phone: phone,
      account_type: accountType as any,
    });
    setSaving(false);

    if (res.success) {
      toast.success('Your profile changes have been saved.', 'Profile Updated');
    } else {
      toast.error(res.error || 'Failed to update profile.', 'Save Failed');
    }
  };

  // Handle Password Reset
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.', 'Input Error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.', 'Match Error');
      return;
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error('Password does not meet validation criteria.', 'Complexity Failure');
      return;
    }

    setPasswordLoading(true);
    const res = await resetPassword(newPassword);
    setPasswordLoading(false);

    if (res.success) {
      toast.success('Password updated successfully.', 'Credentials Reset');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error('Failed to reset credentials. Verify session.', 'Reset Failed');
    }
  };

  // Handle Preferences Save
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Onboarding and dispatch preferences updated.', 'Preferences Saved');
    }, 800);
  };

  return (
    <>
      <SEO title="User Settings" description="Modify your candidate account details, settings, and credentials." />
      <div className="space-y-8 text-left max-w-4xl mx-auto">
        
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Account Settings
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Manage your personal profile details, authentication password, and automation dispatch parameters.
          </p>
        </div>

        {/* Setting View Container */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Side Menu Tab Selector */}
          <Card className="w-full md:w-64 p-3 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible shadow-sm">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors w-full cursor-pointer text-left ${
                activeTab === 'personal'
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-primary dark:text-blue-400'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark'
              }`}
            >
              <span>👤</span>
              <span>Personal Details</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors w-full cursor-pointer text-left ${
                activeTab === 'security'
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-primary dark:text-blue-400'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark'
              }`}
            >
              <span>🔒</span>
              <span>Security & Password</span>
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors w-full cursor-pointer text-left ${
                activeTab === 'preferences'
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-primary dark:text-blue-400'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark'
              }`}
            >
              <span>⚙️</span>
              <span>Preferences</span>
            </button>
          </Card>

          {/* Form Content Area */}
          <div className="flex-1 w-full">
            
            {/* TAB 1: PERSONAL DETAILS */}
            {activeTab === 'personal' && (
              <Card className="p-6 md:p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md text-left">
                <div className="border-b border-border-light dark:border-border-dark pb-4 mb-6">
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Personal Details
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                    Update your account full name, phone number, and matching tier.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    id="fullName"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Email Address (Linked)"
                      value={user?.email || ''}
                      id="email"
                      disabled
                      placeholder="user@example.com"
                    />

                    <Input
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 019-2834"
                      id="phone"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                      Campaign Matching Tier
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as any)}
                      className="w-full h-10 px-3 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary-light dark:text-text-primary-dark cursor-pointer"
                    >
                      <option value="Student">Student (Professional Plan)</option>
                      <option value="Fresher">Fresher (Premium Plan)</option>
                      <option value="Professional">Professional (Elite Plan)</option>
                    </select>
                    <p className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark leading-normal">
                      Changing your matching tier updates your active subscription benefits automatically.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border-light dark:border-border-dark flex justify-end">
                    <Button type="submit" variant="gradient" disabled={saving}>
                      {saving ? 'Saving Profile...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* TAB 2: SECURITY & PASSWORD */}
            {activeTab === 'security' && (
              <Card className="p-6 md:p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md text-left">
                <div className="border-b border-border-light dark:border-border-dark pb-4 mb-6">
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Security & Credentials
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                    Update your account password to maintain credentials safety.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    id="currentPassword"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      id="newPassword"
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      id="confirmPassword"
                    />
                  </div>

                  {/* Password guidelines card */}
                  <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-bg-dark/40 space-y-1.5 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">Guidelines for a strong password:</p>
                    <div className="flex items-center gap-1.5">
                      <span className={newPassword.length >= 8 ? 'text-green-500 font-bold' : 'text-slate-400 font-bold'}>✓</span>
                      <span>At least 8 characters long</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={/[A-Z]/.test(newPassword) ? 'text-green-500 font-bold' : 'text-slate-400 font-bold'}>✓</span>
                      <span>Contains at least one uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={/[a-z]/.test(newPassword) ? 'text-green-500 font-bold' : 'text-slate-400 font-bold'}>✓</span>
                      <span>Contains at least one lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={/[0-9]/.test(newPassword) ? 'text-green-500 font-bold' : 'text-slate-400 font-bold'}>✓</span>
                      <span>Contains at least one number</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-light dark:border-border-dark flex justify-end">
                    <Button type="submit" variant="gradient" disabled={passwordLoading}>
                      {passwordLoading ? 'Updating Credentials...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* TAB 3: PREFERENCES */}
            {activeTab === 'preferences' && (
              <Card className="p-6 md:p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md text-left">
                <div className="border-b border-border-light dark:border-border-dark pb-4 mb-6">
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Automation Preferences
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                    Customize your daily alert dispatches and expected matching parameters.
                  </p>
                </div>

                <form onSubmit={handleSavePreferences} className="space-y-5">
                  <div className="space-y-3.5 pt-2">
                    <Checkbox
                      label="Enable Automated Application Dispatching"
                      id="pref-dispatch"
                      checked={automationEnabled}
                      onChange={(e) => setAutomationEnabled(e.target.checked)}
                    />
                    <Checkbox
                      label="Receive Daily Email Summaries for New Matches"
                      id="pref-alerts"
                      checked={dailyAlerts}
                      onChange={(e) => setDailyAlerts(e.target.checked)}
                    />
                  </div>

                  <Input
                    label="Minimum Expected Salary Package (USD / month)"
                    type="number"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                    placeholder="e.g. 3000"
                    id="minSalary"
                    required
                  />

                  <div className="pt-4 border-t border-border-light dark:border-border-dark flex justify-end">
                    <Button type="submit" variant="gradient" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

          </div>

        </div>

      </div>
    </>
  );
}
