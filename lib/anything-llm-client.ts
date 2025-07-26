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
  static getWorkspaceChats: any
  static testConnection: any

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







// /**
//  * AnythingLLM API Client
//  *
//  * This client handles all interactions with the AnythingLLM API for agent deployment
//  * and workflow orchestration.
//  */
// import { getAnythingLLMConfig } from "./api-keys"

// export interface AnythingLLMConfig {
//   apiKey: string
//   baseUrl: string
//   organizationId?: string
// }

// export interface Agent {
//   id: string
//   name: string
//   type: string
//   description: string
//   responsibilities: string[]
//   okrMapping: string[]
//   status: string
// }

// export interface WorkflowStep {
//   id: string
//   agent: string
//   action: string
//   description: string
//   triggers: string[]
//   outputs: string[]
//   approvals?: string[]
// }

// export interface DeploymentResult {
//   success: boolean
//   deploymentId?: string
//   message: string
//   agents: {
//     id: string
//     name: string
//     status: string
//   }[]
//   errors?: any[]
// }

// export interface WorkflowValidationResult {
//   success: boolean
//   validationResult?: any
//   agentResponses?: Array<{
//     name: string
//     response: string
//     confidence: number
//     alignment: number
//     recommendations: string[]
//   }>
//   alignmentScore?: number
//   recommendations?: string[]
//   error?: string
// }

// export class AnythingLLMClient {
//   private apiKey: string
//   private baseUrl: string
//   private organizationId?: string

//   constructor(config: AnythingLLMConfig) {
//     this.apiKey = config.apiKey
//     this.baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl.slice(0, -1) : config.baseUrl
//     this.organizationId = config.organizationId
//   }

//   private async makeRequest<T>(endpoint: string, method = "GET", data?: any): Promise<T> {
//     const url = `${this.baseUrl}${endpoint}`

//     const headers: HeadersInit = {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${this.apiKey}`,
//     }

//     if (this.organizationId) {
//       headers["X-Organization-ID"] = this.organizationId
//     }

//     const options: RequestInit = {
//       method,
//       headers,
//       body: data ? JSON.stringify(data) : undefined,
//     }

//     const response = await fetch(url, options)

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}))
//       throw new Error(`AnythingLLM API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
//     }

//     return response.json()
//   }

//   /**
//    * Test the API connection
//    */
//   async testConnection(): Promise<{ success: boolean; message: string }> {
//     try {
//       await this.makeRequest<{ status: string }>("/api/v1/status")
//       return { success: true, message: "Successfully connected to AnythingLLM API" }
//     } catch (error) {
//       return {
//         success: false,
//         message: error instanceof Error ? error.message : "Failed to connect to AnythingLLM API",
//       }
//     }
//   }

//   /**
//    * Validate workflow with AnythingLLM
//    */
//   async validateWorkflow(workflowPayload: any): Promise<WorkflowValidationResult> {
//     try {
//       const response = await this.makeRequest<any>("/api/v1/workflows/validate", "POST", workflowPayload)

//       return {
//         success: true,
//         validationResult: response,
//         agentResponses: response.agentResponses || [],
//         alignmentScore: response.alignmentScore || 0,
//         recommendations: response.recommendations || [],
//       }
//     } catch (error) {
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to validate workflow",
//         agentResponses: [],
//         alignmentScore: 0,
//         recommendations: [],
//       }
//     }
//   }

//   /**
//    * Deploy agents and workflow to AnythingLLM
//    */
//   async deployWorkflow(
//     agents: Agent[],
//     workflowSteps: WorkflowStep[],
//     workflowDescription: string,
//     workflowName: string,
//   ): Promise<DeploymentResult> {
//     try {
//       // First, create or update the agents
//       const deployedAgents = await this.deployAgents(agents)

//       // Then, create the workflow with the deployed agents
//       const workflow = await this.makeRequest<any>("/api/v1/workflows", "POST", {
//         name: workflowName,
//         description: workflowDescription,
//         agents: deployedAgents.map((agent) => agent.id),
//         steps: workflowSteps.map((step) => ({
//           agentId: deployedAgents.find((a) => a.name === step.agent)?.id,
//           action: step.action,
//           description: step.description,
//           triggers: step.triggers,
//           outputs: step.outputs,
//           approvals: step.approvals || [],
//         })),
//       })

//       return {
//         success: true,
//         deploymentId: workflow.id,
//         message: "Workflow successfully deployed to AnythingLLM",
//         agents: deployedAgents,
//       }
//     } catch (error) {
//       return {
//         success: false,
//         message: error instanceof Error ? error.message : "Failed to deploy workflow",
//         agents: [],
//         errors: [error],
//       }
//     }
//   }

//   /**
//    * Deploy agents to AnythingLLM
//    */
//   private async deployAgents(agents: Agent[]): Promise<{ id: string; name: string; status: string }[]> {
//     const deployedAgents = []

//     for (const agent of agents) {
//       // Check if agent already exists
//       const existingAgents = await this.makeRequest<any[]>(`/api/v1/agents?name=${encodeURIComponent(agent.name)}`)

//       let deployedAgent
//       if (existingAgents.length > 0) {
//         // Update existing agent
//         deployedAgent = await this.makeRequest<any>(`/api/v1/agents/${existingAgents[0].id}`, "PUT", {
//           name: agent.name,
//           type: agent.type,
//           description: agent.description,
//           responsibilities: agent.responsibilities,
//           metadata: {
//             okrMapping: agent.okrMapping,
//           },
//         })
//       } else {
//         // Create new agent
//         deployedAgent = await this.makeRequest<any>("/api/v1/agents", "POST", {
//           name: agent.name,
//           type: agent.type,
//           description: agent.description,
//           responsibilities: agent.responsibilities,
//           metadata: {
//             okrMapping: agent.okrMapping,
//           },
//         })
//       }

//       deployedAgents.push({
//         id: deployedAgent.id,
//         name: deployedAgent.name,
//         status: deployedAgent.status || "active",
//       })
//     }

//     return deployedAgents
//   }

//   /**
//    * Get workflow status
//    */
//   async getWorkflowStatus(workflowId: string): Promise<any> {
//     return this.makeRequest<any>(`/api/v1/workflows/${workflowId}`)
//   }

//   /**
//    * Get all workflows
//    */
//   async getWorkflows(): Promise<any[]> {
//     return this.makeRequest<any[]>("/api/v1/workflows")
//   }
// }

// // Create a singleton instance for use throughout the app
// let clientInstance: AnythingLLMClient | null = null

// export function getAnythingLLMClient(): AnythingLLMClient | null {
//   return clientInstance
// }

// export function initializeAnythingLLMClient(config?: AnythingLLMConfig): AnythingLLMClient | null {
//   // If config is provided, use it
//   if (config) {
//     clientInstance = new AnythingLLMClient(config)
//     return clientInstance
//   }

//   // Otherwise, try to initialize from stored settings
//   const storedConfig = getAnythingLLMConfig()
//   if (storedConfig.apiKey && storedConfig.baseUrl) {
//     clientInstance = new AnythingLLMClient({
//       apiKey: storedConfig.apiKey,
//       baseUrl: storedConfig.baseUrl,
//       organizationId: storedConfig.organizationId,
//     })
//     return clientInstance
//   }

//   // If no config available, return null
//   return null
// }
