"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import { supabase } from "@/lib/supabase";

type WasteReport = {
  id: string;
  ai_category: string | null;
  priority_level: string;
  status: string;
  created_at: string;
};

type CollectionTask = {
  id: string;
  worker_id: string | null;
  status: string;
  assigned_at: string | null;
  started_at: string | null;
  collected_at: string | null;
  completed_at: string | null;
};

type Worker = {
  id: string;
  employee_code: string | null;
  current_workload: number;
};

export default function AdminAnalyticsPage() {
  const router = useRouter();

  const [reports, setReports] = useState<WasteReport[]>([]);
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
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

    const { data: reportData, error: reportError } = await supabase
      .from("waste_reports")
      .select(`
        id,
        ai_category,
        priority_level,
        status,
        created_at
      `)
      .order("created_at", { ascending: true });

    if (reportError) {
      setMessage(`Reports error: ${reportError.message}`);
      setLoading(false);
      return;
    }

    const { data: taskData, error: taskError } = await supabase
      .from("collection_tasks")
      .select(`
        id,
        worker_id,
        status,
        assigned_at,
        started_at,
        collected_at,
        completed_at
      `);

    if (taskError) {
      setMessage(`Tasks error: ${taskError.message}`);
      setLoading(false);
      return;
    }

    const { data: workerData, error: workerError } = await supabase
      .from("workers")
      .select(`
        id,
        employee_code,
        current_workload
      `);

    if (workerError) {
      setMessage(`Workers error: ${workerError.message}`);
      setLoading(false);
      return;
    }

    setReports(reportData || []);
    setTasks(taskData || []);
    setWorkers(workerData || []);

    setLoading(false);
  }

  const totalReports = reports.length;

  const completedReports = reports.filter(
    (report) => report.status === "COMPLETED"
  ).length;

  const pendingReports = reports.filter(
    (report) => report.status === "PENDING"
  ).length;

  const highPriorityReports = reports.filter(
    (report) => report.priority_level === "HIGH"
  ).length;

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};

    reports.forEach((report) => {
      const category = report.ai_category || "Unclassified";

      counts[category] = (counts[category] || 0) + 1;
    });

    return Object.entries(counts).map(([category, count]) => ({
      category,
      count,
    }));
  }, [reports]);

  const priorityData = useMemo(() => {
    const levels = ["LOW", "MEDIUM", "HIGH"];

    return levels.map((level) => ({
      level,
      count: reports.filter(
        (report) => report.priority_level === level
      ).length,
    }));
  }, [reports]);

  const statusData = useMemo(() => {
    const statuses = [
      "PENDING",
      "ASSIGNED",
      "IN_PROGRESS",
      "COLLECTED",
      "COMPLETED",
    ];

    return statuses.map((status) => ({
      status,
      count: reports.filter(
        (report) => report.status === status
      ).length,
    }));
  }, [reports]);

  const trendData = useMemo(() => {
    const counts: Record<string, number> = {};

    reports.forEach((report) => {
      const date = new Date(report.created_at).toLocaleDateString();

      counts[date] = (counts[date] || 0) + 1;
    });

    return Object.entries(counts).map(([date, count]) => ({
      date,
      count,
    }));
  }, [reports]);

  const workerPerformanceData = useMemo(() => {
    return workers.map((worker) => {
      const workerTasks = tasks.filter(
        (task) => task.worker_id === worker.id
      );

      const completed = workerTasks.filter(
        (task) => task.status === "COMPLETED"
      ).length;

      return {
        worker: worker.employee_code || "Worker",
        completed,
        workload: worker.current_workload,
      };
    });
  }, [workers, tasks]);

  const averageResponseTime = useMemo(() => {
    const completedTasks = tasks.filter(
      (task) => task.assigned_at && task.collected_at
    );

    if (completedTasks.length === 0) {
      return 0;
    }

    const totalMinutes = completedTasks.reduce(
      (sum, task) => {
        const assigned = new Date(
          task.assigned_at as string
        ).getTime();

        const collected = new Date(
          task.collected_at as string
        ).getTime();

        const differenceMinutes =
          (collected - assigned) / (1000 * 60);

        return sum + differenceMinutes;
      },
      0
    );

    return Math.round(
      totalMinutes / completedTasks.length
    );
  }, [tasks]);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              SmartWaste TN
            </h1>

            <p className="text-xs text-slate-500">
              Admin Analytics
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

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold text-orange-700">
            Municipal Intelligence
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Waste Management Analytics
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            Real-time insights from SmartWaste complaints,
            collection tasks and worker activity.
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Complaints
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : totalReports}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {loading ? "..." : completedReports}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-600">
              {loading ? "..." : pendingReports}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              High Priority
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {loading ? "..." : highPriorityReports}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Avg Response
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {loading ? "..." : `${averageResponseTime}m`}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Waste Category Distribution
            </h3>

            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Priority Distribution
            </h3>

            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="count"
                    nameKey="level"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {priorityData.map((entry, index) => (
                      <Cell
                        key={`${entry.level}-${index}`}
                        fill={
                          entry.level === "HIGH"
                            ? "#dc2626"
                            : entry.level === "MEDIUM"
                            ? "#f97316"
                            : "#16a34a"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Complaint Status
            </h3>

            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Complaint Trend
            </h3>

            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#16a34a"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Worker Performance
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Completed tasks and current workload.
          </p>

          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workerPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="worker" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="completed"
                  fill="#16a34a"
                  name="Completed"
                />
                <Bar
                  dataKey="workload"
                  fill="#f97316"
                  name="Current Workload"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </main>
  );
}