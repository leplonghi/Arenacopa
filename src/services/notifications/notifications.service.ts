import { db } from "@/integrations/firebase/client";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { mapFirebaseError } from "@/services/errors/AppError";
import { logger } from "@/lib/logger";

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
  try {
    const q = query(
      collection(db, "notifications"),
      where("user_id", "==", userId),
      orderBy("created_at", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as NotificationRecord[];
  } catch (error) {
    logger.error("Error listing notifications", { userId, error });
    throw mapFirebaseError(error, "UNKNOWN");
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const docRef = doc(db, "notifications", notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    logger.error("Error marking notification as read", { notificationId, userId, error });
    throw mapFirebaseError(error, "UNKNOWN");
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("user_id", "==", userId),
      where("read", "==", false)
    );
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });

    await batch.commit();
  } catch (error) {
    logger.error("Error marking all notifications as read", { userId, error });
    throw mapFirebaseError(error, "UNKNOWN");
  }
}
