import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Leaf,
  MapPin,
  Recycle,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
  UsersRound,
} from "lucide-react";

const workflow = [
  {
    number: "01",
    title: "Report",
    description: "Citizen uploads waste image and location.",
    icon: MapPin,
  },
  {
    number: "02",
    title: "AI Analysis",
    description: "AI identifies the waste category.",
    icon: Bot,
  },
  {
    number: "03",
    title: "Prioritize",
    description: "Smart rules calculate collection priority.",
    icon: Sparkles,
  },
  {
    number: "04",
    title: "Assign",
    description: "A suitable collection worker is selected.",
    icon: UsersRound,
  },
  {
    number: "05",
    title: "Collect",
    description: "Worker collects waste and uploads proof.",
    icon: Truck,
  },
  {
    number: "06",
    title: "Verify",
    description: "Admin verifies collection and completes it.",
    icon: CheckCircle2,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7faf8] text-slate-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <Recycle className="h-6 w-6" />
            </div>

            <div>
              <div className="text-xl font-bold tracking-tight">
                SmartWaste <span className="text-emerald-600">TN</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Clean • Smart • Transparent
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#how-it-works" className="transition hover:text-emerald-600">
              How it works
            </a>

            <Link
              href="/citizen/complaints"
              className="transition hover:text-emerald-600"
            >
              Track Complaint
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
            >
              Login
            </Link>
          </nav>

          <Link
            href="/citizen"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 md:hidden"
          >
            Portal
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <Sparkles className="h-4 w-4" />
              AI-Powered Municipal Waste Management
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Smarter Waste.
              <br />
              Cleaner{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Tamil Nadu.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Report waste in seconds, let AI identify and prioritize the
              complaint, and transparently track collection from submission to
              verified completion.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/citizen/report"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-4 font-bold text-white shadow-xl shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                <MapPin className="h-5 w-5" />
                Report Waste
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>

              <Link
                href="/citizen/complaints"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
              >
                <ClipboardCheck className="h-5 w-5" />
                Track Complaint
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                AI Classification
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Smart Priority
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Transparent Tracking
              </div>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -left-8 top-20 h-32 w-32 rounded-full bg-emerald-300/30 blur-2xl" />
            <div className="absolute -right-8 bottom-16 h-40 w-40 rounded-full bg-blue-300/30 blur-2xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-white bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-7 shadow-2xl shadow-emerald-900/20">
              <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full border-[35px] border-white/5" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                      Smart Collection
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Waste Intelligence
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                    <Leaf className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-8 rounded-3xl bg-white p-5 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                      <Bot className="h-7 w-7 text-emerald-700" />
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        AI Analysis
                      </p>
                      <h3 className="mt-1 font-bold text-slate-900">
                        Waste automatically classified
                      </h3>
                    </div>

                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      AI
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-400">Priority</p>
                      <p className="mt-1 font-bold text-rose-600">
                        Smart Scoring
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-400">Tracking</p>
                      <p className="mt-1 font-bold text-emerald-700">
                        Live Status
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/10 p-4 text-white backdrop-blur">
                    <MapPin className="h-5 w-5 text-emerald-200" />
                    <p className="mt-3 text-xs text-emerald-100">Location</p>
                    <p className="mt-1 text-sm font-bold">Mapped</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4 text-white backdrop-blur">
                    <Truck className="h-5 w-5 text-emerald-200" />
                    <p className="mt-3 text-xs text-emerald-100">Worker</p>
                    <p className="mt-1 text-sm font-bold">Assigned</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4 text-white backdrop-blur">
                    <ShieldCheck className="h-5 w-5 text-emerald-200" />
                    <p className="mt-3 text-xs text-emerald-100">Proof</p>
                    <p className="mt-1 text-sm font-bold">Verified</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:flex sm:items-center sm:gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Transparent lifecycle</p>
                <p className="font-bold text-slate-800">Report → Completion</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PORTALS */}
      <section className="border-y border-slate-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
              One Platform
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Built for everyone involved
            </h2>

            <p className="mt-4 text-slate-500">
              Citizens, collection workers and municipal administrators work
              together through one transparent waste-management platform.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {/* CITIZEN */}
            <Link
              href="/citizen"
              className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-8 transition duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <UserRound className="h-7 w-7" />
              </div>

              <h3 className="mt-7 text-2xl font-bold">Citizen Portal</h3>

              <p className="mt-3 leading-7 text-slate-500">
                Report waste, view AI classification, monitor priority and
                track every stage until collection is verified.
              </p>

              <div className="mt-8 flex items-center gap-2 font-bold text-emerald-700">
                Open Citizen Portal
                <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </div>
            </Link>

            {/* WORKER */}
            <Link
              href="/worker"
              className="group relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-8 transition duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Truck className="h-7 w-7" />
              </div>

              <h3 className="mt-7 text-2xl font-bold">Worker Portal</h3>

              <p className="mt-3 leading-7 text-slate-500">
                View assigned tasks, navigate collection work, update progress
                and upload completion evidence.
              </p>

              <div className="mt-8 flex items-center gap-2 font-bold text-blue-700">
                Open Worker Portal
                <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </div>
            </Link>

            {/* ADMIN */}
            <Link
              href="/admin"
              className="group relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-8 transition duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-900/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <h3 className="mt-7 text-2xl font-bold">Admin Portal</h3>

              <p className="mt-3 leading-7 text-slate-500">
                Monitor complaints, verify AI results, assign workers and
                analyze municipal collection performance.
              </p>

              <div className="mt-8 flex items-center gap-2 font-bold text-violet-700">
                Open Admin Portal
                <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
              Transparent by design
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              From complaint to clean street
            </h2>

            <p className="mt-4 text-slate-500">
              Every report follows a traceable lifecycle so citizens and
              municipal teams always know what happens next.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflow.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-200/60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="text-3xl font-black text-slate-100">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold">{step.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRANSPARENCY BANNER */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-slate-950 px-8 py-12 text-white shadow-2xl md:px-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-[0.2em]">
                  Accountability
                </span>
              </div>

              <h2 className="mt-4 max-w-3xl text-3xl font-black sm:text-4xl">
                Every complaint. Every update. Every collection.
                <span className="text-emerald-400"> Traceable.</span>
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-slate-400">
                SmartWaste TN creates a transparent digital trail from the
                citizen&apos;s first report to worker completion proof and
                final administrative verification.
              </p>
            </div>

            <Link
              href="/citizen"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-7 py-4 font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Recycle className="h-5 w-5 text-emerald-600" />
            SmartWaste TN
          </div>

          <p>
            AI-Powered Smart Waste Management • Tamil Nadu
          </p>

          <div className="flex gap-5">
            <Link href="/citizen" className="hover:text-emerald-600">
              Citizen
            </Link>
            <Link href="/worker" className="hover:text-emerald-600">
              Worker
            </Link>
            <Link href="/admin" className="hover:text-emerald-600">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}