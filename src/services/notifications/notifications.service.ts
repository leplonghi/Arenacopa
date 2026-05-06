import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  writeBatch 
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
      where("user_id", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }) as NotificationRecord)
      .sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
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
      where("user_id", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
      if (doc.data().read === false) {
        batch.update(doc.ref, { read: true });
      }
    });

    await batch.commit();
  } catch (error) {
    logger.error("Error marking all notifications as read", { userId, error });
    throw mapFirebaseError(error, "UNKNOWN");
  }
}
