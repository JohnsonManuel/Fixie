import { onSchedule } from "firebase-functions/v2/scheduler";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

export const cleanupUnverifiedUsers = onSchedule("every 24 hours", async () => {
  const auth = getAuth();
  const db = getFirestore();
  const cutoff = Date.now() - GRACE_PERIOD_MS;

  let deletedCount = 0;
  let nextPageToken: string | undefined;

  do {
    const listResult = await auth.listUsers(1000, nextPageToken);

    for (const user of listResult.users) {
      if (user.emailVerified) continue;

      const createdAt = new Date(user.metadata.creationTime).getTime();
      if (createdAt > cutoff) continue; // Still within grace period

      try {
        // Delete Firestore user doc if it exists
        const userDoc = db.doc(`users/${user.uid}`);
        const snap = await userDoc.get();
        if (snap.exists) {
          await userDoc.delete();
          logger.info(`Deleted Firestore doc for ${user.email} (${user.uid})`);
        }

        // Delete from Firebase Auth
        await auth.deleteUser(user.uid);
        deletedCount++;
        logger.info(`Deleted unverified user: ${user.email} (${user.uid}), created ${user.metadata.creationTime}`);
      } catch (err) {
        logger.error(`Failed to delete user ${user.uid}:`, err);
      }
    }

    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  logger.info(`Cleanup complete. Deleted ${deletedCount} unverified user(s).`);
});
