export const metadata = {
  title: 'EduDraftAI — Sign In',
}

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logo.png" alt="EduDraftAI" className="w-12 h-12 rounded-2xl shadow-sm" />
            <span className="font-heading text-3xl font-extrabold text-navy">
              EduDraftAI
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            by Yuktra AI · For SCTE & VT diploma colleges
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border px-8 py-10">
          {children}
        </div>
      </div>
    </div>
  )
}
