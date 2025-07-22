/**
 * API Keys Management
 *
 * This module handles the secure storage and retrieval of API keys
 * for various services used in the application.
 */

// API key configuration interface
export interface ApiKeyConfig {
  openaiApiKey?: string
  anythingLlmApiKey?: string
  anythingLlmBaseUrl?: string
  anythingLlmOrgId?: string
}

// Local storage key
const API_KEYS_STORAGE_KEY = "agentic-flow-api-keys"

/**
 * Save API keys to local storage
 */
export function saveApiKeys(config: ApiKeyConfig): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(config))
  }
}

/**
 * Get API keys from local storage
 */
export function getApiKeys(): ApiKeyConfig {
  if (typeof window === "undefined") {
    return {}
  }

  const storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY)
  if (!storedKeys) {
    return {}
  }

  try {
    return JSON.parse(storedKeys) as ApiKeyConfig
  } catch (error) {
    console.error("Failed to parse stored API keys:", error)
    return {}
  }
}

/**
 * Get OpenAI API key
 */
export function getOpenAIApiKey(): string | undefined {
  return getApiKeys().openaiApiKey
}

/**
 * Check if OpenAI API key is configured
 */
export function isOpenAIConfigured(): boolean {
  const apiKey = getOpenAIApiKey()
  return !!apiKey && apiKey.trim() !== ""
}

/**
 * Get AnythingLLM API configuration
 */
export function getAnythingLLMConfig(): {
  apiKey?: string
  baseUrl?: string
  organizationId?: string
} {
  const config = getApiKeys()
  return {
    apiKey: config.anythingLlmApiKey,
    baseUrl: config.anythingLlmBaseUrl,
    organizationId: config.anythingLlmOrgId,
  }
}

/**
 * Check if AnythingLLM API is configured
 */
export function isAnythingLLMConfigured(): boolean {
  const { apiKey, baseUrl } = getAnythingLLMConfig()
  return !!apiKey && apiKey.trim() !== "" && !!baseUrl && baseUrl.trim() !== ""
}
