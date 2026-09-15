"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Language } from "@/lib/language";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  waste_report_id: string | null;
  collection_task_id: string | null;
  created_at: string;
};

export default function CitizenNotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("smartwaste-language");

    if (savedLanguage === "en" || savedLanguage === "ta") {
      setLanguage(savedLanguage);
    }

    loadNotifications();
  }, []);

  function text(english: string, tamil: string) {
    return language === "en" ? english : tamil;
  }

  function changeLanguage(newLanguage: Language) {
    setLanguage(newLanguage);
    localStorage.setItem("smartwaste-language", newLanguage);
  }

  async function loadNotifications() {
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
      .from("notifications")
      .select(`
        id,
        title,
        message,
        type,
        is_read,
        waste_report_id,
        collection_task_id,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Failed to load notifications: ${error.message}`);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }

  async function markAsRead(notificationId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", notificationId);

    if (error) {
      setMessage(`Failed to update notification: ${error.message}`);
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: true,
            }
          : notification
      )
    );
  }

  async function markAllAsRead() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    if (error) {
      setMessage(`Failed to mark notifications: ${error.message}`);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );
  }

  function openNotification(notification: Notification) {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.waste_report_id) {
      router.push(
        `/citizen/complaints/${notification.waste_report_id}`
      );
    }
  }

  function getNotificationIcon(type: string | null) {
    if (type === "ASSIGNED") {
      return "👷";
    }

    if (type === "IN_PROGRESS") {
      return "🚛";
    }

    if (type === "COLLECTED") {
      return "♻️";
    }

    if (type === "COMPLETED") {
      return "✅";
    }

    if (type === "HIGH_PRIORITY") {
      return "🚨";
    }

    return "🔔";
  }

  function translateNotificationTitle(notification: Notification) {
    if (language === "en") {
      return notification.title;
    }

    switch (notification.type) {
      case "ASSIGNED":
        return "பணியாளர் ஒதுக்கப்பட்டார்";

      case "IN_PROGRESS":
        return "சேகரிப்பு தொடங்கியது";

      case "COLLECTED":
        return "கழிவு சேகரிக்கப்பட்டது";

      case "COMPLETED":
        return "புகார் முடிக்கப்பட்டது";

      case "HIGH_PRIORITY":
        return "அதிக முன்னுரிமை புகார்";

      default:
        return notification.title;
    }
  }

  function translateNotificationMessage(notification: Notification) {
    if (language === "en") {
      return notification.message;
    }

    switch (notification.type) {
      case "ASSIGNED":
        return "உங்கள் கழிவு புகாருக்கு ஒரு பணியாளர் ஒதுக்கப்பட்டுள்ளார்.";

      case "IN_PROGRESS":
        return "உங்கள் கழிவு புகாருக்கான சேகரிப்பு நடவடிக்கை தொடங்கியுள்ளது.";

      case "COLLECTED":
        return "உங்கள் புகாரில் குறிப்பிடப்பட்ட கழிவு சேகரிக்கப்பட்டுள்ளது.";

      case "COMPLETED":
        return "உங்கள் கழிவு புகார் சரிபார்க்கப்பட்டு வெற்றிகரமாக முடிக்கப்பட்டுள்ளது.";

      case "HIGH_PRIORITY":
        return "உங்கள் புகார் அதிக முன்னுரிமை கொண்ட புகாராக வகைப்படுத்தப்பட்டுள்ளது.";

      default:
        return notification.message;
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <main className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              SmartWaste TN
            </h1>

            <p className="text-xs text-slate-500">
              {text(
                "Citizen Notifications",
                "குடிமக்கள் அறிவிப்புகள்"
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
              onClick={() => router.push("/citizen")}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              ← {text("Dashboard", "முகப்பு")}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {/* TITLE AREA */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-orange-700">
              {text(
                "Complaint Updates",
                "புகார் நிலை அறிவிப்புகள்"
              )}
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {text(
                "Notifications",
                "அறிவிப்புகள்"
              )}
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              {text(
                "Track worker assignment, collection progress and complaint completion updates.",
                "பணியாளர் ஒதுக்கீடு, கழிவு சேகரிப்பு முன்னேற்றம் மற்றும் புகார் நிறைவு அறிவிப்புகளை இங்கே கண்காணிக்கலாம்."
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
              {unreadCount}{" "}
              {text(
                "Unread",
                "படிக்காதவை"
              )}
            </span>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
              >
                {text(
                  "Mark all read",
                  "அனைத்தையும் படித்ததாக குறிக்க"
                )}
              </button>
            )}
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {message && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-2xl border bg-white p-10 text-center text-slate-500">
            {text(
              "Loading notifications...",
              "அறிவிப்புகள் ஏற்றப்படுகின்றன..."
            )}
          </div>
        )}

        {/* EMPTY */}
        {!loading && notifications.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed bg-white p-12 text-center">
            <p className="text-4xl">🔔</p>

            <h3 className="mt-4 text-lg font-bold text-slate-800">
              {text(
                "No notifications yet",
                "இதுவரை அறிவிப்புகள் இல்லை"
              )}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {text(
                "Complaint progress updates will appear here.",
                "உங்கள் புகாரின் முன்னேற்ற அறிவிப்புகள் இங்கே தோன்றும்."
              )}
            </p>
          </div>
        )}

        {/* NOTIFICATION LIST */}
        {!loading && notifications.length > 0 && (
          <div className="mt-8 space-y-4">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
                className={`w-full rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md ${
                  notification.is_read
                    ? "bg-white"
                    : "border-orange-200 bg-orange-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3
                        className={`font-bold ${
                          notification.is_read
                            ? "text-slate-800"
                            : "text-orange-800"
                        }`}
                      >
                        {translateNotificationTitle(notification)}
                      </h3>

                      {!notification.is_read && (
                        <span className="rounded-full bg-orange-600 px-2 py-1 text-xs font-semibold text-white">
                          {text("New", "புதியது")}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {translateNotificationMessage(notification)}
                    </p>

                    <p className="mt-3 text-xs text-slate-400">
                      {new Date(
                        notification.created_at
                      ).toLocaleString(
                        language === "ta"
                          ? "ta-IN"
                          : "en-IN"
                      )}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}