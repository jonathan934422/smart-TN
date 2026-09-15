"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Language } from "@/lib/language";

type WasteReport = {
  id: string;
  image_url: string | null;
  location_text: string;
  quantity: string | null;
  description: string | null;
  ai_category: string | null;
  priority_score: number;
  priority_level: string;
  status: string;
  created_at: string;
};

type StatusHistory = {
  id: string;
  previous_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
};

export default function ComplaintDetailsPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [language, setLanguage] = useState<Language>("en");

  const [report, setReport] = useState<WasteReport | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedLanguage = localStorage.getItem(
      "smartwaste-language"
    );

    if (savedLanguage === "en" || savedLanguage === "ta") {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    if (reportId) {
      loadComplaint();
    }
  }, [reportId]);

  function text(english: string, tamil: string) {
    return language === "en" ? english : tamil;
  }

  function changeLanguage(newLanguage: Language) {
    setLanguage(newLanguage);

    localStorage.setItem(
      "smartwaste-language",
      newLanguage
    );
  }

  function translateStatus(status: string) {
    if (language === "en") {
      return status.replaceAll("_", " ");
    }

    switch (status) {
      case "PENDING":
        return "நிலுவையில்";
      case "ASSIGNED":
        return "பணியாளர் நியமிக்கப்பட்டார்";
      case "IN_PROGRESS":
        return "சேகரிப்பு நடைபெறுகிறது";
      case "COLLECTED":
        return "கழிவு சேகரிக்கப்பட்டது";
      case "COMPLETED":
        return "முடிக்கப்பட்டது";
      default:
        return status.replaceAll("_", " ");
    }
  }

  function translatePriority(level: string) {
    if (language === "en") {
      return level;
    }

    switch (level) {
      case "HIGH":
        return "அதிக";
      case "MEDIUM":
        return "நடுத்தர";
      case "LOW":
        return "குறைந்த";
      default:
        return level;
    }
  }

  function translateQuantity(quantity: string | null) {
    if (!quantity) {
      return "-";
    }

    if (language === "en") {
      return quantity.replaceAll("-", " ");
    }

    switch (quantity) {
      case "small":
        return "சிறியது";
      case "medium":
        return "நடுத்தரம்";
      case "large":
        return "பெரியது";
      case "very-large":
        return "மிகப் பெரியது";
      default:
        return quantity;
    }
  }

  function translateCategory(category: string | null) {
    if (!category) {
      return text("Not classified", "வகைப்படுத்தப்படவில்லை");
    }

    if (language === "en") {
      return category;
    }

    switch (category) {
      case "Plastic":
        return "பிளாஸ்டிக்";
      case "Organic":
        return "உயிரியல் கழிவு";
      case "Paper":
        return "காகிதம்";
      case "Metal":
        return "உலோகம்";
      case "Glass":
        return "கண்ணாடி";
      case "E-waste":
        return "மின்னணு கழிவு";
      case "Hazardous":
        return "அபாயகரமான கழிவு";
      case "Mixed Waste":
        return "கலப்பு கழிவு";
      default:
        return category;
    }
  }

  async function loadComplaint() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please login to view this complaint.");
      setLoading(false);
      return;
    }

    const { data: reportData, error: reportError } =
      await supabase
        .from("waste_reports")
        .select(`
          id,
          image_url,
          location_text,
          quantity,
          description,
          ai_category,
          priority_score,
          priority_level,
          status,
          created_at
        `)
        .eq("id", reportId)
        .eq("citizen_id", user.id)
        .single();

    if (reportError || !reportData) {
      setMessage("Complaint not found.");
      setLoading(false);
      return;
    }

    setReport(reportData);

    const { data: historyData, error: historyError } =
      await supabase
        .from("status_history")
        .select(`
          id,
          previous_status,
          new_status,
          note,
          created_at
        `)
        .eq("waste_report_id", reportId)
        .order("created_at", { ascending: true });

    if (historyError) {
      setMessage(
        `Failed to load complaint history: ${historyError.message}`
      );
      setLoading(false);
      return;
    }

    setHistory(historyData || []);
    setLoading(false);
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

  function getStatusStyle(status: string) {
    if (status === "COMPLETED") {
      return "bg-green-100 text-green-700";
    }

    if (status === "IN_PROGRESS") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "ASSIGNED") {
      return "bg-purple-100 text-purple-700";
    }

    if (status === "COLLECTED") {
      return "bg-teal-100 text-teal-700";
    }

    return "bg-slate-100 text-slate-700";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-5xl rounded-xl border bg-white p-6">
          {text(
            "Loading complaint...",
            "புகார் விவரங்கள் ஏற்றப்படுகின்றன..."
          )}
        </div>
      </main>
    );
  }

  if (message || !report) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-5xl rounded-xl border bg-white p-6 text-red-600">
          {message ||
            text(
              "Complaint not found.",
              "புகார் கிடைக்கவில்லை."
            )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              SmartWaste TN
            </h1>

            <p className="text-xs text-slate-500">
              {text(
                "Citizen Portal • Complaint Details",
                "குடிமக்கள் தளம் • புகார் விவரங்கள்"
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

            <Link
              href="/citizen/complaints"
              className="rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              ← {text("My Complaints", "எனது புகார்கள்")}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* COMPLAINT DETAILS */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            {report.image_url ? (
              <div className="relative h-80 w-full bg-slate-100">
                <Image
                  src={report.image_url}
                  alt="Waste complaint"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center bg-slate-100 text-slate-500">
                {text("No image", "படம் இல்லை")}
              </div>
            )}

            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                    report.status
                  )}`}
                >
                  {translateStatus(report.status)}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                    report.priority_level
                  )}`}
                >
                  {translatePriority(report.priority_level)}{" "}
                  {text("PRIORITY", "முன்னுரிமை")}
                </span>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <p>
                  <span className="font-semibold text-slate-800">
                    {text("Complaint ID:", "புகார் எண்:")}
                  </span>{" "}
                  <span className="break-all text-slate-600">
                    {report.id}
                  </span>
                </p>

                <p>
                  <span className="font-semibold text-slate-800">
                    {text("Category:", "கழிவு வகை:")}
                  </span>{" "}
                  {translateCategory(report.ai_category)}
                </p>

                <p>
                  <span className="font-semibold text-slate-800">
                    {text("Quantity:", "கழிவு அளவு:")}
                  </span>{" "}
                  <span className="capitalize">
                    {translateQuantity(report.quantity)}
                  </span>
                </p>

                <p>
                  <span className="font-semibold text-slate-800">
                    {text(
                      "Priority Score:",
                      "முன்னுரிமை மதிப்பெண்:"
                    )}
                  </span>{" "}
                  {report.priority_score}
                </p>

                <p>
                  <span className="font-semibold text-slate-800">
                    {text("Location:", "இருப்பிடம்:")}
                  </span>{" "}
                  {report.location_text}
                </p>

                <p>
                  <span className="font-semibold text-slate-800">
                    {text("Submitted:", "சமர்ப்பிக்கப்பட்டது:")}
                  </span>{" "}
                  {new Date(report.created_at).toLocaleString(
                    language === "ta" ? "ta-IN" : "en-IN"
                  )}
                </p>
              </div>

              {report.description && (
                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {text("Description", "விவரம்")}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {report.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* LIFECYCLE */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-medium text-green-700">
                {text(
                  "Transparency Tracking",
                  "வெளிப்படையான கண்காணிப்பு"
                )}
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {text(
                  "Complaint Lifecycle",
                  "புகார் செயல்முறை"
                )}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {text(
                  "Every status change is recorded here.",
                  "ஒவ்வொரு நிலை மாற்றமும் இங்கே பதிவு செய்யப்படுகிறது."
                )}
              </p>
            </div>

            {history.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                {text(
                  "No status history available.",
                  "நிலை மாற்ற வரலாறு இல்லை."
                )}
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative border-l-2 border-green-200 pl-6"
                  >
                    <div className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-green-700" />

                    <p className="text-xs font-semibold text-green-700">
                      {text("STEP", "படி")} {index + 1}
                    </p>

                    <h3 className="mt-1 font-semibold text-slate-900">
                      {translateStatus(item.new_status)}
                    </h3>

                    {item.previous_status && (
                      <p className="mt-1 text-xs text-slate-500">
                        {text(
                          "Previous:",
                          "முந்தைய நிலை:"
                        )}{" "}
                        {translateStatus(
                          item.previous_status
                        )}
                      </p>
                    )}

                    {item.note && (
                      <p className="mt-2 text-sm text-slate-600">
                        {item.note}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(
                        item.created_at
                      ).toLocaleString(
                        language === "ta"
                          ? "ta-IN"
                          : "en-IN"
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}