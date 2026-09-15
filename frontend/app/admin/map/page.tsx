"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

type WasteReport = {
  id: string;
  location_text: string;
  latitude: number | null;
  longitude: number | null;
  ai_category: string | null;
  priority_score: number;
  priority_level: string;
  status: string;
  created_at: string;
};

export default function AdminMapPage() {
  const router = useRouter();

  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadMapData();
  }, []);

  async function loadMapData() {
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
        location_text,
        latitude,
        longitude,
        ai_category,
        priority_score,
        priority_level,
        status,
        created_at
      `)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Failed to load complaint locations: ${error.message}`);
      setLoading(false);
      return;
    }

    setReports(data || []);
    setLoading(false);
  }

  const validReports = useMemo(() => {
    return reports.filter(
      (report) =>
        typeof report.latitude === "number" &&
        typeof report.longitude === "number"
    );
  }, [reports]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (validReports.length > 0) {
      return [
        validReports[0].latitude as number,
        validReports[0].longitude as number,
      ];
    }

    return [11.0168, 76.9558];
  }, [validReports]);

  const highPriorityCount = validReports.filter(
    (report) => report.priority_level === "HIGH"
  ).length;

  const activeCount = validReports.filter((report) =>
    ["PENDING", "ASSIGNED", "IN_PROGRESS", "COLLECTED"].includes(report.status)
  ).length;

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
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              SmartWaste TN
            </h1>

            <p className="text-xs text-slate-500">
              Admin Waste Map
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              ← Dashboard
            </button>

            <button
              type="button"
              onClick={loadMapData}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              Refresh Map
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold text-orange-700">
            Geographic Intelligence
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Waste Complaint Map
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            View complaint locations, waste categories and priority levels
            using real GPS data submitted by citizens.
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Mapped Complaints
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : validReports.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              High Priority
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {loading ? "..." : highPriorityCount}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Complaints
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-600">
              {loading ? "..." : activeCount}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="flex h-[600px] items-center justify-center text-slate-500">
              Loading map...
            </div>
          ) : (
            <div className="h-[600px] w-full">
              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom
                style={{
                  height: "100%",
                  width: "100%",
                }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {validReports.map((report) => (
                  <Marker
                    key={report.id}
                    position={[
                      report.latitude as number,
                      report.longitude as number,
                    ]}
                  >
                    <Popup>
                      <div style={{ minWidth: "220px" }}>
                        <strong>
                          {report.ai_category || "Waste Complaint"}
                        </strong>

                        <p style={{ marginTop: "8px" }}>
                          📍 {report.location_text}
                        </p>

                        <p>
                          Priority: {report.priority_level}
                        </p>

                        <p>
                          Score: {report.priority_score}
                        </p>

                        <p>
                          Status: {report.status}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/complaints/${report.id}`
                            )
                          }
                          style={{
                            marginTop: "8px",
                            background: "#15803d",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            cursor: "pointer",
                          }}
                        >
                          Open Complaint
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>

        {!loading && validReports.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            No complaints with GPS coordinates are available yet.
          </div>
        )}

        {!loading && validReports.length > 0 && (
          <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Complaint Locations
            </h3>

            <div className="mt-5 space-y-3">
              {validReports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() =>
                    router.push(`/admin/complaints/${report.id}`)
                  }
                  className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-left hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {report.ai_category || "Waste Complaint"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      📍 {report.location_text}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                        report.priority_level
                      )}`}
                    >
                      {report.priority_level}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {report.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}