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

export function getGamesAI(): OpenAI {
  return getAI();
}

export const MODEL = "qwen/qwen3.5-397b-a17b";
export const GAMES_MODEL = "moonshotai/kimi-k2.6";
