export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#060606] text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl text-center space-y-6 bg-[#0b0b0b] border border-[#111] rounded-2xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-2xl">
          🚀
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Welcome to EcoMentor</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Personalized learning, tasks, and community to grow your sustainability impact.
          </p>
        </div>
        <div className="space-y-3">
          <a
            href="/login"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-semibold transition-colors shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
          >
            Go to Login
          </a>
          <p className="text-sm text-gray-500">Sign in to access your dashboard.</p>
        </div>
      </div>
    </div>
  );
}
