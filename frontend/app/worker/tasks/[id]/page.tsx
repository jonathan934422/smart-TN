"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Task = {
  id: string;
  waste_report_id: string;
  worker_id: string;
  status: string;
  instructions: string | null;
  assigned_at: string | null;
  started_at: string | null;
  collected_at: string | null;
  completed_at: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  waste_reports: {
    id: string;
    image_url: string | null;
    location_text: string;
    quantity: string | null;
    description: string | null;
    ai_category: string | null;
    priority_score: number;
    priority_level: string;
    status: string;
  } | null;
};

export default function WorkerTaskPage() {
  const params = useParams();
  const router = useRouter();

  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  async function loadTask() {
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

    if (profileError || profile?.role !== "worker") {
      setMessage("Access denied. Worker account required.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("collection_tasks")
      .select(`
        id,
        waste_report_id,
        worker_id,
        status,
        instructions,
        assigned_at,
        started_at,
        collected_at,
        completed_at,
        before_image_url,
        after_image_url,
        waste_reports (
          id,
          image_url,
          location_text,
          quantity,
          description,
          ai_category,
          priority_score,
          priority_level,
          status
        )
      `)
      .eq("id", taskId)
      .eq("worker_id", user.id)
      .single();

    if (error || !data) {
      setMessage("Task not found.");
      setLoading(false);
      return;
    }

    setTask(data as unknown as Task);
    setLoading(false);
  }

  async function startCollection() {
    if (!task) {
      return;
    }

    setUpdating(true);
    setMessage("");

    const now = new Date().toISOString();

    const { error: taskError } = await supabase
      .from("collection_tasks")
      .update({
        status: "IN_PROGRESS",
        started_at: now,
        updated_at: now,
      })
      .eq("id", task.id);

    if (taskError) {
      setMessage(`Task update error: ${taskError.message}`);
      setUpdating(false);
      return;
    }

    const { error: reportError } = await supabase
      .from("waste_reports")
      .update({
        status: "IN_PROGRESS",
        updated_at: now,
      })
      .eq("id", task.waste_report_id);

    if (reportError) {
      setMessage(`Complaint update error: ${reportError.message}`);
      setUpdating(false);
      return;
    }

    setMessage("Collection started successfully.");
    setUpdating(false);

    await loadTask();
  }

  function handleProofChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setProofFile(null);
      setProofPreview("");
      return;
    }

    setProofFile(file);

    const previewUrl = URL.createObjectURL(file);
    setProofPreview(previewUrl);
  }

  async function submitCompletionProof() {
    if (!task) {
      return;
    }

    if (!proofFile) {
      setMessage("Please select a completion proof image.");
      return;
    }

    setUploadingProof(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Worker session not found. Please login again.");
      setUploadingProof(false);
      return;
    }

    const fileExtension =
      proofFile.name.split(".").pop() || "jpg";

    const fileName =
      `${user.id}/${task.id}/${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("collection-proof")
      .upload(fileName, proofFile);

    if (uploadError) {
      setMessage(
        `Proof upload error: ${uploadError.message}`
      );
      setUploadingProof(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("collection-proof")
      .getPublicUrl(fileName);

    const proofUrl = publicUrlData.publicUrl;

    const now = new Date().toISOString();

    const { error: taskUpdateError } = await supabase
      .from("collection_tasks")
      .update({
        after_image_url: proofUrl,
        status: "COLLECTED",
        collected_at: now,
        updated_at: now,
      })
      .eq("id", task.id)
      .eq("worker_id", user.id);

    if (taskUpdateError) {
      setMessage(
        `Task proof update error: ${taskUpdateError.message}`
      );
      setUploadingProof(false);
      return;
    }

    const { error: reportUpdateError } = await supabase
      .from("waste_reports")
      .update({
        status: "COLLECTED",
        updated_at: now,
      })
      .eq("id", task.waste_report_id);

    if (reportUpdateError) {
      setMessage(
        `Complaint status error: ${reportUpdateError.message}`
      );
      setUploadingProof(false);
      return;
    }

    setProofFile(null);
    setProofPreview("");

    setMessage(
      "Completion proof uploaded successfully. Task is now COLLECTED."
    );

    setUploadingProof(false);

    await loadTask();
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-5xl rounded-xl border bg-white p-6">
          Loading task...
        </div>
      </main>
    );
  }

  if (!task) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-5xl rounded-xl border bg-white p-6 text-red-600">
          {message || "Task not found."}
        </div>
      </main>
    );
  }

  const report = task.waste_reports;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              SmartWaste TN
            </h1>

            <p className="text-xs text-slate-500">
              Worker Portal • Task Details
            </p>
          </div>

          <Link
            href="/worker"
            className="rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            ← Worker Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {message && (
          <div className="mb-6 rounded-xl border bg-white p-4 text-sm text-slate-700">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            {report?.image_url ? (
              <div className="relative h-80 w-full bg-slate-100">
                <Image
                  src={report.image_url}
                  alt="Waste task"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center bg-slate-100 text-slate-500">
                No image
              </div>
            )}

            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>

                {report && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                      report.priority_level
                    )}`}
                  >
                    {report.priority_level} PRIORITY
                  </span>
                )}
              </div>

              <h2 className="mt-6 text-2xl font-bold text-slate-900">
                {report?.ai_category || "Waste Collection Task"}
              </h2>

              <div className="mt-6 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">
                    Location:
                  </span>{" "}
                  {report?.location_text || "-"}
                </p>

                <p>
                  <span className="font-semibold">
                    Quantity:
                  </span>{" "}
                  <span className="capitalize">
                    {report?.quantity || "-"}
                  </span>
                </p>

                <p>
                  <span className="font-semibold">
                    Priority Score:
                  </span>{" "}
                  {report?.priority_score ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">
                    Assigned:
                  </span>{" "}
                  {task.assigned_at
                    ? new Date(task.assigned_at).toLocaleString()
                    : "-"}
                </p>
              </div>

              {report?.description && (
                <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  <span className="font-semibold">
                    Citizen Description:
                  </span>{" "}
                  {report.description}
                </div>
              )}

              {task.instructions && (
                <div className="mt-4 rounded-xl bg-orange-50 p-4 text-sm text-orange-800">
                  <span className="font-semibold">
                    Admin Instructions:
                  </span>{" "}
                  {task.instructions}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">
                Collection Progress
              </h3>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Current Status
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {task.status}
                  </p>
                </div>

                {task.started_at && (
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase text-blue-700">
                      Collection Started
                    </p>

                    <p className="mt-2 text-sm text-slate-700">
                      {new Date(task.started_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {task.collected_at && (
                  <div className="rounded-xl bg-teal-50 p-4">
                    <p className="text-xs font-semibold uppercase text-teal-700">
                      Waste Collected
                    </p>

                    <p className="mt-2 text-sm text-slate-700">
                      {new Date(task.collected_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {task.status === "ASSIGNED" && (
                  <button
                    type="button"
                    onClick={startCollection}
                    disabled={updating}
                    className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {updating
                      ? "Starting Collection..."
                      : "Start Collection"}
                  </button>
                )}

                {task.status === "IN_PROGRESS" && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                    Collection is currently in progress.
                  </div>
                )}

                {task.status === "COLLECTED" && (
                  <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-700">
                    Waste collection completed. Waiting for admin verification.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">
                Completion Proof
              </h3>

              {task.after_image_url ? (
                <div className="mt-5">
                  <div className="relative h-64 w-full overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={task.after_image_url}
                      alt="Collection completion proof"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>

                  <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                    Completion proof uploaded successfully.
                  </div>
                </div>
              ) : task.status === "IN_PROGRESS" ? (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    After-Cleanup Photo
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofChange}
                    className="block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-700"
                  />

                  {proofPreview && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-slate-700">
                        Proof Preview
                      </p>

                      <div className="relative h-64 w-full overflow-hidden rounded-xl border bg-slate-100">
                        <Image
                          src={proofPreview}
                          alt="Completion proof preview"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={submitCompletionProof}
                    disabled={
                      uploadingProof || !proofFile
                    }
                    className="mt-5 w-full rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingProof
                      ? "Uploading Proof..."
                      : "Submit Completion Proof"}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Start the collection before uploading completion proof.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}