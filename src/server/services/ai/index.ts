import { MockAIService } from "./mock";
import { type AIService } from "./types";

export * from "./types";

/**
 * Single entry point for AI features. Today it's a deterministic mock; to go
 * live, swap this for a Claude/OpenAI-backed implementation of `AIService`.
 * Nothing else in the app imports the concrete class.
 */
export const ai: AIService = new MockAIService();
