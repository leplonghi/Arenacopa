import { supabase } from "@/services/supabase/client";

export type NotificationRecord = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "invite";
  read: boolean;
  link: string | null;
  created_at: string;
};

export async function listNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, title, message, type, read, link, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as NotificationRecord[];
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw error;
}
