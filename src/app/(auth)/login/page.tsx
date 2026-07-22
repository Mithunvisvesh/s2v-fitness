import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full bg-background">
      {/* Left Column: Visual/Brand (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border-r border-border text-white relative overflow-hidden">
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        {/* Brand Logo/Header */}
        <div className="relative z-10 flex items-center gap-3 font-heading text-lg font-semibold tracking-tight">
          <img src="/logo.png" alt="S2V Fitness Centre Logo" className="h-10 w-auto object-contain rounded-md bg-zinc-900 p-0.5 border border-zinc-800" />
          <span className="font-bold tracking-wider text-zinc-100">S2V Fitness Centre</span>
        </div>

        {/* Brand Focus Content */}
        <div className="relative z-10 space-y-4 max-w-md my-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-xs text-zinc-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Environment
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight leading-tight lg:text-5xl text-white">
            S2V Fitness Centre
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Management Dashboard
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-sm pt-2">
            Monitor member registrations, body compositions, physical assessments, medical PAR-Q screenings, and counselling history under a unified interface.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-zinc-500 font-medium">
          © {new Date().getFullYear()} S2V Fitness Centre. All rights reserved.
        </div>
      </div>

      {/* Right Column: Interactive Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 bg-zinc-950/20 gap-8">
        <div className="w-full max-w-md flex justify-center">
          <img src="/logo.png" alt="S2V Fitness Centre" className="h-16 w-auto object-contain rounded-lg shadow-lg bg-zinc-900 p-1 border border-zinc-800" />
        </div>
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}