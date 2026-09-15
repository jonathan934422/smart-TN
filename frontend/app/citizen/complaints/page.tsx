"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Language } from "@/lib/language";

type WasteReport = {
  id: string;
  ai_category: string | null;
  location_text: string;
  quantity: string | null;
  priority_level: string;
  priority_score: number;
  status: string;
  created_at: string;
};

export default function CitizenComplaintsPage() {
  const router = useRouter();

  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("smartwaste-language");

    if (savedLanguage === "en" || savedLanguage === "ta") {
      setLanguage(savedLanguage);
    }

    loadComplaints();
  }, []);

  function text(english: string, tamil: string) {
    return language === "en" ? english : tamil;
  }

  function changeLanguage(newLanguage: Language) {
    setLanguage(newLanguage);
    localStorage.setItem("smartwaste-language", newLanguage);
  }

  async function loadComplaints() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

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
      setMessage(
        text(
          "Access denied. Citizen account required.",
          "அணுகல் மறுக்கப்பட்டது. குடிமக்கள் கணக்கு தேவை."
        )
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("waste_reports")
      .select(`
        id,
        ai_category,
        location_text,
        quantity,
        priority_level,
        priority_score,
        status,
        created_at
      `)
      .eq("citizen_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Failed to load complaints: ${error.message}`);
      setLoading(false);
      return;
    }

    setReports(data || []);
    setLoading(false);
  }

  const filteredReports = useMemo(() => {
    if (filter === "ALL") {
      return reports;
    }

    if (filter === "ACTIVE") {
      return reports.filter((report) =>
        ["ASSIGNED", "IN_PROGRESS", "COLLECTED"].includes(report.status)
      );
    }

    return reports.filter((report) => report.status === filter);
  }, [reports, filter]);

  const stats = useMemo(() => {
    return {
      total: reports.length,

      pending: reports.filter(
        (report) => report.status === "PENDING"
      ).length,

      active: reports.filter((report) =>
        ["ASSIGNED", "IN_PROGRESS", "COLLECTED"].includes(report.status)
      ).length,

      completed: reports.filter(
        (report) => report.status === "COMPLETED"
      ).length,
    };
  }, [reports]);

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
        return status;
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

  function translateCategory(category: string | null) {
    if (!category) {
      return text("Waste Report", "கழிவு புகார்");
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
      {/* HEADER */}

      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              SmartWaste TN
            </h1>

            <p className="text-xs text-slate-500">
              {text(
                "Citizen Portal • My Complaints",
                "குடிமக்கள் தளம் • எனது புகார்கள்"
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* LANGUAGE */}

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
              href="/citizen"
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ← {text("Dashboard", "முகப்பு")}
            </Link>

            <Link
              href="/citizen/report"
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              + {text("Report Waste", "கழிவு புகார்")}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* TITLE */}

        <div>
          <p className="text-sm font-semibold text-green-700">
            {text(
              "Complaint Tracking",
              "புகார் கண்காணிப்பு"
            )}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {text(
              "My Complaints",
              "எனது புகார்கள்"
            )}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {text(
              "Track every waste complaint from submission to municipal verification and completion.",
              "சமர்ப்பிப்பிலிருந்து நகராட்சி சரிபார்ப்பு மற்றும் நிறைவு வரை ஒவ்வொரு கழிவு புகாரையும் கண்காணிக்கவும்."
            )}
          </p>
        </div>

        {/* STATS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              {text("Total Complaints", "மொத்த புகார்கள்")}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : stats.total}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              {text("Pending", "நிலுவையில்")}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : stats.pending}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              {text("Active", "செயலில்")}
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {loading ? "..." : stats.active}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              {text("Completed", "முடிக்கப்பட்டது")}
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {loading ? "..." : stats.completed}
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        {/* FILTERS */}

        <div className="mt-8 flex flex-wrap gap-2">
          {[
            {
              value: "ALL",
              label: text("All", "அனைத்தும்"),
            },
            {
              value: "PENDING",
              label: text("Pending", "நிலுவையில்"),
            },
            {
              value: "ACTIVE",
              label: text("Active", "செயலில்"),
            },
            {
              value: "COMPLETED",
              label: text("Completed", "முடிக்கப்பட்டது"),
            },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                filter === item.value
                  ? "bg-green-700 text-white"
                  : "border bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* LOADING */}

        {loading && (
          <div className="mt-8 rounded-2xl border bg-white p-10 text-center text-slate-500">
            {text(
              "Loading complaints...",
              "புகார்கள் ஏற்றப்படுகின்றன..."
            )}
          </div>
        )}

        {/* EMPTY */}

        {!loading && filteredReports.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed bg-white p-12 text-center">
            <p className="text-4xl">🗑️</p>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {text(
                "No complaints found",
                "புகார்கள் எதுவும் இல்லை"
              )}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {text(
                "There are no complaints in this category.",
                "இந்த பிரிவில் புகார்கள் எதுவும் இல்லை."
              )}
            </p>

            <Link
              href="/citizen/report"
              className="mt-6 inline-block rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
            >
              + {text(
                "Report Waste",
                "கழிவு புகார் அளிக்க"
              )}
            </Link>
          </div>
        )}

        {/* COMPLAINT LIST */}

        {!loading && filteredReports.length > 0 && (
          <div className="mt-8 space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border bg-white p-6 shadow-sm transition hover:border-green-200 hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {translateCategory(report.ai_category)}
                      </h3>

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
                        {translatePriority(
                          report.priority_level
                        )}{" "}
                        {text("PRIORITY", "முன்னுரிமை")}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-600">
                      📍 {report.location_text}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                      <p>
                        <span className="font-semibold">
                          {text("Quantity:", "அளவு:")}
                        </span>{" "}
                        {translateQuantity(report.quantity)}
                      </p>

                      <p>
                        <span className="font-semibold">
                          {text(
                            "Priority Score:",
                            "முன்னுரிமை மதிப்பெண்:"
                          )}
                        </span>{" "}
                        {report.priority_score}
                      </p>

                      <p>
                        <span className="font-semibold">
                          {text(
                            "Submitted:",
                            "சமர்ப்பிக்கப்பட்டது:"
                          )}
                        </span>{" "}
                        {new Date(
                          report.created_at
                        ).toLocaleString(
                          language === "ta"
                            ? "ta-IN"
                            : "en-IN"
                        )}
                      </p>
                    </div>

                    <p className="mt-3 truncate text-xs text-slate-400">
                      {text("Complaint ID:", "புகார் எண்:")}{" "}
                      {report.id}
                    </p>
                  </div>

                  <div>
                    <Link
                      href={`/citizen/complaints/${report.id}`}
                      className="inline-flex rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
                    >
                      {text(
                        "Track Complaint →",
                        "புகாரை கண்காணிக்க →"
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}