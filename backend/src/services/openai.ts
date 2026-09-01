import OpenAI from "openai";
import { env } from "../config/env";
import { badGateway, serviceUnavailable } from "../middleware/httpError";

export const AI_INPUT_CHAR_LIMIT = 12000;

export const truncate = (text: string, limit = AI_INPUT_CHAR_LIMIT): string => (text || "").slice(0, limit);

export const isAiConfigured = (): boolean => Boolean(env.openaiApiKey);

export const getAiClient = (unavailableMessage = "AI is not configured. Set OPENAI_API_KEY."): OpenAI => {
  if (!env.openaiApiKey) {
    throw serviceUnavailable(unavailableMessage);
  }
  return new OpenAI({ apiKey: env.openaiApiKey, baseURL: env.openaiApiBase });
};

/** Pulls raw JSON out of an AI response, tolerating markdown code fences. */
export const extractJson = (content: string): unknown => {
  let text = (content || "").trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(text);
  if (fenced) {
    text = fenced[1].trim();
  }
  return JSON.parse(text);
};

export interface CompleteJsonOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  unavailableMessage?: string;
}

export interface CompleteJsonResult {
  data: unknown;
  raw: string;
}

export const completeJson = async ({
  systemPrompt,
  userPrompt,
  model = env.aiModel,
  temperature = 0.25,
  unavailableMessage,
}: CompleteJsonOptions): Promise<CompleteJsonResult> => {
  const client = getAiClient(unavailableMessage);
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  try {
    return { data: extractJson(raw), raw };
  } catch (error) {
    throw badGateway(`AI returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
};
