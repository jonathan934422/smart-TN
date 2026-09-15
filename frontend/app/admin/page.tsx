"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type WasteReport = {
  id: string;
  image_url: string | null;
  location_text: string;
  quantity: string | null;
  ai_category: string | null;
  priority_score: number;
  priority_level: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      router.push("/login");
      return;
    }

    const user = session.user;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setMessage(`Profile error: ${profileError.message}`);
      setLoading(false);
      return;
    }

    if (profile.role !== "admin") {
      setMessage("Access denied. Admin account required.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("waste_reports")
      .select(`
        id,
        image_url,
        location_text,
        quantity,
        ai_category,
        priority_score,
        priority_level,
        status,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Failed to load reports: ${error.message}`);
      setLoading(false);
      return;
    }

    const loadedReports = data || [];

    setReports(loadedReports);
    setLoading(false);

    await generateAISummary(loadedReports);
  }

  async function generateAISummary(reportData: WasteReport[]) {
    setAiLoading(true);
    setAiError("");

    if (reportData.length === 0) {
      setAiSummary(
        "No waste complaints are currently available for AI analysis."
      );
      setAiLoading(false);
      return;
    }

    const pending = reportData.filter(
      (report) => report.status === "PENDING"
    ).length;

    const active = reportData.filter((report) =>
      ["ASSIGNED", "IN_PROGRESS"].includes(report.status)
    ).length;

    const verification = reportData.filter(
      (report) => report.status === "COLLECTED"
    ).length;

    const completed = reportData.filter(
      (report) => report.status === "COMPLETED"
    ).length;

    const highPriority = reportData.filter(
      (report) => report.priority_level === "HIGH"
    ).length;

    const categoryCounts: Record<string, number> = {};

    reportData.forEach((report) => {
      const category = report.ai_category || "Unclassified";

      categoryCounts[category] =
        (categoryCounts[category] || 0) + 1;
    });

    const categorySummary = Object.entries(categoryCounts)
      .map(([category, count]) => `${category}: ${count}`)
      .join(", ");

    const highPriorityDetails = reportData
      .filter((report) => report.priority_level === "HIGH")
      .slice(0, 5)
      .map(
        (report) =>
          `${report.ai_category || "Unclassified"} waste at ${
            report.location_text
          }, status ${report.status}, priority score ${
            report.priority_score
          }`
      )
      .join("; ");

    const complaintData = `
Total complaints: ${reportData.length}
Pending complaints: ${pending}
Active complaints: ${active}
Awaiting admin verification: ${verification}
Completed complaints: ${completed}
High priority complaints: ${highPriority}
Waste category distribution: ${categorySummary}
High priority complaint details: ${
      highPriorityDetails || "None"
    }
`;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/admin-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            complaint_data: complaintData,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Failed to generate AI summary."
        );
      }

      setAiSummary(result.summary || "No AI summary generated.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to connect to the AI service.";

      setAiError(errorMessage);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function openComplaint(reportId: string) {
    router.push(`/admin/complaints/${reportId}`);
  }

  function openAnalytics() {
    router.push("/admin/analytics");
  }

  function openWasteMap() {
    router.push("/admin/map");
  }

  const grouped = useMemo(() => {
    return {
      pending: reports.filter(
        (report) => report.status === "PENDING"
      ),

      active: reports.filter((report) =>
        ["ASSIGNED", "IN_PROGRESS"].includes(report.status)
      ),

      verification: reports.filter(
        (report) => report.status === "COLLECTED"
      ),

      completed: reports.filter(
        (report) => report.status === "COMPLETED"
      ),
    };
  }, [reports]);

  function getPriorityStyle(level: string) {
    if (level === "HIGH") {
      return "bg-red-100 text-red-700";
    }

    if (level === "MEDIUM") {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-green-100 text-green-700";
  }

  function getStatusStyle(status: string) {
    if (status === "COMPLETED") {
      return "bg-green-100 text-green-700";
    }

    if (status === "COLLECTED") {
      return "bg-teal-100 text-teal-700";
    }

    if (status === "IN_PROGRESS") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "ASSIGNED") {
      return "bg-purple-100 text-purple-700";
    }

    return "bg-slate-100 text-slate-700";
  }

  function ReportCard({
    report,
    verificationMode = false,
  }: {
    report: WasteReport;
    verificationMode?: boolean;
  }) {
    return (
      <div
        className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
          verificationMode
            ? "border-teal-300 ring-1 ring-teal-100"
            : ""
        }`}
      >
        {report.image_url ? (
          <div className="relative h-44 w-full bg-slate-100">
            <Image
              src={report.image_url}
              alt="Waste complaint"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-400">
            No image
          </div>
        )}

        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                report.status
              )}`}
            >
              {report.status}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                report.priority_level
              )}`}
            >
              {report.priority_level}
            </span>
          </div>

          <h4 className="mt-4 text-lg font-bold text-slate-900">
            {report.ai_category || "Waste Report"}
          </h4>

          <p className="mt-2 text-sm text-slate-500">
            📍 {report.location_text}
          </p>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>
              Quantity:{" "}
              <span className="capitalize">
                {report.quantity || "-"}
              </span>
            </span>

            <span>
              Priority Score: {report.priority_score}
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            {new Date(report.created_at).toLocaleString()}
          </p>

          <button
            type="button"
            onClick={() => openComplaint(report.id)}
            className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${
              verificationMode
                ? "bg-teal-700 hover:bg-teal-800"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {verificationMode
              ? "Review Completion Proof"
              : "Manage Complaint"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              SmartWaste TN
            </h1>

            <p className="text-xs text-slate-500">
              Municipal Admin Portal
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openAnalytics}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              📊 Analytics
            </button>

            <button
              type="button"
              onClick={openWasteMap}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              🗺️ Waste Map
            </button>

            <button
              type="button"
              onClick={loadDashboard}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <p className="text-sm font-medium text-orange-700">
            Municipal Admin Dashboard
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Waste Management Overview
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Monitor complaints, manage active work and quickly review
            collections waiting for admin verification.
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        {/* AI MUNICIPAL SUMMARY */}
        <div className="mt-8 rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-violet-700">
                🤖 AI Municipal Intelligence
              </p>

              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                AI Complaint Summary
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Generated from current SmartWaste complaint data.
              </p>
            </div>

            <button
              type="button"
              onClick={() => generateAISummary(reports)}
              disabled={aiLoading || reports.length === 0}
              className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiLoading ? "Analyzing..." : "✨ Regenerate Summary"}
            </button>
          </div>

          {aiLoading && (
            <div className="mt-6 rounded-xl border border-violet-100 bg-white/70 p-5">
              <p className="text-sm font-medium text-violet-700">
                AI is analyzing municipal complaint data...
              </p>
            </div>
          )}

          {!aiLoading && aiError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              AI summary error: {aiError}
            </div>
          )}

          {!aiLoading && !aiError && aiSummary && (
            <div className="mt-6 whitespace-pre-wrap rounded-xl border border-violet-100 bg-white p-5 text-sm leading-7 text-slate-700">
              {aiSummary}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Pending Reports
            </p>

            <p className="mt-3 text-3xl font-bold text-orange-600">
              {loading ? "..." : grouped.pending.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Work
            </p>

            <p className="mt-3 text-3xl font-bold text-blue-600">
              {loading ? "..." : grouped.active.length}
            </p>
          </div>

          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-teal-700">
              Awaiting Verification
            </p>

            <p className="mt-3 text-3xl font-bold text-teal-700">
              {loading ? "..." : grouped.verification.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Completed
            </p>

            <p className="mt-3 text-3xl font-bold text-green-700">
              {loading ? "..." : grouped.completed.length}
            </p>
          </div>
        </div>

        {/* AWAITING VERIFICATION */}
        <section className="mt-10">
          <div className="rounded-3xl border border-teal-200 bg-teal-50/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-teal-700">
                  Priority Admin Queue
                </p>

                <h3 className="mt-1 text-2xl font-bold text-slate-900">
                  Awaiting Admin Verification
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Workers have uploaded completion proof for these jobs.
                  Review these first.
                </p>
              </div>

              <div className="rounded-full bg-teal-700 px-4 py-2 text-sm font-bold text-white">
                {grouped.verification.length} Waiting
              </div>
            </div>

            {!loading && grouped.verification.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-teal-300 bg-white/70 p-8 text-center">
                <p className="text-3xl">✅</p>

                <p className="mt-3 font-semibold text-slate-800">
                  No complaints waiting for verification
                </p>
              </div>
            )}

            {!loading && grouped.verification.length > 0 && (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {grouped.verification.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    verificationMode
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ACTIVE */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Active Work
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Assigned and currently progressing collection jobs.
              </p>
            </div>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              {grouped.active.length}
            </span>
          </div>

          {!loading && grouped.active.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
              No active collection work.
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {grouped.active.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                />
              ))}
            </div>
          )}
        </section>

        {/* PENDING */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Pending Reports
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Complaints waiting for worker assignment.
              </p>
            </div>

            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
              {grouped.pending.length}
            </span>
          </div>

          {!loading && grouped.pending.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
              No pending reports.
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {grouped.pending.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                />
              ))}
            </div>
          )}
        </section>

        {/* COMPLETED */}
        <section className="mt-10 pb-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Completed
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Complaints already verified and closed by the admin.
              </p>
            </div>

            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              {grouped.completed.length}
            </span>
          </div>

          {!loading && grouped.completed.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
              No completed reports yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {grouped.completed.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}