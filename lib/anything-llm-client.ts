/**
 * AnythingLLM API Client
 *
 * This client handles all interactions with the AnythingLLM API for document upload,
 * agent deployment, and workflow orchestration.
 */
import { getAnythingLLMConfig } from "./api-keys"

export interface AnythingLLMConfig {
  apiKey: string
  baseUrl: string
  organizationId?: string
}

export interface Agent {
  id: string
  name: string
  type: string
  description: string
  responsibilities: string[]
  okrMapping: string[]
  status: string
}

export interface WorkflowStep {
  id: string
  agent: string
  action: string
  description: string
  triggers: string[]
  outputs: string[]
  approvals?: string[]
}

export interface DeploymentResult {
  success: boolean
  deploymentId?: string
  message: string
  agents: {
    id: string
    name: string
    status: string
  }[]
  errors?: any[]
}

export interface WorkflowValidationResult {
  success: boolean
  validationResult?: any
  agentResponses?: Array<{
    name: string
    response: string
    confidence: number
    alignment: number
    recommendations: string[]
  }>
  alignmentScore?: number
  recommendations?: string[]
  error?: string
}

export interface DocumentUploadResult {
  success: boolean
  message: string
  documentId?: string
  fileName?: string
  fileSize?: number
  debugInfo?: any
}

export interface SystemStatus {
  success: boolean
  message: string
  version?: string
  status?: string
  debugInfo?: any
}

export class AnythingLLMClient {
  private apiKey: string
  private baseUrl: string
  private organizationId?: string

  constructor(config: AnythingLLMConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl.slice(0, -1) : config.baseUrl
    this.organizationId = config.organizationId

    console.log("🔧 AnythingLLM Client initialized:", {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      hasOrgId: !!this.organizationId,
    })
  }

  private async makeRequest<T>(endpoint: string, method = "GET", data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    console.log(`📡 Making ${method} request to:`, url)

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      accept: "application/json",
    }

    if (this.organizationId) {
      headers["X-Organization-ID"] = this.organizationId
    }

    const options: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    }

    console.log("📋 Request options:", {
      method,
      headers: { ...headers, Authorization: `Bearer ${this.apiKey.substring(0, 10)}...` },
      hasBody: !!data,
    })

    try {
      const response = await fetch(url, options)
      const responseText = await response.text()

      console.log("📨 Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        bodyLength: responseText.length,
        bodyPreview: responseText.substring(0, 500),
      })

      if (!response.ok) {
        let errorData = {}
        try {
          errorData = JSON.parse(responseText)
        } catch (e) {
          errorData = { message: responseText }
        }

        console.error("❌ API Error:", errorData)
        throw new Error(
          `AnythingLLM API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`,
        )
      }

      // Try to parse as JSON, fallback to text
      try {
        const jsonResponse = JSON.parse(responseText)
        console.log("✅ Parsed JSON response:", jsonResponse)
        return jsonResponse
      } catch (e) {
        console.log("📝 Non-JSON response, returning as text")
        return responseText as T
      }
    } catch (error) {
      console.error("💥 Request failed:", error)
      throw error
    }
  }

  /**
   * Test the API connection with multiple endpoints
   */
  async testConnection(): Promise<SystemStatus> {
    console.log("🔍 Testing AnythingLLM connection...")

    const testEndpoints = [
      "/api/v1/system/status",
      "/api/v1/system/info",
      "/api/v1/workspaces",
      "/api/system/status",
      "/api/status",
      "/health",
      "/",
    ]

    const testedEndpoints: string[] = []

    for (const endpoint of testEndpoints) {
      testedEndpoints.push(endpoint)

      try {
        console.log(`🌐 Testing endpoint: ${endpoint}`)

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        })

        const responseText = await response.text()
        console.log(`📡 Endpoint ${endpoint} response:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          body: responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""),
        })

        if (response.ok) {
          let parsedResponse = {}
          try {
            parsedResponse = JSON.parse(responseText)
          } catch (e) {
            parsedResponse = { message: responseText }
          }

          return {
            success: true,
            message: `Successfully connected to AnythingLLM via ${endpoint}`,
            status: response.statusText,
            debugInfo: {
              endpoint,
              status: response.status,
              response: parsedResponse,
              testedEndpoints,
            },
          }
        }
      } catch (error) {
        console.log(`⚠️ Endpoint ${endpoint} failed:`, error)
        continue
      }
    }

    return {
      success: false,
      message: "Could not connect to AnythingLLM API. Please check your configuration.",
      debugInfo: {
        testedEndpoints,
        baseUrl: this.baseUrl,
        hasApiKey: !!this.apiKey,
      },
    }
  }

  /**
   * Upload a document to AnythingLLM
   */
  async uploadDocument(
    content: string,
    fileName: string,
    fileType = "text/markdown",
    workspaceId?: string,
  ): Promise<DocumentUploadResult> {
    console.log("📄 Starting document upload...")
    console.log("📋 Upload parameters:", {
      fileName,
      fileType,
      contentLength: content.length,
      workspaceId: workspaceId || "none",
    })

    try {
      // Create file blob
      const blob = new Blob([content], { type: fileType })
      const file = new File([blob], fileName, {
        type: fileType,
        lastModified: Date.now(),
      })

      console.log("📁 File created:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      })

      // Prepare form data
      const formData = new FormData()
      formData.append("file", file)

      if (workspaceId) {
        formData.append("addToWorkspaces", workspaceId)
        console.log("🏢 Adding to workspace:", workspaceId)
      }

      // Try multiple upload endpoints
      const uploadEndpoints = [
        "/api/v1/document/upload",
        "/api/v1/documents/upload",
        "/api/document/upload",
        "/api/documents/upload",
        "/api/upload",
      ]

      for (const endpoint of uploadEndpoints) {
        try {
          const uploadUrl = `${this.baseUrl}${endpoint}`
          console.log(`🌐 Trying upload endpoint: ${uploadUrl}`)

          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: formData,
          })

          const responseText = await response.text()
          console.log(`📡 Upload response from ${endpoint}:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            bodyLength: responseText.length,
          })

          if (response.ok) {
            let result = {}
            try {
              result = JSON.parse(responseText)
              console.log("✅ Upload successful, parsed response:", result)
            } catch (e) {
              console.log("📝 Upload successful, non-JSON response")
              result = { message: responseText }
            }

            return {
              success: true,
              message: "Document successfully uploaded to AnythingLLM",
              documentId: (result as any).documentId || (result as any).id || "unknown",
              fileName: file.name,
              fileSize: file.size,
              debugInfo: {
                endpoint,
                uploadUrl,
                fileSize: file.size,
                fileName: file.name,
                responseStatus: response.status,
                response: result,
              },
            }
          } else {
            console.log(`❌ Upload failed at ${endpoint}:`, responseText)
            continue
          }
        } catch (error) {
          console.log(`💥 Upload error at ${endpoint}:`, error)
          continue
        }
      }

      // If all endpoints failed
      return {
        success: false,
        message: "Failed to upload document to any available endpoint",
        debugInfo: {
          testedEndpoints: uploadEndpoints,
          fileName: fileName,
          fileSize: content.length,
        },
      }
    } catch (error) {
      console.error("💥 Document upload failed:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to upload document",
        debugInfo: {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get list of workspaces
   */
  async getWorkspaces(): Promise<{ success: boolean; workspaces: any[]; message: string }> {
    console.log("🏢 Fetching workspaces...")

    const workspaceEndpoints = ["/api/v1/workspaces", "/api/workspaces", "/api/v1/workspace", "/api/workspace"]

    for (const endpoint of workspaceEndpoints) {
      try {
        console.log(`🌐 Trying workspace endpoint: ${endpoint}`)
        const workspaces = await this.makeRequest<any[]>(endpoint)

        return {
          success: true,
          workspaces: Array.isArray(workspaces) ? workspaces : [],
          message: "Successfully retrieved workspaces",
        }
      } catch (error) {
        console.log(`⚠️ Workspace endpoint ${endpoint} failed:`, error)
        continue
      }
    }

    return {
      success: false,
      workspaces: [],
      message: "Could not retrieve workspaces from any endpoint",
    }
  }

  /**
   * Get chats from a specific workspace
   */
  async getWorkspaceChats(workspaceSlug: string): Promise<any> {
    console.log(`💬 Getting chats for workspace: ${workspaceSlug}`)

    try {
      const chats = await this.makeRequest<any>(`/api/v1/workspace/${workspaceSlug}/chats`)
      console.log("📊 Raw chats response:", chats)
      return chats
    } catch (error) {
      console.error(`❌ Failed to get chats for workspace ${workspaceSlug}:`, error)
      throw error
    }
  }

  /**
   * Get the latest conversation from a workspace
   */
  async getLatestConversation(workspaceSlug: string): Promise<{
    success: boolean
    latestMessage?: string
    conversation?: any[]
    message: string
    debugInfo?: any
  }> {
    console.log(`🔍 Fetching latest conversation from workspace: ${workspaceSlug}`)

    try {
      const chatsResponse = await this.getWorkspaceChats(workspaceSlug)

      console.log("📊 Chats response structure:", {
        type: typeof chatsResponse,
        isArray: Array.isArray(chatsResponse),
        keys: chatsResponse ? Object.keys(chatsResponse) : [],
        length: Array.isArray(chatsResponse) ? chatsResponse.length : "N/A",
      })

      // Handle different possible response structures
      let chats = []

      if (Array.isArray(chatsResponse)) {
        chats = chatsResponse
      } else if (chatsResponse && chatsResponse.chats && Array.isArray(chatsResponse.chats)) {
        chats = chatsResponse.chats
      } else if (chatsResponse && chatsResponse.data && Array.isArray(chatsResponse.data)) {
        chats = chatsResponse.data
      } else if (chatsResponse && typeof chatsResponse === "object") {
        // If it's an object, try to find an array property
        const possibleArrayKeys = ["chats", "data", "messages", "conversations", "history"]
        for (const key of possibleArrayKeys) {
          if (chatsResponse[key] && Array.isArray(chatsResponse[key])) {
            chats = chatsResponse[key]
            break
          }
        }
      }

      console.log(`📋 Processed chats array:`, {
        length: chats.length,
        firstItem: chats.length > 0 ? chats[0] : null,
        lastItem: chats.length > 0 ? chats[chats.length - 1] : null,
      })

      if (!chats || chats.length === 0) {
        return {
          success: false,
          message: "No conversations found in workspace",
          debugInfo: {
            workspace: workspaceSlug,
            rawResponse: chatsResponse,
            processedChats: chats,
          },
        }
      }

      // Get the most recent chat (last item in array)
      const latestChat = chats[chats.length - 1]
      console.log("📝 Latest chat object:", latestChat)

      // Extract the user message from various possible structures
      let latestUserMessage = ""

      // Try different possible field names for the user message
      const possibleMessageFields = [
        "prompt",
        "message",
        "content",
        "text",
        "query",
        "input",
        "user_message",
        "userMessage",
        "question",
        "request",
      ]

      for (const field of possibleMessageFields) {
        if (latestChat[field] && typeof latestChat[field] === "string") {
          latestUserMessage = latestChat[field]
          console.log(`✅ Found user message in field '${field}':`, latestUserMessage.substring(0, 100))
          break
        }
      }

      // If no direct field found, try to look in nested objects
      if (!latestUserMessage) {
        if (latestChat.messages && Array.isArray(latestChat.messages)) {
          // Look for user messages in messages array
          const userMessages = latestChat.messages.filter(
            (msg: any) => msg.role === "user" || msg.type === "user" || msg.sender === "user",
          )
          if (userMessages.length > 0) {
            const lastUserMsg = userMessages[userMessages.length - 1]
            latestUserMessage = lastUserMsg.content || lastUserMsg.message || lastUserMsg.text || ""
          }
        }
      }

      // If still no message found, try to extract from any string field
      if (!latestUserMessage) {
        for (const [key, value] of Object.entries(latestChat)) {
          if (typeof value === "string" && value.length > 10) {
            latestUserMessage = value
            console.log(`🔍 Using field '${key}' as fallback message:`, latestUserMessage.substring(0, 100))
            break
          }
        }
      }

      if (!latestUserMessage) {
        return {
          success: false,
          message: "Could not extract user message from latest conversation",
          debugInfo: {
            workspace: workspaceSlug,
            latestChat: latestChat,
            availableFields: Object.keys(latestChat),
          },
        }
      }

      return {
        success: true,
        latestMessage: latestUserMessage,
        conversation: chats,
        message: "Successfully retrieved latest conversation",
        debugInfo: {
          workspace: workspaceSlug,
          chatCount: chats.length,
          extractedFrom: "API",
          messageLength: latestUserMessage.length,
        },
      }
    } catch (error) {
      console.error("❌ Failed to get latest conversation:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch conversation",
        debugInfo: {
          workspace: workspaceSlug,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Validate workflow with AnythingLLM
   */
  async validateWorkflow(workflowPayload: any): Promise<WorkflowValidationResult> {
    console.log("🔍 Validating workflow...")

    try {
      const response = await this.makeRequest<any>("/api/v1/workflows/validate", "POST", workflowPayload)

      return {
        success: true,
        validationResult: response,
        agentResponses: response.agentResponses || [],
        alignmentScore: response.alignmentScore || 0,
        recommendations: response.recommendations || [],
      }
    } catch (error) {
      console.error("❌ Workflow validation failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to validate workflow",
        agentResponses: [],
        alignmentScore: 0,
        recommendations: [],
      }
    }
  }

  /**
   * Deploy agents and workflow to AnythingLLM
   */
  async deployWorkflow(
    agents: Agent[],
    workflowSteps: WorkflowStep[],
    workflowDescription: string,
    workflowName: string,
  ): Promise<DeploymentResult> {
    console.log("🚀 Deploying workflow...")
    console.log("📋 Deployment parameters:", {
      workflowName,
      agentCount: agents.length,
      stepCount: workflowSteps.length,
      hasDescription: !!workflowDescription,
    })

    try {
      // First, create or update the agents
      const deployedAgents = await this.deployAgents(agents)

      // Then, create the workflow with the deployed agents
      const workflow = await this.makeRequest<any>("/api/v1/workflows", "POST", {
        name: workflowName,
        description: workflowDescription,
        agents: deployedAgents.map((agent) => agent.id),
        steps: workflowSteps.map((step) => ({
          agentId: deployedAgents.find((a) => a.name === step.agent)?.id,
          action: step.action,
          description: step.description,
          triggers: step.triggers,
          outputs: step.outputs,
          approvals: step.approvals || [],
        })),
      })

      console.log("✅ Workflow deployed successfully:", workflow)

      return {
        success: true,
        deploymentId: workflow.id,
        message: "Workflow successfully deployed to AnythingLLM",
        agents: deployedAgents,
      }
    } catch (error) {
      console.error("❌ Workflow deployment failed:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to deploy workflow",
        agents: [],
        errors: [error],
      }
    }
  }

  /**
   * Deploy agents to AnythingLLM
   */
  private async deployAgents(agents: Agent[]): Promise<{ id: string; name: string; status: string }[]> {
    console.log("🤖 Deploying agents...")
    const deployedAgents = []

    for (const agent of agents) {
      try {
        console.log(`🔄 Processing agent: ${agent.name}`)

        // Check if agent already exists
        const existingAgents = await this.makeRequest<any[]>(`/api/v1/agents?name=${encodeURIComponent(agent.name)}`)

        let deployedAgent
        if (existingAgents.length > 0) {
          console.log(`📝 Updating existing agent: ${agent.name}`)
          // Update existing agent
          deployedAgent = await this.makeRequest<any>(`/api/v1/agents/${existingAgents[0].id}`, "PUT", {
            name: agent.name,
            type: agent.type,
            description: agent.description,
            responsibilities: agent.responsibilities,
            metadata: {
              okrMapping: agent.okrMapping,
            },
          })
        } else {
          console.log(`➕ Creating new agent: ${agent.name}`)
          // Create new agent
          deployedAgent = await this.makeRequest<any>("/api/v1/agents", "POST", {
            name: agent.name,
            type: agent.type,
            description: agent.description,
            responsibilities: agent.responsibilities,
            metadata: {
              okrMapping: agent.okrMapping,
            },
          })
        }

        deployedAgents.push({
          id: deployedAgent.id,
          name: deployedAgent.name,
          status: deployedAgent.status || "active",
        })

        console.log(`✅ Agent deployed: ${agent.name}`)
      } catch (error) {
        console.error(`❌ Failed to deploy agent ${agent.name}:`, error)
        // Continue with other agents even if one fails
        deployedAgents.push({
          id: `error-${agent.id}`,
          name: agent.name,
          status: "error",
        })
      }
    }

    return deployedAgents
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<any> {
    console.log(`📊 Getting workflow status for: ${workflowId}`)
    return this.makeRequest<any>(`/api/v1/workflows/${workflowId}`)
  }

  /**
   * Get all workflows
   */
  async getWorkflows(): Promise<any[]> {
    console.log("📋 Getting all workflows...")
    return this.makeRequest<any[]>("/api/v1/workflows")
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<any> {
    console.log("ℹ️ Getting system information...")
    return this.makeRequest<any>("/api/v1/system/info")
  }
}

// Create a singleton instance for use throughout the app
let clientInstance: AnythingLLMClient | null = null

export function getAnythingLLMClient(): AnythingLLMClient | null {
  return clientInstance
}

export function initializeAnythingLLMClient(config?: AnythingLLMConfig): AnythingLLMClient | null {
  console.log("🔧 Initializing AnythingLLM client...")

  // If config is provided, use it
  if (config) {
    console.log("✅ Using provided config")
    clientInstance = new AnythingLLMClient(config)
    return clientInstance
  }

  // Otherwise, try to initialize from stored settings
  const storedConfig = getAnythingLLMConfig()
  console.log("📋 Stored config check:", {
    hasApiKey: !!storedConfig.apiKey,
    hasBaseUrl: !!storedConfig.baseUrl,
    hasOrgId: !!storedConfig.organizationId,
  })

  if (storedConfig.apiKey && storedConfig.baseUrl) {
    console.log("✅ Using stored config")
    clientInstance = new AnythingLLMClient({
      apiKey: storedConfig.apiKey,
      baseUrl: storedConfig.baseUrl,
      organizationId: storedConfig.organizationId,
    })
    return clientInstance
  }

  console.log("❌ No valid config available")
  // If no config available, return null
  return null
}

/**
 * Helper function to test document upload specifically
 */
export async function testDocumentUpload(
  content = "# Test Document\n\nThis is a test document for AnythingLLM upload functionality.",
  fileName = `test-document-${Date.now()}.md`,
): Promise<DocumentUploadResult> {
  console.log("🧪 Testing document upload...")

  const client = getAnythingLLMClient()
  if (!client) {
    return {
      success: false,
      message: "AnythingLLM client is not initialized. Please configure your API settings.",
    }
  }

  return client.uploadDocument(content, fileName)
}
