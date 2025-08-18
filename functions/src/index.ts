// functions/src/index.ts
import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import {defineSecret} from "firebase-functions/params";
import type {
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

initializeApp();
const db = getFirestore();
const REGION = "europe-west3";

// v2 secret (set it via: firebase functions:secrets:set OPENAI_API_KEY)
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

export const chat = onRequest(
  {
    region: REGION,
    cors: true,
    secrets: [OPENAI_API_KEY],
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async (req: any, res: any) => {
    try {
      if (req.method !== "POST") {
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      const body = (req.body || {}) as {
        idToken?: string;
        conversationId?: string;
      };
      const idToken = body.idToken;
      const conversationId = body.conversationId;

      if (!idToken || !conversationId) {
        res.status(400).json({
          error: "Missing idToken or conversationId",
        });
        return;
      }

      const decoded = await getAuth().verifyIdToken(idToken);
      const uid = decoded.uid;

      const base = `users/${uid}/conversations/${conversationId}`;
      const snap = await db
        .collection(`${base}/messages`)
        .orderBy("createdAt", "asc")
        .limitToLast(50)
        .get();

      const rawMsgs = snap.docs.map((d: any) => d.data()) as Array<{
        role: "user" | "assistant" | "system";
        content: string;
      }>;

      // Lazy import OpenAI (ESM) to avoid CJS startup issues
      const {default: OpenAI} = await import("openai");
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY.value(),
      });

      const system: ChatCompletionMessageParam = {
        role: "system",
        content: "You are Fixie, a concise IT support assistant.",
      };

      const chatMsgs: ChatCompletionMessageParam[] =
        rawMsgs.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }));

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 500,
        messages: [system, ...chatMsgs],
      });

      const reply = completion.choices[0]?.message?.content ?? "";

      await db.collection(`${base}/messages`).add({
        role: "assistant",
        content: reply,
        createdAt: FieldValue.serverTimestamp(),
      });

      await db.doc(base).update({
        updatedAt: FieldValue.serverTimestamp(),
        lastMessage: reply,
      });

      res.json({ok: true});
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(e);
      res.status(500).json({error: msg});
    }
  },
);
