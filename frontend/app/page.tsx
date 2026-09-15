import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
            Tamil Nadu Smart Waste Management
          </p>

          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
            SmartWaste TN
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            An AI-powered municipal waste management platform that converts
            citizen waste reports into prioritized, trackable collection tasks.
          </p>

          <p className="mt-4 text-slate-400">
            Every complaint has a transparent lifecycle from citizen reporting,
            AI classification and priority assignment to worker collection,
            proof upload and admin verification.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Link
            href="/citizen"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-green-500 hover:bg-slate-800"
          >
            <div className="text-3xl">👤</div>
            <h2 className="mt-4 text-2xl font-semibold">Citizen Portal</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Report waste, track complaints, view priority, worker assignment,
              status history and completion proof.
            </p>

            <div className="mt-6 font-medium text-green-400">
              Open Citizen Portal →
            </div>
          </Link>

          <Link
            href="/worker"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500 hover:bg-slate-800"
          >
            <div className="text-3xl">🚛</div>
            <h2 className="mt-4 text-2xl font-semibold">Worker Portal</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              View assigned collection tasks, update task status and upload
              completion proof.
            </p>

            <div className="mt-6 font-medium text-blue-400">
              Open Worker Portal →
            </div>
          </Link>

          <Link
            href="/admin"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-amber-500 hover:bg-slate-800"
          >
            <div className="text-3xl">🏛️</div>
            <h2 className="mt-4 text-2xl font-semibold">Admin Portal</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Monitor complaints, manage workers, verify reports and analyze
              municipal waste operations.
            </p>

            <div className="mt-6 font-medium text-amber-400">
              Open Admin Portal →
            </div>
          </Link>
        </div>

        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold">Core Workflow</h3>

          <p className="mt-3 text-sm leading-7 text-slate-400">
            Citizen Report → AI Classification → Priority → Admin Review →
            Worker Assignment → Collection → Proof Upload → Admin Verification
            → Completed
          </p>
        </div>
      </section>
    </main>
  );
}