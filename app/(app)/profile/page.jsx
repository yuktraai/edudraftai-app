import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { TemplateManager } from '@/components/profile/TemplateManager'
import { GenerationDefaults } from '@/components/profile/GenerationDefaults'
import { NotificationPreferences } from '@/components/profile/NotificationPreferences'
import { ReferralSection } from '@/components/profile/ReferralSection'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminSupabase
    .from('users')
    .select('id, name, email, role, college_id, preferences, colleges(name)')
    .eq('id', user.id)
    .single()

  const { data: templates } = await adminSupabase
    .from('generation_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">My Profile</h1>
        <p className="text-muted text-sm mt-1">{profile?.email}</p>
      </div>

      {/* Profile info card */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-text">Account Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted">Name</span><p className="font-medium text-text mt-0.5">{profile?.name ?? '—'}</p></div>
          <div><span className="text-muted">Role</span><p className="font-medium text-text capitalize mt-0.5">{profile?.role?.replace('_', ' ') ?? '—'}</p></div>
          <div><span className="text-muted">College</span><p className="font-medium text-text mt-0.5">{profile?.colleges?.name ?? '—'}</p></div>
        </div>
      </div>

      {/* Templates section */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text">My Saved Templates</h2>
        <TemplateManager initialTemplates={templates ?? []} />
      </div>

      {/* Generation Defaults */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <GenerationDefaults initialPreferences={profile?.preferences ?? {}} />
      </div>

      {/* Email Notifications */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <NotificationPreferences initialPreferences={profile?.preferences ?? {}} />
      </div>

      {/* Phase 46 — Appearance */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-semibold text-text text-base mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Dark Mode</p>
            <p className="text-xs text-muted mt-0.5">Switch between light and dark interface.</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Phase 44 — Referral Program */}
      <ReferralSection />
    </div>
  )
}
