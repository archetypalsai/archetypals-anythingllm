/**
 * AnythingLLM Client for API Integration
 *
 * This client handles all interactions with the AnythingLLM API including:
 * - Connection testing
 * - Document uploads
 * - Conversation retrieval with enhanced message extraction
 * - Latest user message detection using timestamp-based sorting
 */

import { getAnythingLLMConfig } from "./api-keys"

export interface AnythingLLMConfig {
  baseUrl: string
  apiKey: string
}

export interface ConversationResult {
  success: boolean
  message: string
  latestMessage?: string
  conversation?: any[]
  debugInfo?: {
    totalChats: number
    totalUserMessages: number
    latestMessageTimestamp?: string
    latestMessageChatId?: string
    recentMessages?: Array<{
      content: string
      timestamp: string
      chatId: string
    }>
    extractionMethod: string
    apiEndpoint: string
    responseStructure: string
  }
}

export interface UploadResult {
  success: boolean
  message: string
  documentId?: string
  debugInfo?: any
}

export interface ConnectionResult {
  success: boolean
  message: string
  debugInfo?: any
}

/**
 * AnythingLLM Client Class
 */
export class AnythingLLMClient {
  private config: AnythingLLMConfig

  constructor(config: AnythingLLMConfig) {
    this.config = config
  }

  /**
   * Parse timestamp from various formats
   */
  private parseTimestamp(timestamp: any): number {
    if (!timestamp) return 0

    // If it's already a number
    if (typeof timestamp === "number") {
      // If it looks like seconds (less than year 2100 in milliseconds)
      return timestamp < 4102444800000 ? timestamp * 1000 : timestamp
    }

    // If it's a string
    if (typeof timestamp === "string") {
      // Try parsing as number first
      const numTimestamp = Number.parseInt(timestamp, 10)
      if (!isNaN(numTimestamp)) {
        return numTimestamp < 4102444800000 ? numTimestamp * 1000 : numTimestamp
      }

      // Try parsing as ISO date
      const dateTimestamp = new Date(timestamp).getTime()
      if (!isNaN(dateTimestamp)) {
        return dateTimestamp
      }
    }

    // If it's a Date object
    if (timestamp instanceof Date) {
      return timestamp.getTime()
    }

    return 0
  }

  /**
   * Extract user message from a chat object
   */
  private extractUserMessageFromChat(chat: any): {
    content: string
    timestamp: number
    chatId: string
  } | null {
    if (!chat) {
      console.log("❌ Chat object is null or undefined")
      return null
    }

    console.log("🔍 Extracting user message from chat:", {
      chatId: chat.id || chat._id || "unknown",
      hasMessages: !!chat.messages,
      messagesLength: chat.messages?.length || 0,
    })

    // First, try to get timestamp for this chat
    const chatTimestamp = this.parseTimestamp(
      chat.createdAt || chat.timestamp || chat.sentAt || chat.sent_at || chat.updatedAt,
    )

    // Try direct fields first
    const directFields = ["prompt", "user_message", "userMessage", "query", "content", "message"]
    for (const field of directFields) {
      const fieldValue = chat[field]
      if (fieldValue && typeof fieldValue === "string" && fieldValue.trim().length > 0) {
        console.log(`✅ Found user message in direct field: ${field}`)
        return {
          content: fieldValue.trim(),
          timestamp: chatTimestamp || Date.now(),
          chatId: chat.id || chat._id || "unknown",
        }
      }
    }

    // Then search through message arrays
    const messageArrays = ["messages", "conversation", "chats", "history"]
    for (const arrayField of messageArrays) {
      const messageArray = chat[arrayField]
      if (Array.isArray(messageArray) && messageArray.length > 0) {
        console.log(`🔍 Searching in ${arrayField} array with ${messageArray.length} items`)

        // Find user messages and extract with timestamps
        const userMessages = messageArray
          .map((msg: any, index: number) => {
            if (!msg) return null // Skip null/undefined messages

            // Check if this is a user message
            const isUserMessage =
              msg.role === "user" ||
              msg.type === "user" ||
              msg.sender === "user" ||
              msg.from === "user" ||
              msg.author === "user" ||
              msg.role === "human" ||
              msg.type === "human"

            if (!isUserMessage) return null

            // Extract content
            const content = msg.content || msg.message || msg.text || msg.prompt || msg.query || msg.userMessage

            if (!content || typeof content !== "string" || content.trim().length === 0) return null

            // Extract timestamp
            const msgTimestamp = this.parseTimestamp(
              msg.createdAt || msg.timestamp || msg.sentAt || msg.sent_at || msg.updatedAt || msg.time || chatTimestamp,
            )

            return {
              content: content.trim(),
              timestamp: msgTimestamp || chatTimestamp || Date.now() - (1000 - index), // Fallback with ordering
              chatId: chat.id || chat._id || "unknown",
              messageIndex: index,
            }
          })
          .filter((msg): msg is NonNullable<typeof msg> => msg !== null) // Type-safe filter

        if (userMessages.length > 0) {
          // Sort by timestamp and return the latest
          userMessages.sort((a, b) => b.timestamp - a.timestamp)
          const latestMessage = userMessages[0]
          console.log(`✅ Found ${userMessages.length} user messages, selected latest:`, {
            content: latestMessage.content.substring(0, 100),
            timestamp: latestMessage.timestamp,
            timestampDate: new Date(latestMessage.timestamp).toISOString(),
          })
          return latestMessage
        }
      }
    }

    console.log("❌ No user message found in this chat")
    return null
  }

  /**
   * Get the latest conversation from AnythingLLM workspace
   */
  async getLatestConversation(workspaceSlug: string): Promise<ConversationResult> {
    if (!workspaceSlug || workspaceSlug.trim().length === 0) {
      return {
        success: false,
        message: "Workspace slug is required",
        debugInfo: {
          totalChats: 0,
          totalUserMessages: 0,
          extractionMethod: "failed",
          apiEndpoint: "none",
          responseStructure: "none",
        },
      }
    }

    console.log(`🌐 Fetching conversations from workspace: ${workspaceSlug}`)

    const endpoints = [
      `/api/v1/workspace/${workspaceSlug}/chats`,
      `/api/workspace/${workspaceSlug}/chats`,
      `/workspace/${workspaceSlug}/chats`,
      `/api/v1/workspaces/${workspaceSlug}/chats`,
      `/api/workspaces/${workspaceSlug}/chats`,
    ]

    for (const endpoint of endpoints) {
      try {
        const url = `${this.config.baseUrl.replace(/\/$/, "")}${endpoint}`
        console.log(`🔗 Trying endpoint: ${url}`)

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
        })

        console.log(`📡 Response status: ${response.status}`)

        if (!response.ok) {
          console.log(`❌ Endpoint ${endpoint} failed with status ${response.status}`)
          continue
        }

        const data = await response.json()
        if (!data) {
          console.log(`❌ No data received from ${endpoint}`)
          continue
        }

        console.log("📊 Raw API response structure:", {
          hasHistory: !!data.history,
          hasChats: !!data.chats,
          hasConversations: !!data.conversations,
          hasData: !!data.data,
          isArray: Array.isArray(data),
          keys: Object.keys(data),
        })

        // Extract chats from various possible response structures
        let chats: any[] = []
        if (Array.isArray(data)) {
          chats = data.filter((chat) => chat != null) // Filter out null chats
        } else if (data.history && Array.isArray(data.history)) {
          chats = data.history.filter((chat: null) => chat != null)
        } else if (data.chats && Array.isArray(data.chats)) {
          chats = data.chats.filter((chat: null) => chat != null)
        } else if (data.conversations && Array.isArray(data.conversations)) {
          chats = data.conversations.filter((chat: null) => chat != null)
        } else if (data.data && Array.isArray(data.data)) {
          chats = data.data.filter((chat: null) => chat != null)
        }

        console.log(`📋 Found ${chats.length} valid chats to process`)

        if (chats.length === 0) {
          console.log("⚠️ No valid chats found in response")
          continue
        }

        // Extract all user messages with timestamps from all chats
        const allUserMessages: Array<{
          content: string
          timestamp: number
          chatId: string
        }> = []

        for (const chat of chats) {
          if (!chat) continue // Skip null chats

          const userMessage = this.extractUserMessageFromChat(chat)
          if (userMessage) {
            allUserMessages.push(userMessage)
          }
        }

        console.log(`📝 Extracted ${allUserMessages.length} total user messages`)

        if (allUserMessages.length === 0) {
          console.log("❌ No user messages found in any chat")
          continue
        }

        // Sort all user messages by timestamp (most recent first)
        allUserMessages.sort((a, b) => {
          if (a.timestamp === b.timestamp) return 0
          return b.timestamp - a.timestamp
        })

        const latestMessage = allUserMessages[0]
        if (!latestMessage) {
          console.log("❌ No latest message found after sorting")
          continue
        }

        console.log("🎯 Latest user message selected:", {
          content: latestMessage.content.substring(0, 100) + "...",
          timestamp: latestMessage.timestamp,
          timestampDate: new Date(latestMessage.timestamp).toISOString(),
          chatId: latestMessage.chatId,
          totalMessages: allUserMessages.length,
        })

        // Show top 3 most recent messages for debugging
        const recentMessages = allUserMessages.slice(0, 3).map((msg) => ({
          content: msg.content.substring(0, 100) + "...",
          timestamp: new Date(msg.timestamp).toISOString(),
          chatId: msg.chatId,
        }))

        return {
          success: true,
          message: "Successfully retrieved latest user message",
          latestMessage: latestMessage.content,
          conversation: chats,
          debugInfo: {
            totalChats: chats.length,
            totalUserMessages: allUserMessages.length,
            latestMessageTimestamp: new Date(latestMessage.timestamp).toISOString(),
            latestMessageChatId: latestMessage.chatId,
            recentMessages,
            extractionMethod: "timestamp_based_global_sort",
            apiEndpoint: endpoint,
            responseStructure: Array.isArray(data) ? "direct_array" : Object.keys(data).join(","),
          },
        }
      } catch (error) {
        console.error(`❌ Error with endpoint ${endpoint}:`, error)
        continue
      }
    }

    return {
      success: false,
      message: "Failed to fetch conversations from all attempted endpoints",
      debugInfo: {
        totalChats: 0,
        totalUserMessages: 0,
        extractionMethod: "failed",
        apiEndpoint: "all_failed",
        responseStructure: "none",
      },
    }
  }

  /**
   * Test connection to AnythingLLM
   */
  async testConnection(): Promise<ConnectionResult> {
    console.log("🧪 Testing AnythingLLM connection...")

    const testEndpoints = [
      "/api/v1/system/ping",
      "/api/system/ping",
      "/system/ping",
      "/api/v1/workspaces",
      "/api/workspaces",
      "/workspaces",
    ]

    for (const endpoint of testEndpoints) {
      try {
        const url = `${this.config.baseUrl.replace(/\/$/, "")}${endpoint}`
        console.log(`🔗 Testing endpoint: ${url}`)

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
        })

        console.log(`📡 Response status: ${response.status}`)

        if (response.ok) {
          const data = await response.json()
          return {
            success: true,
            message: `Connection successful via ${endpoint}`,
            debugInfo: {
              endpoint,
              status: response.status,
              response: data,
            },
          }
        }
      } catch (error) {
        console.error(`❌ Error testing ${endpoint}:`, error)
        continue
      }
    }

    return {
      success: false,
      message: "Connection failed on all test endpoints",
      debugInfo: {
        testedEndpoints: testEndpoints,
        baseUrl: this.config.baseUrl,
      },
    }
  }

  /**
   * Upload document to AnythingLLM
   */
  async uploadDocument(
    content: string,
    fileName: string,
    mimeType = "text/markdown",
    workspaceSlug?: string,
  ): Promise<UploadResult> {
    console.log(`📤 Uploading document: ${fileName}`)

    const uploadEndpoints = [
      workspaceSlug ? `/api/v1/workspace/${workspaceSlug}/upload` : "/api/v1/document/upload",
      workspaceSlug ? `/api/workspace/${workspaceSlug}/upload` : "/api/document/upload",
      workspaceSlug ? `/workspace/${workspaceSlug}/upload` : "/document/upload",
    ]

    for (const endpoint of uploadEndpoints) {
      try {
        const url = `${this.config.baseUrl.replace(/\/$/, "")}${endpoint}`
        console.log(`🔗 Trying upload endpoint: ${url}`)

        // Create form data
        const formData = new FormData()
        const blob = new Blob([content], { type: mimeType })
        formData.append("file", blob, fileName)

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: formData,
        })

        console.log(`📡 Upload response status: ${response.status}`)

        if (response.ok) {
          const data = await response.json()
          return {
            success: true,
            message: "Document uploaded successfully",
            documentId: data.documentId || data.id,
            debugInfo: {
              endpoint,
              fileName,
              fileSize: content.length,
              response: data,
            },
          }
        } else {
          const errorText = await response.text()
          console.log(`❌ Upload failed: ${errorText}`)
        }
      } catch (error) {
        console.error(`❌ Upload error on ${endpoint}:`, error)
        continue
      }
    }

    return {
      success: false,
      message: "Failed to upload document to all attempted endpoints",
      debugInfo: {
        fileName,
        fileSize: content.length,
        testedEndpoints: uploadEndpoints,
      },
    }
  }
}

// Global client instance
let globalClient: AnythingLLMClient | null = null

/**
 * Initialize AnythingLLM client
 */
export function initializeAnythingLLMClient(): AnythingLLMClient | null {
  try {
    const config = getAnythingLLMConfig()
    if (!config.baseUrl || !config.apiKey) {
      console.log("❌ AnythingLLM configuration is incomplete")
      return null
    }

    globalClient = new AnythingLLMClient(config)
    console.log("✅ AnythingLLM client initialized successfully")
    return globalClient
  } catch (error) {
    console.error("❌ Failed to initialize AnythingLLM client:", error)
    return null
  }
}

/**
 * Get the global AnythingLLM client instance
 */
export function getAnythingLLMClient(): AnythingLLMClient | null {
  if (!globalClient) {
    return initializeAnythingLLMClient()
  }
  return globalClient
}

/**
 * Reset the global client (useful for configuration changes)
 */
export function resetAnythingLLMClient(): void {
  globalClient = null
  console.log("🔄 AnythingLLM client reset")
}
