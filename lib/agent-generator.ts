import { generateObject } from "ai"
import { z } from "zod"
import { createOpenAI } from "@ai-sdk/openai"
import { getOpenAIApiKey, isOpenAIConfigured } from "./api-keys"
import { getAnythingLLMClient } from "./anything-llm-client"

const agentGenerationSchema = z.object({
  agents: z
    .array(
      z.object({
        id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
        name: z
          .enum(["SecurityAgent", "MarketingAgent", "GovernanceAgent", "SalesAgent"])
          .describe("Name of the AI agent archetype"),
        type: z.string().default("general"),
        description: z.string().default(""),
        responsibilities: z.array(z.string()).describe("List of primary tasks or responsibilities for this agent"),
        okrMapping: z.array(z.string()).default([]),
        status: z.enum(["active", "pending", "offline"]).default("active"),
      }),
    )
    .min(1, "At least one agent must be generated"),
  agenticFlow: z.string().describe("Description of how agents interact to achieve OKRs"),
})

export async function generateAgentsFromOKRs(okrContent: string) {
  try {
    if (!isOpenAIConfigured()) {
      throw new Error("OpenAI API key is not configured. Please configure it in the settings.")
    }

    const apiKey = getOpenAIApiKey()
    if (!apiKey) {
      throw new Error("OpenAI API key is missing")
    }

    const openai = createOpenAI({
      apiKey,
    })

    // Add timeout and retry logic
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: agentGenerationSchema,
      system: `You are an AI system that analyzes OKRs (Objectives and Key Results) and generates archetypal agents for workflow orchestration.`,
      prompt: `Analyze these OKRs and generate appropriate archetypal agents with their interaction flow:

${okrContent}

Generate agents that would be most effective for achieving these objectives through coordinated workflow orchestration. Return ONLY the JSON object matching the required schema.`,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Validate the response
    const validation = agentGenerationSchema.safeParse(result.object)
    if (!validation.success) {
      console.error("Schema validation failed:", validation.error)
      throw new Error("The generated agents didn't match the expected format")
    }

    return validation.data
  } catch (error) {
    console.error("Error in generateAgentsFromOKRs:", error)
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out. Please try again.")
      }
      if (error.message.includes("API key")) {
        throw new Error("Invalid OpenAI API key. Please check your configuration.")
      }
      if (error.message.includes("rate limit")) {
        throw new Error("Rate limit exceeded. Please wait and try again.")
      }
    }
    throw new Error(`Failed to generate agents: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Updated function to use the new AnythingLLM client
export async function uploadAgentFlowToAnythingLLM(
  agenticFlow: string,
  agents: any[],
  workspaceId?: string,
): Promise<{ success: boolean; message: string; documentId?: string; debugInfo?: any }> {
  console.log("🚀 Starting upload to AnythingLLM using client...")

  try {
    const client = getAnythingLLMClient()
    if (!client) {
      throw new Error("AnythingLLM client is not configured. Please configure it in settings.")
    }

    // Create a comprehensive document content
    const documentContent = `# Agent Interaction Flow - ${new Date().toLocaleDateString()}

## Executive Summary
This document contains AI-generated archetypal agents and their interaction flow designed to achieve specific OKRs through coordinated workflow orchestration.

## Generated Agents (${agents.length} total)
${agents
  .map(
    (agent, index) => `
### ${index + 1}. ${agent.name}
- **Type**: ${agent.type}
- **Description**: ${agent.description}
- **Status**: ${agent.status}

**Key Responsibilities:**
${agent.responsibilities.map((resp: string) => `  • ${resp}`).join("\n")}

**OKR Mapping:**
${agent.okrMapping.length > 0 ? agent.okrMapping.map((okr: string) => `  • ${okr}`).join("\n") : "  • No specific OKRs mapped"}

---
`,
  )
  .join("\n")}

## Agent Interaction Flow
${agenticFlow}

## Implementation Guidelines
1. **Agent Coordination**: Each agent operates within its defined scope while maintaining communication with other agents
2. **OKR Alignment**: All agent activities should directly contribute to the mapped OKRs
3. **Workflow Orchestration**: Agents should follow the interaction flow to ensure optimal coordination
4. **Performance Monitoring**: Regular assessment of agent performance against OKR targets

## Technical Metadata
- **Generated**: ${new Date().toISOString()}
- **Agent Count**: ${agents.length}
- **Total Responsibilities**: ${agents.reduce((acc, agent) => acc + agent.responsibilities.length, 0)}
- **Total OKR Mappings**: ${agents.reduce((acc, agent) => acc + agent.okrMapping.length, 0)}
- **Document Version**: 1.0
`

    const fileName = `agent-interaction-flow-${Date.now()}.md`

    // Use the client's upload method
    const result = await client.uploadDocument(documentContent, fileName, "text/markdown", workspaceId)

    return result
  } catch (error) {
    console.error("💥 Error uploading to AnythingLLM:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload to AnythingLLM",
      debugInfo: {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
    }
  }
}

// Updated connection test function
export async function testAnythingLLMConnection(): Promise<{
  success: boolean
  message: string
  debugInfo?: any
}> {
  console.log("🔍 Testing AnythingLLM connection using client...")

  try {
    const client = getAnythingLLMClient()
    if (!client) {
      return {
        success: false,
        message: "AnythingLLM client is not configured",
        debugInfo: { error: "Client not initialized" },
      }
    }

    // Test connection using the client
    const result = await client.testConnection()
    return result
  } catch (error) {
    console.error("💥 Connection test failed:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection test failed",
      debugInfo: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    }
  }
}





//////// with old schema
// import { generateObject } from "ai"
// import { z } from "zod"
// import { createOpenAI } from "@ai-sdk/openai"
// import { getOpenAIApiKey, isOpenAIConfigured } from "./api-keys"

// // Make schema more flexible with optional fields and defaults
// const AgentSchema = z.object({
//   agents: z.array(
//     z.object({
//       id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
//       name: z.string().min(2),
//       type: z.string().default("general"),
//       description: z.string().default(""),
//       responsibilities: z.array(z.string()).default([]),
//       okrMapping: z.array(z.string()).default([]),
//       status: z.enum(["ready", "pending", "disabled"]).default("ready"),
//     })
//   ).min(1, "At least one agent must be generated")
// })

// export async function generateAgentsFromOKRs(okrContent: string) {
//   try {
//     if (!isOpenAIConfigured()) {
//       throw new Error("OpenAI API key is not configured. Please configure it in the settings.")
//     }

//     const apiKey = getOpenAIApiKey()
//     if (!apiKey) {
//       throw new Error("OpenAI API key is missing")
//     }

//     const openai = createOpenAI({ apiKey })

//     const result = await generateObject({
//       model: openai("gpt-4o"),
//       schema: AgentSchema,
//       system: `You are an AI system that analyzes OKRs (Objectives and Key Results) and generates archetypal agents for workflow orchestration. 

// Based on the provided OKRs, generate 3-5 specialized agents that would be most effective for achieving these objectives. Each agent should have:
// - A clear archetypal name (e.g., SalesAgent, MarketingAgent, SecurityAgent, GovernanceAgent)
// - Specific responsibilities aligned with the OKRs
// - Clear mapping to relevant objectives and key results

// Respond with ONLY the JSON object matching the required schema.`,
//       prompt: `Analyze these OKRs and generate appropriate archetypal agents:

// ${okrContent}

// Generate agents that would be most effective for achieving these objectives through coordinated workflow orchestration. Return ONLY the JSON object matching the required schema.`,
//     })

//     // Validate the response
//     const validation = AgentSchema.safeParse(result.object)
//     if (!validation.success) {
//       console.error("Schema validation failed:", validation.error)
//       throw new Error("The generated agents didn't match the expected format")
//     }

//     return validation.data.agents
//   } catch (error) {
//     console.error("Error generating agents:", error)
//     throw new Error(`Failed to generate agents: ${error instanceof Error ? error.message : String(error)}`)
//   }
// }
