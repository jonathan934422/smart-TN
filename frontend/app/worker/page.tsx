"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type WorkerProfile = {
  id: string;
  employee_code: string | null;
  availability_status: string;
  current_workload: number;
  vehicle_type: string | null;
};

type Task = {
  id: string;
  waste_report_id: string;
  status: string;
  instructions: string | null;
  assigned_at: string | null;
  created_at: string;
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

export default function WorkerDashboardPage() {
  const router = useRouter();

  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadWorkerDashboard();
  }, []);

  async function loadWorkerDashboard() {
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

    if (profile.role !== "worker") {
      setMessage("Access denied. Worker account required.");
      setLoading(false);
      return;
    }

    const { data: workerData, error: workerError } = await supabase
      .from("workers")
      .select(`
        id,
        employee_code,
        availability_status,
        current_workload,
        vehicle_type
      `)
      .eq("id", user.id)
      .single();

    if (workerError || !workerData) {
      setMessage(
        `Worker profile error: ${
          workerError?.message || "Worker profile not found."
        }`
      );
      setLoading(false);
      return;
    }

    setWorker(workerData);

    const { data: taskData, error: taskError } = await supabase
      .from("collection_tasks")
      .select(`
        id,
        waste_report_id,
        status,
        instructions,
        assigned_at,
        created_at,
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
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });

    if (taskError) {
      setMessage(`Task error: ${taskError.message}`);
      setLoading(false);
      return;
    }

    setTasks((taskData || []) as unknown as Task[]);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
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

  const activeTasks = tasks.filter(
    (task) => task.status !== "COMPLETED"
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              SmartWaste TN
            </h1>

            <p className="text-xs text-slate-500">
              Worker Portal
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              ← Home
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div>
          <p className="text-sm font-medium text-green-700">
            Field Worker Dashboard
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Assigned Collection Tasks
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            View your assigned waste collection tasks and update collection
            progress.
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Worker ID
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {loading
                ? "..."
                : worker?.employee_code || "Worker"}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Tasks
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-600">
              {loading ? "..." : activeTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Availability
            </p>

            <p className="mt-2 text-xl font-bold text-green-700">
              {loading
                ? "..."
                : worker?.availability_status || "-"}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                My Tasks
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Tasks assigned to your worker account.
              </p>
            </div>

            <button
              type="button"
              onClick={loadWorkerDashboard}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading tasks...
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
              <p className="text-3xl">
                🚛
              </p>

              <h4 className="mt-3 font-semibold text-slate-900">
                No tasks assigned
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                New collection tasks assigned by the admin will appear here.
              </p>
            </div>
          )}

          {!loading && tasks.length > 0 && (
            <div className="mt-6 space-y-5">
              {tasks.map((task) => {
                const report = task.waste_reports;

                return (
                  <div
                    key={task.id}
                    className="overflow-hidden rounded-xl border"
                  >
                    <div className="flex flex-col md:flex-row">
                      {report?.image_url ? (
                        <div className="relative h-56 w-full flex-shrink-0 bg-slate-100 md:w-72">
                          <Image
                            src={report.image_url}
                            alt="Waste collection task"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-56 w-full flex-shrink-0 items-center justify-center bg-slate-100 text-sm text-slate-400 md:w-72">
                          No image
                        </div>
                      )}

                      <div className="flex-1 p-6">
                        <div className="flex flex-wrap gap-2">
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

                        <h4 className="mt-4 text-xl font-bold text-slate-900">
                          {report?.ai_category ||
                            "Waste Collection Task"}
                        </h4>

                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                          <p>
                            📍{" "}
                            {report?.location_text ||
                              "Location not available"}
                          </p>

                          <p>
                            Quantity:{" "}
                            <span className="capitalize">
                              {report?.quantity || "-"}
                            </span>
                          </p>

                          <p>
                            Priority Score:{" "}
                            {report?.priority_score ?? "-"}
                          </p>

                          <p>
                            Vehicle:{" "}
                            {worker?.vehicle_type || "-"}
                          </p>
                        </div>

                        {task.instructions && (
                          <div className="mt-4 rounded-lg bg-orange-50 p-4 text-sm text-orange-800">
                            <span className="font-semibold">
                              Admin Instructions:
                            </span>{" "}
                            {task.instructions}
                          </div>
                        )}

                        {report?.description && (
                          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                            <span className="font-semibold">
                              Citizen Description:
                            </span>{" "}
                            {report.description}
                          </div>
                        )}

                        <p className="mt-4 text-xs text-slate-400">
                          Assigned:{" "}
                          {task.assigned_at
                            ? new Date(
                                task.assigned_at
                              ).toLocaleString()
                            : "-"}
                        </p>

                        <Link
                          href={`/worker/tasks/${task.id}`}
                          className="mt-5 inline-block rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                        >
                          View Task
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Completed History
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Completed collection tasks: {completedTasks.length}
          </p>
        </div>
      </section>
    </main>
  );
} 