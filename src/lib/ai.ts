import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getAI(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY?.trim(),
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }
  return _client;
}

export const MODEL = "meta/llama-3.3-70b-instruct";
