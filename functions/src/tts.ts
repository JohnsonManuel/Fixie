import { onRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";
import { Readable } from "stream";
import cors from "cors";

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const corsHandler = cors({ origin: true, credentials: true });
const REGION = "europe-west3";

// Maximum characters sent to OpenAI TTS in one request
const MAX_CHARS = 4000;

export const tts = onRequest(
  {
    region: REGION,
    secrets: [OPENAI_API_KEY],
    timeoutSeconds: 30,
    memory: "256MiB",
    minInstances: 1,   // keep warm — eliminates cold-start delay
  },
  async (req: any, res: any) => {
    return new Promise((resolve) => {
      corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
          res.status(204).send("");
          resolve();
          return;
        }

        // Verify Firebase auth token
        const authHeader = req.headers.authorization as string | undefined;
        if (!authHeader?.startsWith("Bearer ")) {
          res.status(401).json({ error: "Unauthorized" });
          resolve();
          return;
        }
        try {
          await getAuth().verifyIdToken(authHeader.split("Bearer ")[1]);
        } catch {
          res.status(401).json({ error: "Invalid token" });
          resolve();
          return;
        }

        const { text, voice = "nova" } = req.body as { text?: string; voice?: string };
        if (!text || !text.trim()) {
          res.status(400).json({ error: "Missing text" });
          resolve();
          return;
        }

        // Truncate to avoid OpenAI limit
        const input = text.trim().slice(0, MAX_CHARS);

        try {
          const oaiRes = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "tts-1",
              input,
              voice,            // nova = natural female, alloy = neutral, onyx = deep male
              response_format: "mp3",
            }),
          });

          if (!oaiRes.ok) {
            const err = await oaiRes.text();
            console.error("OpenAI TTS error:", err);
            res.status(500).json({ error: "TTS generation failed" });
            resolve();
            return;
          }

          res.set("Content-Type", "audio/mpeg");
          res.set("Cache-Control", "no-store");
          // Stream directly — don't buffer the full MP3 before responding
          Readable.fromWeb(oaiRes.body as any).pipe(res);
          resolve();
        } catch (err) {
          console.error("TTS function error:", err);
          res.status(500).json({ error: "Internal error" });
          resolve();
        }
      });
    });
  }
);
