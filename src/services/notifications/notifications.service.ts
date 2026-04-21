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
    console.error("Error listing notifications:", error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const docRef = doc(db, "notifications", notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
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
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}
