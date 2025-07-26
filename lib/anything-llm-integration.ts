/**
 * Enhanced AnythingLLM Integration
 * Captures responses and processes conversations independently
 * Removed thinking-agent.ts dependency
 */

import { getAnythingLLMConfig } from "./api-keys"

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

export interface ConversationAnalysis {
  messageCount: number
  userMessages: number
  assistantMessages: number
  averageResponseLength: number
  sourceCount: number
  lastActivity: Date
  quality: "excellent" | "good" | "basic"
}

export class AnythingLLMIntegration {
  private baseUrl: string
  private apiKey: string
  private chatHistories: Map<string, ChatHistory> = new Map()
  private analysisResults: Map<string, ConversationAnalysis> = new Map()

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
   * Analyze conversation quality and generate insights
   */
  private analyzeConversation(messages: AnythingLLMResponse[], workspaceId: string): ConversationAnalysis {
    const userMessages = messages.filter((m) => m.type === "user")
    const assistantMessages = messages.filter((m) => m.type === "response")

    const totalResponseLength = assistantMessages.reduce((sum, msg) => sum + msg.content.length, 0)
    const averageResponseLength = assistantMessages.length > 0 ? totalResponseLength / assistantMessages.length : 0

    const totalSources = assistantMessages.reduce((sum, msg) => {
      return sum + (msg.metadata?.sources?.length || 0)
    }, 0)

    // Determine quality based on response length and source usage
    let quality: "excellent" | "good" | "basic" = "basic"
    if (averageResponseLength > 200 && totalSources > 0) {
      quality = "excellent"
    } else if (averageResponseLength > 100 || totalSources > 0) {
      quality = "good"
    }

    const analysis: ConversationAnalysis = {
      messageCount: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      averageResponseLength,
      sourceCount: totalSources,
      lastActivity: messages.length > 0 ? messages[messages.length - 1].timestamp : new Date(),
      quality,
    }

    // Cache the analysis
    this.analysisResults.set(workspaceId, analysis)

    console.log("📊 Conversation analysis completed:", {
      workspaceId,
      ...analysis,
    })

    return analysis
  }

  /**
   * Process messages and generate insights
   */
  private processMessagesWithAnalysis(messages: AnythingLLMResponse[], workspaceId: string): void {
    console.log(`🧠 Processing ${messages.length} messages with built-in analysis`)

    // Get the latest user message and assistant response
    const recentMessages = messages.slice(-10) // Last 10 messages
    const userMessages = recentMessages.filter((m) => m.type === "user")
    const assistantMessages = recentMessages.filter((m) => m.type === "response")

    if (userMessages.length === 0 && assistantMessages.length === 0) {
      console.log("ℹ️ No recent messages to process")
      return
    }

    // Analyze user messages
    if (userMessages.length > 0) {
      const latestUserMessage = userMessages[userMessages.length - 1]
      console.log("🔍 User message analysis:", {
        messageLength: latestUserMessage.content.length,
        wordCount: latestUserMessage.content.split(" ").length,
        complexity: latestUserMessage.content.split(" ").length > 10 ? "high" : "low",
        hasQuestions: latestUserMessage.content.includes("?"),
        intent: this.detectIntent(latestUserMessage.content),
      })
    }

    // Analyze assistant responses
    if (assistantMessages.length > 0) {
      const latestAssistantMessage = assistantMessages[assistantMessages.length - 1]
      console.log("📊 Assistant response evaluation:", {
        responseLength: latestAssistantMessage.content.length,
        sourceCount: latestAssistantMessage.metadata?.sources?.length || 0,
        quality: latestAssistantMessage.metadata?.sources?.length > 0 ? "good" : "basic",
        completeness: latestAssistantMessage.content.length > 100 ? "comprehensive" : "brief",
        hasStructure: this.hasStructuredContent(latestAssistantMessage.content),
      })
    }

    // Generate overall conversation analysis
    this.analyzeConversation(messages, workspaceId)
  }

  /**
   * Simple intent detection based on keywords
   */
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("how") || lowerMessage.includes("what") || lowerMessage.includes("why")) {
      return "information_seeking"
    } else if (lowerMessage.includes("help") || lowerMessage.includes("problem") || lowerMessage.includes("issue")) {
      return "support_request"
    } else if (lowerMessage.includes("create") || lowerMessage.includes("make") || lowerMessage.includes("build")) {
      return "creation_request"
    } else if (
      lowerMessage.includes("explain") ||
      lowerMessage.includes("describe") ||
      lowerMessage.includes("tell me")
    ) {
      return "explanation_request"
    }

    return "general_inquiry"
  }

  /**
   * Check if content has structured elements
   */
  private hasStructuredContent(content: string): boolean {
    return (
      content.includes("\n") ||
      content.includes("•") ||
      content.includes("-") ||
      content.includes("1.") ||
      content.includes("*")
    )
  }

  /**
   * Fetch chat history from AnythingLLM workspace
   */
  async fetchChatHistory(workspaceId: string): Promise<ChatHistory> {
    console.log(`📥 Fetching chat history for workspace: ${workspaceId}`)

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
        messageCount: Array.isArray(data) ? data.length : "unknown",
        dataType: typeof data,
      })

      // Process the chat data
      const messages = this.processChatData(data, workspaceId)

      const chatHistory: ChatHistory = {
        workspaceId,
        messages,
        lastUpdated: new Date(),
      }

      // Cache the history
      this.chatHistories.set(workspaceId, chatHistory)

      // Process messages with built-in analysis
      this.processMessagesWithAnalysis(messages, workspaceId)

      console.log(`✅ Processed ${messages.length} messages for workspace ${workspaceId}`)
      return chatHistory
    } catch (error) {
      console.error(`❌ Error fetching chat history for ${workspaceId}:`, error)
      throw error
    }
  }

  private processChatData(data: any, workspaceId: string): AnythingLLMResponse[] {
    const messages: AnythingLLMResponse[] = []

    try {
      // Handle different possible data structures from AnythingLLM
      let chatData = data
      if (Array.isArray(data)) {
        chatData = data
      } else if (data.chats && Array.isArray(data.chats)) {
        chatData = data.chats
      } else if (data.messages && Array.isArray(data.messages)) {
        chatData = data.messages
      } else if (data.history && Array.isArray(data.history)) {
        chatData = data.history
      }

      if (!Array.isArray(chatData)) {
        console.warn("⚠️ Unexpected chat data structure:", typeof chatData)
        return messages
      }

      chatData.forEach((item: any, index: number) => {
        try {
          // Handle different message formats
          const messageId = item.id || item._id || `msg_${Date.now()}_${index}`
          const content = item.content || item.message || item.text || ""
          const type = item.type || (item.role === "user" ? "user" : "response")
          const timestamp = item.timestamp
            ? new Date(item.timestamp)
            : item.createdAt
              ? new Date(item.createdAt)
              : item.created_at
                ? new Date(item.created_at)
                : new Date()

          if (content) {
            messages.push({
              id: messageId,
              type: type as "user" | "response",
              content,
              timestamp,
              workspaceId,
              sessionId: item.sessionId || item.session_id,
              metadata: {
                originalItem: item,
                processed: true,
                sources: item.sources || [],
              },
            })
          }
        } catch (itemError) {
          console.warn("⚠️ Error processing chat item:", itemError, item)
        }
      })

      // Sort messages by timestamp
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    } catch (error) {
      console.error("❌ Error processing chat data:", error)
    }

    return messages
  }

  /**
   * Get conversation analysis results
   */
  getConversationAnalysis(workspaceId: string): ConversationAnalysis | undefined {
    return this.analysisResults.get(workspaceId)
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
    console.log(`👁️ Starting monitoring for workspace: ${workspaceId}`)

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
