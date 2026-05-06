import OpenAI from "openai";

let _client: OpenAI | null = null;
let _gamesClient: OpenAI | null = null;

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
  if (!_gamesClient) {
    _gamesClient = new OpenAI({
      apiKey: (process.env.KIMI_API_KEY || process.env.NVIDIA_API_KEY)?.trim(),
      baseURL: process.env.KIMI_BASE_URL || "https://integrate.api.nvidia.com/v1",
    });
  }
  return _gamesClient;
}

export const MODEL = "qwen/qwen3.5-397b-a17b";
export const GAMES_MODEL = process.env.GAMES_MODEL || "moonshotai/kimi-k2-instruct";
