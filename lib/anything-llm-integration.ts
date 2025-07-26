/**
 * Enhanced AnythingLLM Integration
 * Captures responses and integrates with thinking agents
 * Uses the exact same logic as the reference LangFlow component
 * Modified to fetch only the latest conversation
 */

import { getAnythingLLMConfig } from "./api-keys"
import { thinkingAgentManager } from "./thinking-agent"

export interface AnythingLLMResponse {
  id: string
  type: "user" | "response"
  content: string
  timestamp: Date
  workspaceId: string
  sessionId?: string
  metadata?: any
}

export interface ChatHistory {
  workspaceId: string
  messages: AnythingLLMResponse[]
  lastUpdated: Date
}

export interface ChatPair {
  chat_id: number
  user_message: string
  assistant_message: string
  message_type: string
  timestamp: string
  sources: any[]
}

export class AnythingLLMIntegration {
  private baseUrl: string
  private apiKey: string
  private chatHistories: Map<string, ChatHistory> = new Map()

  constructor() {
    // Default to the provided configuration
    this.baseUrl = "http://localhost:3001"
    this.apiKey = "88T4DCZ-HY0M4J7-NMCMA9P-2D0F1C8"

    // Override with saved config if available
    const config = getAnythingLLMConfig()
    if (config.baseUrl) this.baseUrl = config.baseUrl
    if (config.apiKey) this.apiKey = config.apiKey

    console.log("🔗 AnythingLLM Integration initialized:", {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
    })
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(baseUrl?: string, apiKey?: string): void {
    if (baseUrl) this.baseUrl = baseUrl
    if (apiKey) this.apiKey = apiKey

    console.log("🔧 AnythingLLM config updated:", {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
    })
  }

  /**
   * Filter chats using the exact same logic as the reference LangFlow component
   * Returns only the latest conversation
   */
  private filterChats(history: any[]): ChatPair[] {
    const chatPairs: { [key: number]: { user: any; assistant: any } } = {}

    // Sort messages by sentAt timestamp (same as reference code)
    for (const msg of history.sort((a, b) => (a.sentAt || 0) - (b.sentAt || 0))) {
      const chatId = msg.chatId
      if (!chatId) continue

      if (!chatPairs[chatId]) {
        chatPairs[chatId] = { user: null, assistant: null }
      }

      if (msg.role === "user") {
        chatPairs[chatId].user = {
          content: msg.content || "",
          timestamp: msg.sentAt,
        }
      } else if (msg.type === "chat" || msg.type === "query") {
        chatPairs[chatId].assistant = {
          content: msg.content || "",
          type: msg.type,
          sources: msg.sources || [],
        }
      }
    }

    // Convert to array format (same as reference code)
    const allPairs = Object.entries(chatPairs)
      .map(([chatId, msgs]) => ({
        chat_id: Number.parseInt(chatId),
        user_message: msgs.user?.content || "",
        assistant_message: msgs.assistant?.content || "",
        message_type: msgs.assistant?.type || "chat",
        timestamp: new Date((msgs.user?.timestamp || 0) * 1000).toISOString(),
        sources: msgs.assistant?.sources || [],
      }))
      .filter((pair) => pair.user_message && pair.assistant_message)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Return only the latest conversation
    return allPairs.length > 0 ? [allPairs[0]] : []
  }

  /**
   * Fetch chat history from AnythingLLM workspace
   * Returns only the latest conversation
   */
  async fetchChatHistory(workspaceId: string): Promise<ChatHistory> {
    console.log(`📥 Fetching latest conversation for workspace: ${workspaceId}`)

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workspace/${workspaceId}/chats`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("📊 Raw chat data received:", {
        workspaceId,
        hasHistory: !!data.history,
        historyLength: data.history ? data.history.length : 0,
        dataType: typeof data,
      })

      // Validate response format
      if (!data.history || !Array.isArray(data.history)) {
        throw new Error("Invalid response format - missing 'history' array")
      }

      // Filter chats to get only the latest conversation
      const filteredChatPairs = this.filterChats(data.history)

      // Convert to AnythingLLMResponse format
      const messages = this.processChatPairs(filteredChatPairs, workspaceId)

      const chatHistory: ChatHistory = {
        workspaceId,
        messages,
        lastUpdated: new Date(),
      }

      // Cache the history
      this.chatHistories.set(workspaceId, chatHistory)

      // Process messages with thinking agents
      await this.processMessagesWithThinkingAgents(messages, workspaceId)

      console.log(`✅ Processed latest conversation with ${messages.length} messages for workspace ${workspaceId}`)
      return chatHistory
    } catch (error) {
      console.error(`❌ Error fetching chat history for ${workspaceId}:`, error)
      throw error
    }
  }

  private processChatPairs(chatPairs: ChatPair[], workspaceId: string): AnythingLLMResponse[] {
    const messages: AnythingLLMResponse[] = []

    // Only process the latest conversation (first item since it's sorted newest first)
    const latestPair = chatPairs[0]
    if (!latestPair) return messages

    console.log("🔍 Processing latest conversation:", {
      chatId: latestPair.chat_id,
      userMessageLength: latestPair.user_message.length,
      assistantMessageLength: latestPair.assistant_message.length,
      sourceCount: latestPair.sources.length,
    })

    // Create user message
    if (latestPair.user_message) {
      messages.push({
        id: `${latestPair.chat_id}_user`,
        type: "user",
        content: latestPair.user_message,
        timestamp: new Date(latestPair.timestamp),
        workspaceId: workspaceId,
        sessionId: latestPair.chat_id.toString(),
        metadata: {
          chatId: latestPair.chat_id,
          messageType: "user_message",
          sources: [],
        },
      })
    }

    // Create assistant message
    if (latestPair.assistant_message) {
      messages.push({
        id: `${latestPair.chat_id}_assistant`,
        type: "response",
        content: latestPair.assistant_message,
        timestamp: new Date(latestPair.timestamp),
        workspaceId: workspaceId,
        sessionId: latestPair.chat_id.toString(),
        metadata: {
          chatId: latestPair.chat_id,
          messageType: latestPair.message_type,
          sources: latestPair.sources,
        },
      })
    }

    return messages
  }

  private async processMessagesWithThinkingAgents(messages: AnythingLLMResponse[], workspaceId: string): Promise<void> {
    console.log(`🧠 Processing latest conversation with thinking agents`)

    const userMessages = messages.filter((m) => m.type === "user")
    const assistantMessages = messages.filter((m) => m.type === "response")

    if (userMessages.length === 0 && assistantMessages.length === 0) {
      console.log("ℹ️ No messages to process")
      return
    }

    // Get active thinking agents
    const activeAgents = thinkingAgentManager.getActiveAgents()

    for (const agent of activeAgents) {
      try {
        // Set workspace context for agent
        agent.workspaceId = workspaceId

        // Generate thoughts about the user prompt
        if (userMessages.length > 0) {
          const userMessage = userMessages[0]

          await thinkingAgentManager.generatePreActionThoughts(agent.id, {
            action: "analyze_latest_user_prompt",
            context: {
              userPrompt: userMessage.content,
              workspaceId,
              metadata: userMessage.metadata,
              chatId: userMessage.metadata?.chatId,
              isLatestConversation: true,
            },
            actionResult: function (actionResult: any, arg1: null, arg2: number): unknown {
              throw new Error("Function not implemented.")
            }
          })
        }

        // Generate thoughts about the assistant response
        if (assistantMessages.length > 0) {
          const assistantMessage = assistantMessages[0]

          await thinkingAgentManager.generatePostActionThoughts(
            agent.id,
            {
              action: "evaluate_latest_assistant_response",
              context: {
                assistantResponse: assistantMessage.content,
                workspaceId,
                metadata: assistantMessage.metadata,
                chatId: assistantMessage.metadata?.chatId,
                sources: assistantMessage.metadata?.sources,
                isLatestConversation: true,
              },
              actionResult: function (actionResult: any, arg1: null, arg2: number): unknown {
                throw new Error("Function not implemented.")
              }
            },
            {
              responseQuality: assistantMessage.metadata?.sources?.length > 0 ? "excellent" : "good",
              userSatisfaction: 0.9,
              sourceCount: assistantMessage.metadata?.sources?.length || 0,
              responseLength: assistantMessage.content.length,
            },
          )
        }
      } catch (error) {
        console.error(`❌ Error processing messages with agent ${agent.id}:`, error)
      }
    }
  }

  /**
   * Get cached chat history
   */
  getCachedChatHistory(workspaceId: string): ChatHistory | undefined {
    return this.chatHistories.get(workspaceId)
  }

  /**
   * Get latest messages from workspace
   */
  async getLatestMessages(workspaceId: string, limit = 10): Promise<AnythingLLMResponse[]> {
    const history = await this.fetchChatHistory(workspaceId)
    return history.messages.slice(-limit)
  }

  /**
   * Monitor workspace for new messages (polling)
   */
  async startMonitoring(workspaceId: string, intervalMs = 30000): Promise<void> {
    console.log(`👁️ Starting monitoring for latest conversations in workspace: ${workspaceId}`)

    const monitor = async () => {
      try {
        await this.fetchChatHistory(workspaceId)
      } catch (error) {
        console.error(`❌ Error monitoring workspace ${workspaceId}:`, error)
      }
    }

    // Initial fetch
    await monitor()

    // Set up polling
    setInterval(monitor, intervalMs)
  }

  /**
   * Test connection to AnythingLLM
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/system/status`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (response.ok) {
        return {
          success: true,
          message: "Successfully connected to AnythingLLM",
        }
      } else {
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      }
    }
  }
}

// Export singleton instance
export const anythingLLMIntegration = new AnythingLLMIntegration()
