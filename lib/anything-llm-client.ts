/**
 * AnythingLLM API Client
 *
 * This client handles all interactions with the AnythingLLM API for agent deployment
 * and workflow orchestration.
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

export class AnythingLLMClient {
  private apiKey: string
  private baseUrl: string
  private organizationId?: string

  constructor(config: AnythingLLMConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl.slice(0, -1) : config.baseUrl
    this.organizationId = config.organizationId
  }

  private async makeRequest<T>(endpoint: string, method = "GET", data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

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

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`AnythingLLM API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    return response.json()
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest<{ status: string }>("/api/v1/status")
      return { success: true, message: "Successfully connected to AnythingLLM API" }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to connect to AnythingLLM API",
      }
    }
  }

  /**
   * Validate workflow with AnythingLLM
   */
  async validateWorkflow(workflowPayload: any): Promise<WorkflowValidationResult> {
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

      return {
        success: true,
        deploymentId: workflow.id,
        message: "Workflow successfully deployed to AnythingLLM",
        agents: deployedAgents,
      }
    } catch (error) {
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
    const deployedAgents = []

    for (const agent of agents) {
      // Check if agent already exists
      const existingAgents = await this.makeRequest<any[]>(`/api/v1/agents?name=${encodeURIComponent(agent.name)}`)

      let deployedAgent
      if (existingAgents.length > 0) {
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
    }

    return deployedAgents
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<any> {
    return this.makeRequest<any>(`/api/v1/workflows/${workflowId}`)
  }

  /**
   * Get all workflows
   */
  async getWorkflows(): Promise<any[]> {
    return this.makeRequest<any[]>("/api/v1/workflows")
  }
}

// Create a singleton instance for use throughout the app
let clientInstance: AnythingLLMClient | null = null

export function getAnythingLLMClient(): AnythingLLMClient | null {
  return clientInstance
}

export function initializeAnythingLLMClient(config?: AnythingLLMConfig): AnythingLLMClient | null {
  // If config is provided, use it
  if (config) {
    clientInstance = new AnythingLLMClient(config)
    return clientInstance
  }

  // Otherwise, try to initialize from stored settings
  const storedConfig = getAnythingLLMConfig()
  if (storedConfig.apiKey && storedConfig.baseUrl) {
    clientInstance = new AnythingLLMClient({
      apiKey: storedConfig.apiKey,
      baseUrl: storedConfig.baseUrl,
      organizationId: storedConfig.organizationId,
    })
    return clientInstance
  }

  // If no config available, return null
  return null
}
