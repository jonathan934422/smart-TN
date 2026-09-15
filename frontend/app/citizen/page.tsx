"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  translations,
  type Language,
} from "@/lib/language";

type WasteReport = {
  id: string;
  ai_category: string | null;
  location_text: string;
  priority_level: string;
  priority_score: number;
  status: string;
  created_at: string;
};

export default function CitizenDashboardPage() {
  const router = useRouter();

  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<Language>("en");

  const t = translations[language];

  useEffect(() => {
    const savedLanguage = localStorage.getItem("smartwaste-language");

    if (savedLanguage === "en" || savedLanguage === "ta") {
      setLanguage(savedLanguage);
    }

    loadDashboard();
  }, []);

  function changeLanguage(newLanguage: Language) {
    setLanguage(newLanguage);
    localStorage.setItem("smartwaste-language", newLanguage);
  }

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

    if (profile.role !== "citizen") {
      setMessage("Access denied. Citizen account required.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("waste_reports")
      .select(`
        id,
        ai_category,
        location_text,
        priority_level,
        priority_score,
        status,
        created_at
      `)
      .eq("citizen_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Failed to load reports: ${error.message}`);
      setLoading(false);
      return;
    }

    setReports(data || []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function openReportWaste() {
    router.push("/citizen/report");
  }

  function openComplaints() {
    router.push("/citizen/complaints");
  }

  function openNotifications() {
    router.push("/citizen/notifications");
  }

  function openComplaint(reportId: string) {
    router.push(`/citizen/complaints/${reportId}`);
  }

  const stats = useMemo(() => {
    const total = reports.length;

    const pending = reports.filter(
      (report) => report.status === "PENDING"
    ).length;

    const active = reports.filter((report) =>
      ["ASSIGNED", "IN_PROGRESS", "COLLECTED"].includes(report.status)
    ).length;

    const completed = reports.filter(
      (report) => report.status === "COMPLETED"
    ).length;

    return {
      total,
      pending,
      active,
      completed,
    };
  }, [reports]);

  function getStatusStyle(status: string) {
    if (status === "COMPLETED") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (status === "COLLECTED") {
      return "bg-teal-100 text-teal-700";
    }

    if (status === "IN_PROGRESS") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "ASSIGNED") {
      return "bg-violet-100 text-violet-700";
    }

    return "bg-slate-100 text-slate-700";
  }

  function getPriorityStyle(level: string) {
    if (level === "HIGH") {
      return "bg-red-100 text-red-700";
    }

    if (level === "MEDIUM") {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-green-100 text-green-700";
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              {t.appName}
            </h1>

            <p className="text-xs text-slate-500">
              {t.citizenPortal}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {/* LANGUAGE SWITCH */}
            <div className="flex rounded-lg border bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => changeLanguage("en")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  language === "en"
                    ? "bg-green-700 text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                English
              </button>

              <button
                type="button"
                onClick={() => changeLanguage("ta")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  language === "ta"
                    ? "bg-green-700 text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                தமிழ்
              </button>
            </div>

            <button
              type="button"
              onClick={openNotifications}
              className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            >
              🔔 {t.notifications}
            </button>

            <button
              type="button"
              onClick={openComplaints}
              className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              {t.myComplaints}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-green-800 via-green-700 to-emerald-600 p-8 text-white shadow-lg md:p-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-green-100">
                {language === "en"
                  ? "Smart Citizen Dashboard"
                  : "ஸ்மார்ட் குடிமக்கள் முகப்பு"}
              </p>

              <h2 className="mt-3 text-4xl font-bold leading-tight">
                {language === "en"
                  ? "Cleaner streets start with one report."
                  : "தூய்மையான தெருக்கள் ஒரு புகாரில் தொடங்குகின்றன."}
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-green-100">
                {language === "en"
                  ? "Report waste, track municipal action, monitor collection progress and verify completion transparently."
                  : "கழிவுகளைப் புகாரளித்து, நகராட்சி நடவடிக்கையை கண்காணித்து, சேகரிப்பு முன்னேற்றம் மற்றும் நிறைவு நிலையை வெளிப்படையாக அறியுங்கள்."}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openReportWaste}
                  className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-green-700 hover:bg-green-50"
                >
                  + {t.reportWaste}
                </button>

                <button
                  type="button"
                  onClick={openComplaints}
                  className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20"
                >
                  {t.trackComplaints}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 p-5">
                <p className="text-sm text-green-100">
                  {t.totalComplaints}
                </p>

                <p className="mt-2 text-4xl font-bold">
                  {loading ? "..." : stats.total}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <p className="text-sm text-green-100">
                  {t.pending}
                </p>

                <p className="mt-2 text-4xl font-bold">
                  {loading ? "..." : stats.pending}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <p className="text-sm text-green-100">
                  {t.active}
                </p>

                <p className="mt-2 text-4xl font-bold">
                  {loading ? "..." : stats.active}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <p className="text-sm text-green-100">
                  {t.completed}
                </p>

                <p className="mt-2 text-4xl font-bold">
                  {loading ? "..." : stats.completed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <button
            type="button"
            onClick={openReportWaste}
            className="rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
              📸
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {t.reportWaste}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {language === "en"
                ? "Upload a waste photo, add location and submit a new complaint."
                : "கழிவு புகைப்படத்தை பதிவேற்றி, இருப்பிடத்தைச் சேர்த்து புதிய புகாரை சமர்ப்பிக்கவும்."}
            </p>

            <p className="mt-5 text-sm font-semibold text-green-700">
              {language === "en"
                ? "Create Report →"
                : "புகார் உருவாக்கு →"}
            </p>
          </button>

          <button
            type="button"
            onClick={openComplaints}
            className="rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
              📍
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {t.trackComplaints}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {language === "en"
                ? "Check complaint status, priority and complete lifecycle history."
                : "புகாரின் நிலை, முன்னுரிமை மற்றும் முழுமையான செயல்முறை வரலாற்றைப் பார்க்கவும்."}
            </p>

            <p className="mt-5 text-sm font-semibold text-blue-700">
              {language === "en"
                ? "View Complaints →"
                : "புகார்களை பார்க்க →"}
            </p>
          </button>

          <button
            type="button"
            onClick={openNotifications}
            className="rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
              🔔
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {t.notifications}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {language === "en"
                ? "Receive worker assignment, collection and completion updates."
                : "பணியாளர் ஒதுக்கீடு, கழிவு சேகரிப்பு மற்றும் நிறைவு அறிவிப்புகளைப் பெறுங்கள்."}
            </p>

            <p className="mt-5 text-sm font-semibold text-orange-700">
              {t.viewNotifications} →
            </p>
          </button>
        </div>

        {/* RECENT COMPLAINTS */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {language === "en"
                    ? "Recent Complaints"
                    : "சமீபத்திய புகார்கள்"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {language === "en"
                    ? "Your latest complaints and current progress."
                    : "உங்கள் சமீபத்திய புகார்கள் மற்றும் தற்போதைய முன்னேற்றம்."}
                </p>
              </div>

              <button
                type="button"
                onClick={openComplaints}
                className="text-sm font-semibold text-green-700 hover:underline"
              >
                {language === "en" ? "View All" : "அனைத்தையும் பார்க்க"}
              </button>
            </div>

            {loading && (
              <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                {language === "en"
                  ? "Loading complaints..."
                  : "புகார்கள் ஏற்றப்படுகின்றன..."}
              </div>
            )}

            {!loading && reports.length === 0 && (
              <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
                <p className="text-3xl">🗑️</p>

                <p className="mt-3 text-sm text-slate-500">
                  {language === "en"
                    ? "No complaints submitted yet."
                    : "இதுவரை புகார்கள் எதுவும் சமர்ப்பிக்கப்படவில்லை."}
                </p>
              </div>
            )}

            {!loading &&
              reports.slice(0, 4).map((report) => (
                <div
                  key={report.id}
                  className="mt-4 rounded-xl border p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {report.ai_category || "Waste Report"}
                      </h4>

                      <p className="mt-2 text-sm text-slate-500">
                        📍 {report.location_text}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <div className="flex gap-2">
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

                      <button
                        type="button"
                        onClick={() => openComplaint(report.id)}
                        className="rounded-lg border border-green-700 px-4 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                      >
                        {language === "en" ? "Track →" : "கண்காணிக்க →"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* LIFECYCLE */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              {language === "en"
                ? "Complaint Lifecycle"
                : "புகார் செயல்முறை"}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {language === "en"
                ? "End-to-end transparency"
                : "தொடக்கம் முதல் முடிவு வரை வெளிப்படைத்தன்மை"}
            </p>

            <div className="mt-6 space-y-3">
              {(language === "en"
                ? [
                    "Report Submitted",
                    "Priority Assigned",
                    "Worker Assigned",
                    "Collection Started",
                    "Waste Collected",
                    "Admin Verified",
                    "Completed",
                  ]
                : [
                    "புகார் சமர்ப்பிக்கப்பட்டது",
                    "முன்னுரிமை வழங்கப்பட்டது",
                    "பணியாளர் ஒதுக்கப்பட்டார்",
                    "சேகரிப்பு தொடங்கியது",
                    "கழிவு சேகரிக்கப்பட்டது",
                    "நிர்வாகி சரிபார்த்தார்",
                    "முடிக்கப்பட்டது",
                  ]
              ).map((title, index) => (
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                    {index + 1}
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    {title}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={openComplaints}
              className="mt-6 w-full rounded-lg border border-green-700 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              {language === "en"
                ? "View Lifecycle Tracking"
                : "செயல்முறை கண்காணிப்பைப் பார்க்க"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}