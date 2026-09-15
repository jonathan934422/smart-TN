"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type WasteReport = {
  id: string;
  citizen_id: string;
  image_url: string | null;
  location_text: string;
  latitude: number | null;
  longitude: number | null;
  quantity: string | null;
  description: string | null;

  ai_category: string | null;
  ai_confidence: number | null;
  manual_verification_required: boolean;

  ai_verified: boolean;
  ai_verified_by: string | null;
  ai_verified_at: string | null;
  ai_original_category: string | null;

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

type Worker = {
  id: string;
  employee_code: string | null;
  availability_status: string;
  current_workload: number;
  vehicle_type: string | null;
  waste_capabilities: string[] | null;

  current_latitude: number | null;
  current_longitude: number | null;
};

type CollectionTask = {
  id: string;
  worker_id: string | null;
  status: string;
  assigned_at: string | null;
  started_at: string | null;
  collected_at: string | null;
  completed_at: string | null;
  instructions: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
};

type WorkerRecommendation = {
  worker_id: string;
  employee_code: string | null;
  distance_km: number | null;

  distance_score: number;
  availability_score: number;
  workload_score: number;
  capability_score: number;

  match_score: number;
  reasons: string[];
};

const WASTE_CATEGORIES = [
  "Plastic",
  "Organic",
  "Paper",
  "Metal",
  "Glass",
  "E-waste",
  "Hazardous",
  "Mixed Waste",
];

export default function AdminComplaintPage() {
  const params = useParams();
  const router = useRouter();

  const reportId = params.id as string;

  const [report, setReport] =
    useState<WasteReport | null>(null);

  const [history, setHistory] =
    useState<StatusHistory[]>([]);

  const [workers, setWorkers] =
    useState<Worker[]>([]);

  const [currentTask, setCurrentTask] =
    useState<CollectionTask | null>(null);

  const [selectedWorker, setSelectedWorker] =
    useState("");

  const [instructions, setInstructions] =
    useState("");

  const [verifiedCategory, setVerifiedCategory] =
    useState("");

  const [
    recommendedWorker,
    setRecommendedWorker,
  ] = useState<WorkerRecommendation | null>(
    null
  );

  const [
    recommendationLoading,
    setRecommendationLoading,
  ] = useState(false);

  const [
    recommendationMessage,
    setRecommendationMessage,
  ] = useState("");

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] =
    useState(false);

  const [verifying, setVerifying] =
    useState(false);

  const [verifyingAI, setVerifyingAI] =
    useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (reportId) {
      loadComplaint();
    }
  }, [reportId]);

  function calculatePriorityValues(
    selectedCategory: string,
    selectedQuantity: string | null
  ) {
    let score = 0;

    switch (selectedCategory) {
      case "Plastic":
      case "Organic":
      case "Paper":
        score += 10;
        break;

      case "Metal":
      case "Glass":
        score += 15;
        break;

      case "Mixed Waste":
        score += 25;
        break;

      case "E-waste":
        score += 35;
        break;

      case "Hazardous":
        score += 50;
        break;
    }

    switch (selectedQuantity) {
      case "medium":
        score += 10;
        break;

      case "large":
        score += 20;
        break;

      case "very-large":
        score += 30;
        break;
    }

    let level = "LOW";

    if (score >= 61) {
      level = "HIGH";
    } else if (score >= 31) {
      level = "MEDIUM";
    }

    return {
      score,
      level,
    };
  }

  async function getWorkerRecommendation(
    reportData: WasteReport,
    workerData: Worker[]
  ) {
    setRecommendationLoading(true);
    setRecommendationMessage("");
    setRecommendedWorker(null);

    if (
      reportData.latitude === null ||
      reportData.longitude === null
    ) {
      setRecommendationMessage(
        "Complaint GPS location is unavailable."
      );

      setRecommendationLoading(false);
      return;
    }

    if (!reportData.ai_category) {
      setRecommendationMessage(
        "Waste category is unavailable."
      );

      setRecommendationLoading(false);
      return;
    }

    if (workerData.length === 0) {
      setRecommendationMessage(
        "No workers are available in the system."
      );

      setRecommendationLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workers/recommend`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            report_latitude:
              reportData.latitude,

            report_longitude:
              reportData.longitude,

            waste_category:
              reportData.ai_category,

            workers: workerData.map(
              (worker) => ({
                id: worker.id,

                employee_code:
                  worker.employee_code,

                availability_status:
                  worker.availability_status,

                current_workload:
                  worker.current_workload,

                waste_capabilities:
                  worker.waste_capabilities,

                current_latitude:
                  worker.current_latitude,

                current_longitude:
                  worker.current_longitude,
              })
            ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Recommendation API request failed."
        );
      }

      const result = await response.json();

      const recommendations:
        WorkerRecommendation[] =
        result.recommendations || [];

      /*
        We choose the highest-scoring worker
        who is actually AVAILABLE.
      */

      const bestAvailable =
        recommendations.find(
          (recommendation) => {
            const worker = workerData.find(
              (item) =>
                item.id ===
                recommendation.worker_id
            );

            return (
              worker?.availability_status ===
              "AVAILABLE"
            );
          }
        );

      if (!bestAvailable) {
        setRecommendationMessage(
          "No available worker could be recommended."
        );

        setRecommendationLoading(false);
        return;
      }

      setRecommendedWorker(bestAvailable);

      setRecommendationLoading(false);
    } catch (error) {
      console.error(error);

      setRecommendationMessage(
        "Could not load smart worker recommendation. Make sure FastAPI is running."
      );

      setRecommendationLoading(false);
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
      router.push("/login");
      return;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setMessage(
        `Profile error: ${profileError.message}`
      );

      setLoading(false);
      return;
    }

    if (profile.role !== "admin") {
      setMessage(
        "Access denied. Admin account required."
      );

      setLoading(false);
      return;
    }

    const {
      data: reportData,
      error: reportError,
    } = await supabase
      .from("waste_reports")
      .select(`
        id,
        citizen_id,
        image_url,
        location_text,
        latitude,
        longitude,
        quantity,
        description,
        ai_category,
        ai_confidence,
        manual_verification_required,
        ai_verified,
        ai_verified_by,
        ai_verified_at,
        ai_original_category,
        priority_score,
        priority_level,
        status,
        created_at
      `)
      .eq("id", reportId)
      .single();

    if (reportError || !reportData) {
      setMessage(
        reportError
          ? `Complaint error: ${reportError.message}`
          : "Complaint not found."
      );

      setLoading(false);
      return;
    }

    setReport(reportData);

    setVerifiedCategory(
      reportData.ai_category || ""
    );

    const {
      data: historyData,
      error: historyError,
    } = await supabase
      .from("status_history")
      .select(`
        id,
        previous_status,
        new_status,
        note,
        created_at
      `)
      .eq("waste_report_id", reportId)
      .order("created_at", {
        ascending: true,
      });

    if (historyError) {
      setMessage(
        `History error: ${historyError.message}`
      );

      setLoading(false);
      return;
    }

    setHistory(historyData || []);

    const {
      data: workerData,
      error: workerError,
    } = await supabase
      .from("workers")
      .select(`
        id,
        employee_code,
        availability_status,
        current_workload,
        vehicle_type,
        waste_capabilities,
        current_latitude,
        current_longitude
      `)
      .order("current_workload", {
        ascending: true,
      });

    if (workerError) {
      setMessage(
        `Worker error: ${workerError.message}`
      );

      setLoading(false);
      return;
    }

    const loadedWorkers =
      (workerData || []) as Worker[];

    setWorkers(loadedWorkers);

    const {
      data: taskData,
      error: taskError,
    } = await supabase
      .from("collection_tasks")
      .select(`
        id,
        worker_id,
        status,
        assigned_at,
        started_at,
        collected_at,
        completed_at,
        instructions,
        before_image_url,
        after_image_url
      `)
      .eq("waste_report_id", reportId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (taskError) {
      setMessage(
        `Task error: ${taskError.message}`
      );

      setLoading(false);
      return;
    }

    setCurrentTask(taskData || null);

    if (taskData?.worker_id) {
      setSelectedWorker(
        taskData.worker_id
      );
    } else {
      setSelectedWorker("");

      await getWorkerRecommendation(
        reportData as WasteReport,
        loadedWorkers
      );
    }

    if (taskData?.instructions) {
      setInstructions(
        taskData.instructions
      );
    }

    setLoading(false);
  }

  async function verifyAIClassification() {
    if (!report) {
      return;
    }

    if (!verifiedCategory) {
      setMessage(
        "Please select a waste category."
      );

      return;
    }

    setVerifyingAI(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage(
        "Admin session not found."
      );

      setVerifyingAI(false);
      return;
    }

    const priority =
      calculatePriorityValues(
        verifiedCategory,
        report.quantity
      );

    const categoryChanged =
      verifiedCategory !==
      report.ai_category;

    const originalCategory =
      categoryChanged
        ? report.ai_original_category ||
          report.ai_category
        : report.ai_original_category;

    const now =
      new Date().toISOString();

    const { error } = await supabase
      .from("waste_reports")
      .update({
        ai_category:
          verifiedCategory,

        ai_original_category:
          originalCategory || null,

        ai_verified: true,

        ai_verified_by: user.id,

        ai_verified_at: now,

        manual_verification_required:
          false,

        priority_score:
          priority.score,

        priority_level:
          priority.level,

        updated_at: now,
      })
      .eq("id", report.id);

    if (error) {
      setMessage(
        `AI verification error: ${error.message}`
      );

      setVerifyingAI(false);
      return;
    }

    if (categoryChanged) {
      setMessage(
        `AI classification corrected from ${
          report.ai_category || "Unknown"
        } to ${verifiedCategory}. Priority recalculated to ${
          priority.level
        }.`
      );
    } else {
      setMessage(
        `AI classification confirmed as ${verifiedCategory}.`
      );
    }

    setVerifyingAI(false);

    await loadComplaint();
  }

  function useRecommendedWorker() {
    if (!recommendedWorker) {
      return;
    }

    setSelectedWorker(
      recommendedWorker.worker_id
    );

    setMessage(
      `${recommendedWorker.employee_code || "Recommended worker"} selected with ${recommendedWorker.match_score}% match.`
    );
  }

  async function assignWorker() {
    if (!report) {
      return;
    }

    if (!selectedWorker) {
      setMessage(
        "Please select a worker."
      );

      return;
    }

    if (currentTask) {
      setMessage(
        "This complaint already has a collection task."
      );

      return;
    }

    setAssigning(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage(
        "Admin session not found. Please login again."
      );

      setAssigning(false);
      return;
    }

    const worker = workers.find(
      (item) =>
        item.id === selectedWorker
    );

    if (!worker) {
      setMessage(
        "Selected worker was not found."
      );

      setAssigning(false);
      return;
    }

    if (
      worker.availability_status !==
      "AVAILABLE"
    ) {
      setMessage(
        "Selected worker is currently not available."
      );

      setAssigning(false);
      return;
    }

    const {
      data: task,
      error: taskError,
    } = await supabase
      .from("collection_tasks")
      .insert({
        waste_report_id:
          report.id,

        worker_id:
          selectedWorker,

        assigned_by:
          user.id,

        status:
          "ASSIGNED",

        instructions:
          instructions || null,

        assigned_at:
          new Date().toISOString(),
      })
      .select(`
        id,
        worker_id,
        status,
        assigned_at,
        started_at,
        collected_at,
        completed_at,
        instructions,
        before_image_url,
        after_image_url
      `)
      .single();

    if (taskError) {
      setMessage(
        `Assignment error: ${taskError.message}`
      );

      setAssigning(false);
      return;
    }

    const now =
      new Date().toISOString();

    const {
      error: reportUpdateError,
    } = await supabase
      .from("waste_reports")
      .update({
        status: "ASSIGNED",
        updated_at: now,
      })
      .eq("id", report.id);

    if (reportUpdateError) {
      setMessage(
        `Complaint status error: ${reportUpdateError.message}`
      );

      setAssigning(false);
      return;
    }

    const {
      error: workerUpdateError,
    } = await supabase
      .from("workers")
      .update({
        current_workload:
          worker.current_workload + 1,

        availability_status:
          "BUSY",

        updated_at: now,
      })
      .eq(
        "id",
        selectedWorker
      );

    if (workerUpdateError) {
      setMessage(
        `Worker update error: ${workerUpdateError.message}`
      );

      setAssigning(false);
      return;
    }

    setCurrentTask(task);

    setMessage(
      "Worker assigned successfully."
    );

    setAssigning(false);

    await loadComplaint();
  }

  async function verifyAndComplete() {
    if (!report || !currentTask) {
      return;
    }

    if (
      currentTask.status !== "COLLECTED"
    ) {
      setMessage(
        "This task must be COLLECTED before admin verification."
      );

      return;
    }

    if (
      !currentTask.after_image_url
    ) {
      setMessage(
        "Completion proof is missing. Cannot complete the complaint."
      );

      return;
    }

    setVerifying(true);
    setMessage("");

    const now =
      new Date().toISOString();

    const { error: taskError } =
      await supabase
        .from("collection_tasks")
        .update({
          status: "COMPLETED",
          completed_at: now,
          updated_at: now,
        })
        .eq(
          "id",
          currentTask.id
        );

    if (taskError) {
      setMessage(
        `Task completion error: ${taskError.message}`
      );

      setVerifying(false);
      return;
    }

    const { error: reportError } =
      await supabase
        .from("waste_reports")
        .update({
          status: "COMPLETED",
          updated_at: now,
        })
        .eq("id", report.id);

    if (reportError) {
      setMessage(
        `Complaint completion error: ${reportError.message}`
      );

      setVerifying(false);
      return;
    }

    if (currentTask.worker_id) {
      const worker =
        workers.find(
          (item) =>
            item.id ===
            currentTask.worker_id
        );

      if (worker) {
        const newWorkload =
          Math.max(
            worker.current_workload -
              1,
            0
          );

        const {
          error: workerError,
        } = await supabase
          .from("workers")
          .update({
            current_workload:
              newWorkload,

            availability_status:
              newWorkload === 0
                ? "AVAILABLE"
                : "BUSY",

            updated_at: now,
          })
          .eq(
            "id",
            worker.id
          );

        if (workerError) {
          setMessage(
            `Complaint completed, but worker update failed: ${workerError.message}`
          );

          setVerifying(false);

          await loadComplaint();

          return;
        }
      }
    }

    setMessage(
      "Completion proof verified. Complaint completed successfully."
    );

    setVerifying(false);

    await loadComplaint();
  }

  function getPriorityStyle(
    level: string
  ) {
    if (level === "HIGH") {
      return "bg-red-100 text-red-700";
    }

    if (level === "MEDIUM") {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-green-100 text-green-700";
  }

  function getStatusStyle(
    status: string
  ) {
    if (status === "COMPLETED") {
      return "bg-green-100 text-green-700";
    }

    if (status === "COLLECTED") {
      return "bg-teal-100 text-teal-700";
    }

    if (
      status === "IN_PROGRESS"
    ) {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "ASSIGNED") {
      return "bg-purple-100 text-purple-700";
    }

    return "bg-slate-100 text-slate-700";
  }

  function getWorker(
    workerId: string | null
  ) {
    if (!workerId) {
      return null;
    }

    return (
      workers.find(
        (worker) =>
          worker.id === workerId
      ) || null
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl rounded-xl border bg-white p-6">
          Loading complaint...
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl rounded-xl border bg-white p-6 text-red-600">
          {message ||
            "Complaint not found."}
        </div>
      </main>
    );
  }

  const assignedWorker =
    currentTask
      ? getWorker(
          currentTask.worker_id
        )
      : null;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              SmartWaste TN
            </h1>

            <p className="text-xs text-slate-500">
              Admin Portal • Manage
              Complaint
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            ← Admin Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {message && (
          <div className="mb-6 rounded-xl border bg-white p-4 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* LEFT SIDE */}

          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm lg:col-span-2">

            {report.image_url ? (
              <div className="relative h-96 w-full bg-slate-100">
                <Image
                  src={
                    report.image_url
                  }
                  alt="Waste complaint"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center bg-slate-100 text-slate-500">
                No complaint image
              </div>
            )}

            <div className="p-6">

              <div className="flex flex-wrap gap-3">

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
                  {
                    report.priority_level
                  }{" "}
                  PRIORITY
                </span>
              </div>

              <h2 className="mt-6 text-2xl font-bold text-slate-900">
                {report.ai_category ||
                  "Unclassified Waste"}
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Priority Score
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {
                      report.priority_score
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Quantity
                  </p>

                  <p className="mt-2 text-xl font-bold capitalize text-slate-900">
                    {report.quantity ||
                      "-"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm text-slate-700">

                <p>
                  <span className="font-semibold">
                    Location:
                  </span>{" "}
                  {
                    report.location_text
                  }
                </p>

                <p>
                  <span className="font-semibold">
                    Latitude:
                  </span>{" "}
                  {report.latitude ??
                    "-"}
                </p>

                <p>
                  <span className="font-semibold">
                    Longitude:
                  </span>{" "}
                  {report.longitude ??
                    "-"}
                </p>

                <p>
                  <span className="font-semibold">
                    Submitted:
                  </span>{" "}
                  {new Date(
                    report.created_at
                  ).toLocaleString()}
                </p>

                <p>
                  <span className="font-semibold">
                    Complaint ID:
                  </span>{" "}
                  <span className="break-all">
                    {report.id}
                  </span>
                </p>
              </div>

              {report.description && (
                <div className="mt-6 rounded-xl border bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Citizen Description
                  </p>

                  <p className="mt-2 leading-6 text-slate-700">
                    {
                      report.description
                    }
                  </p>
                </div>
              )}

              {/* AI VERIFICATION */}

              <div
                className={`mt-6 rounded-2xl border p-6 ${
                  report.ai_verified
                    ? "border-green-300 bg-green-50"
                    : report.manual_verification_required
                    ? "border-orange-300 bg-orange-50"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      SmartWaste Vision AI
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-slate-900">
                      AI Classification
                    </h3>
                  </div>

                  {report.ai_verified ? (
                    <span className="rounded-full bg-green-700 px-3 py-1 text-xs font-bold text-white">
                      ✓ ADMIN VERIFIED
                    </span>
                  ) : report.manual_verification_required ? (
                    <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">
                      ⚠ MANUAL CHECK
                      REQUIRED
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-bold text-white">
                      HIGH CONFIDENCE
                    </span>
                  )}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-slate-500">
                      AI Category
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {report.ai_category ||
                        "Not classified"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-slate-500">
                      AI Confidence
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {report.ai_confidence !==
                      null
                        ? `${report.ai_confidence}%`
                        : "Not available"}
                    </p>
                  </div>
                </div>

                {report.ai_original_category && (
                  <div className="mt-4 rounded-xl border bg-white p-4">

                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Original AI
                      Prediction
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {
                        report.ai_original_category
                      }
                    </p>
                  </div>
                )}

                {report.manual_verification_required &&
                  !report.ai_verified && (
                    <div className="mt-5 rounded-xl border border-orange-200 bg-white p-4">

                      <p className="font-semibold text-orange-800">
                        ⚠ Human
                        verification required
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        AI confidence is
                        below 70%. Check the
                        uploaded image before
                        confirming or
                        correcting the
                        category.
                      </p>
                    </div>
                  )}

                {!report.ai_verified && (
                  <div className="mt-5">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Admin Verified
                      Category
                    </label>

                    <select
                      value={
                        verifiedCategory
                      }
                      onChange={(event) =>
                        setVerifiedCategory(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
                    >
                      <option value="">
                        Select category
                      </option>

                      {WASTE_CATEGORIES.map(
                        (item) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >
                            {
                              item
                            }
                          </option>
                        )
                      )}
                    </select>

                    <button
                      type="button"
                      onClick={
                        verifyAIClassification
                      }
                      disabled={
                        verifyingAI ||
                        !verifiedCategory
                      }
                      className="mt-4 w-full rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {verifyingAI
                        ? "Saving Verification..."
                        : verifiedCategory ===
                          report.ai_category
                        ? "✓ Confirm AI Category"
                        : "✓ Correct & Verify Category"}
                    </button>
                  </div>
                )}

                {report.ai_verified &&
                  report.ai_verified_at && (
                    <div className="mt-5 rounded-xl border border-green-200 bg-white p-4">

                      <p className="font-semibold text-green-800">
                        ✓ AI
                        classification
                        verified by admin
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(
                          report.ai_verified_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
              </div>

              {/* COMPLETION PROOF */}

              {currentTask?.after_image_url && (
                <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5">

                  <h3 className="text-lg font-bold text-teal-800">
                    Worker Completion
                    Proof
                  </h3>

                  <p className="mt-2 text-sm text-teal-700">
                    Review the worker&apos;s
                    after-cleanup photo
                    before completing this
                    complaint.
                  </p>

                  <div className="relative mt-5 h-80 w-full overflow-hidden rounded-xl border bg-white">

                    <Image
                      src={
                        currentTask.after_image_url
                      }
                      alt="Worker completion proof"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>

                  {currentTask.collected_at && (
                    <p className="mt-3 text-xs text-teal-700">
                      Collected:{" "}
                      {new Date(
                        currentTask.collected_at
                      ).toLocaleString()}
                    </p>
                  )}

                  {currentTask.status ===
                    "COLLECTED" && (
                    <button
                      type="button"
                      onClick={
                        verifyAndComplete
                      }
                      disabled={
                        verifying
                      }
                      className="mt-5 w-full rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                    >
                      {verifying
                        ? "Verifying..."
                        : "Verify & Complete Complaint"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="space-y-6">

            <div className="rounded-2xl border bg-white p-6 shadow-sm">

              <h3 className="text-lg font-bold text-slate-900">
                Worker Assignment
              </h3>

              {currentTask ? (

                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

                  <p className="text-xs font-semibold uppercase text-green-700">
                    Assigned Worker
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {assignedWorker?.employee_code ||
                      "Worker"}
                  </p>

                  <div className="mt-3 space-y-2 text-sm text-slate-600">

                    <p>
                      Task Status:{" "}
                      <span className="font-semibold">
                        {
                          currentTask.status
                        }
                      </span>
                    </p>

                    <p>
                      Vehicle:{" "}
                      <span className="font-semibold">
                        {assignedWorker?.vehicle_type ||
                          "-"}
                      </span>
                    </p>

                    <p>
                      Workload:{" "}
                      <span className="font-semibold">
                        {assignedWorker?.current_workload ??
                          "-"}
                      </span>
                    </p>
                  </div>
                </div>

              ) : (
                <>

                  {/* SMART RECOMMENDATION */}

                  <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">

                    <div className="flex items-center justify-between gap-3">

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                          Smart Assignment
                        </p>

                        <h4 className="mt-1 font-bold text-slate-900">
                          Recommended Worker
                        </h4>
                      </div>

                      <span className="text-2xl">
                        🤖
                      </span>
                    </div>

                    {recommendationLoading && (
                      <p className="mt-4 text-sm text-blue-700">
                        Calculating best
                        worker...
                      </p>
                    )}

                    {!recommendationLoading &&
                      recommendationMessage && (
                        <div className="mt-4 rounded-lg bg-white p-3 text-sm text-slate-600">
                          {
                            recommendationMessage
                          }
                        </div>
                      )}

                    {!recommendationLoading &&
                      recommendedWorker && (
                        <>
                          <div className="mt-4 rounded-xl bg-white p-4">

                            <div className="flex items-center justify-between gap-3">

                              <div>
                                <p className="text-xs text-slate-500">
                                  Best Match
                                </p>

                                <p className="mt-1 text-xl font-bold text-slate-900">
                                  {recommendedWorker.employee_code ||
                                    "Worker"}
                                </p>
                              </div>

                              <div className="rounded-full bg-green-100 px-3 py-2 text-sm font-bold text-green-700">
                                {
                                  recommendedWorker.match_score
                                }
                                % Match
                              </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-slate-600">

                              {recommendedWorker.reasons.map(
                                (
                                  reason,
                                  index
                                ) => (
                                  <p
                                    key={
                                      index
                                    }
                                  >
                                    ✓{" "}
                                    {
                                      reason
                                    }
                                  </p>
                                )
                              )}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">

                              <div className="rounded-lg bg-slate-50 p-2">
                                Distance
                                <div className="font-bold">
                                  {
                                    recommendedWorker.distance_score
                                  }
                                  /40
                                </div>
                              </div>

                              <div className="rounded-lg bg-slate-50 p-2">
                                Availability
                                <div className="font-bold">
                                  {
                                    recommendedWorker.availability_score
                                  }
                                  /25
                                </div>
                              </div>

                              <div className="rounded-lg bg-slate-50 p-2">
                                Workload
                                <div className="font-bold">
                                  {
                                    recommendedWorker.workload_score
                                  }
                                  /20
                                </div>
                              </div>

                              <div className="rounded-lg bg-slate-50 p-2">
                                Capability
                                <div className="font-bold">
                                  {
                                    recommendedWorker.capability_score
                                  }
                                  /15
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={
                                useRecommendedWorker
                              }
                              className="mt-4 w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800"
                            >
                              Use Recommended
                              Worker
                            </button>
                          </div>
                        </>
                      )}
                  </div>

                  {/* MANUAL SELECTION */}

                  <p className="mt-5 text-sm text-slate-500">
                    You can use the smart
                    recommendation above or
                    manually choose another
                    available worker.
                  </p>

                  <div className="mt-4">

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Worker
                    </label>

                    <select
                      value={
                        selectedWorker
                      }
                      onChange={(event) =>
                        setSelectedWorker(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
                    >

                      <option value="">
                        Select worker
                      </option>

                      {workers.map(
                        (worker) => (
                          <option
                            key={
                              worker.id
                            }
                            value={
                              worker.id
                            }
                            disabled={
                              worker.availability_status !==
                              "AVAILABLE"
                            }
                          >
                            {worker.employee_code ||
                              "Worker"}{" "}
                            —{" "}
                            {
                              worker.availability_status
                            }{" "}
                            — Workload{" "}
                            {
                              worker.current_workload
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="mt-4">

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Instructions
                    </label>

                    <textarea
                      rows={4}
                      value={
                        instructions
                      }
                      onChange={(event) =>
                        setInstructions(
                          event.target
                            .value
                        )
                      }
                      placeholder="Example: Collect immediately and upload completion proof."
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={
                      assignWorker
                    }
                    disabled={
                      assigning ||
                      !selectedWorker
                    }
                    className="mt-5 w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {assigning
                      ? "Assigning Worker..."
                      : "Assign Worker"}
                  </button>
                </>
              )}
            </div>

            {/* LIFECYCLE */}

            <div className="rounded-2xl border bg-white p-6 shadow-sm">

              <h3 className="text-lg font-bold text-slate-900">
                Complaint Lifecycle
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Every complaint status
                change is recorded here.
              </p>

              {history.length === 0 ? (
                <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  No history available.
                </div>
              ) : (
                <div className="mt-6 space-y-5">

                  {history.map(
                    (item, index) => (
                      <div
                        key={item.id}
                        className="relative border-l-2 border-green-200 pl-5"
                      >
                        <div className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-green-700" />

                        <p className="text-xs font-semibold text-green-700">
                          STEP{" "}
                          {index + 1}
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {
                            item.new_status
                          }
                        </p>

                        {item.previous_status && (
                          <p className="mt-1 text-xs text-slate-500">
                            Previous:{" "}
                            {
                              item.previous_status
                            }
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
                          ).toLocaleString()}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}