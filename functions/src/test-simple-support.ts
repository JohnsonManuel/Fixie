// functions/src/test-simple-support.ts
// Test function to verify the simplified LangChain support system

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { SimpleSupportSystem, SupportState } from "./simple-support";

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

// Test the simplified support system
export const testSimpleSupport = onRequest(
  {
    region: "europe-west3",
    secrets: [OPENAI_API_KEY],
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (req: any, res: any) => {
    try {
      // Create the support system
      const supportSystem = new SimpleSupportSystem(OPENAI_API_KEY.value());
      
      // Test with sample state
      const testState: SupportState = {
        userId: "test-user",
        conversationId: "test-conversation",
        issue: "My camera is not working on Zoom",
        attempts: 0,
        solutions: [],
        userFeedback: [],
        currentStage: "analyzing",
        lastMessage: "My camera is not working on Zoom",
        jiraConnected: false
      };

      // Process the message
      const result = await supportSystem.processMessage(testState);

      res.json({
        success: true,
        originalState: testState,
        result: {
          stage: result.currentStage,
          response: result.response,
          attempts: result.attempts,
          solutions: result.solutions
        },
        message: "Simplified LangChain support system is working correctly!"
      });

    } catch (error) {
      console.error("Error testing simple support:", error);
      res.status(500).json({
        success: false,
        error: "Simple support test failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
