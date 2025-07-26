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
          .enum(["SalesAgent", "SecurityAgent", "GovernanceAgent", "MarketingAgent"])
          .describe("Name of the archetypal agent - must be one of the four specific types"),
        type: z.string().describe("Type/category of the agent"),
        description: z.string().describe("Description of the agent's role and capabilities"),
        responsibilities: z.array(z.string()).describe("List of primary tasks or responsibilities for this agent"),
        expertise: z.array(z.string()).describe("Areas of expertise for this agent"),
        personality: z.string().describe("Personality traits and communication style"),
        optimalThought: z.string().describe("The agent's optimal thought/response to answer the user's question"),
        conversationMapping: z.array(z.string()).describe("How this agent maps to conversation needs"),
        status: z.enum(["active", "pending", "offline"]).default("active"),
        importanceScore: z
          .number()
          .min(1)
          .max(10)
          .describe("Importance score (1-10) for this agent based on the user message"),
      }),
    )
    .min(1, "At least one agent must be generated")
    .max(4, "Maximum four agents can be generated"),
  agenticFlow: z.string().describe("Description of how agents collaborate to provide comprehensive answers"),
  conversationInsights: z.object({
    userNeeds: z.array(z.string()).describe("Identified user needs from the conversation"),
    responseGaps: z.array(z.string()).describe("Gaps in current responses"),
    conversationPatterns: z.array(z.string()).describe("Patterns observed in the conversation"),
    recommendedAgentTypes: z.array(z.string()).describe("Types of agents recommended for this conversation"),
  }),
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

export async function generateAgentsFromConversation(userMessage: string) {
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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: agentGenerationSchema,
      system: `You are an AI system that analyzes user questions and generates specialized archetypal agents to provide comprehensive answers.

You MUST only generate agents from these four specific archetypes:
1. SalesAgent - Focuses on revenue, customer acquisition, pricing, market opportunities
2. SecurityAgent - Handles security, privacy, compliance, risk assessment
3. GovernanceAgent - Manages oversight, approval processes, regulatory compliance, policy
4. MarketingAgent - Covers branding, campaigns, customer engagement, market positioning

Select and generate only the most relevant agents (1-4) based on the user's question. Each agent should have an importance score (1-10) indicating how relevant they are to answering the question.`,
      prompt: `Analyze this user question and generate the most relevant archetypal agents from the four available types:

USER QUESTION:
"${userMessage}"

Generate only the archetypal agents that are most important for answering this question:

- **SalesAgent**: If the question involves revenue, pricing, customer acquisition, sales strategies, market opportunities, or business growth
- **SecurityAgent**: If the question involves security concerns, privacy, data protection, compliance, risk assessment, or safety
- **GovernanceAgent**: If the question involves oversight, approval processes, regulatory compliance, policy decisions, or governance
- **MarketingAgent**: If the question involves branding, marketing campaigns, customer engagement, market positioning, or promotional strategies

For each selected agent:
1. Assign an importance score (1-10) based on how relevant they are to the question
2. Provide their "optimalThought" - their best response/insight from their expertise area
3. Focus on how they would specifically contribute to answering the user's question

Only generate agents that are truly relevant to the question. If a question is purely technical, you might only need 1-2 agents. If it's about business strategy, you might need 3-4.

Return ONLY the JSON object matching the required schema.`,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const validation = agentGenerationSchema.safeParse(result.object)
    if (!validation.success) {
      console.error("Schema validation failed:", validation.error)
      throw new Error("The generated agents didn't match the expected format")
    }

    // Sort agents by importance score (highest first)
    const sortedAgents = validation.data.agents.sort((a, b) => b.importanceScore - a.importanceScore)

    return {
      ...validation.data,
      agents: sortedAgents,
    }
  } catch (error) {
    console.error("Error in generateAgentsFromConversation:", error)
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
    const documentContent = `# Archetypal Agent Response System - ${new Date().toLocaleDateString()}

## Executive Summary
This document contains AI-generated archetypal agents and their optimal responses to user questions, designed to provide comprehensive answers through specialized expertise.

## Generated Agents (${agents.length} total)
${agents
  .map(
    (agent, index) => `
### ${index + 1}. ${agent.name} (Importance: ${agent.importanceScore}/10)
- **Type**: ${agent.type}
- **Description**: ${agent.description}
- **Status**: ${agent.status}

**Optimal Thought:**
${agent.optimalThought}

**Key Responsibilities:**
${agent.responsibilities.map((resp: string) => `  • ${resp}`).join("\n")}

**Areas of Expertise:**
${agent.expertise.map((exp: string) => `  • ${exp}`).join("\n")}

**Personality:** ${agent.personality}

**Conversation Mapping:**
${agent.conversationMapping.map((mapping: string) => `  • ${mapping}`).join("\n")}

---
`,
  )
  .join("\n")}

## Agent Collaboration Flow
${agenticFlow}

## Implementation Guidelines
1. **Agent Prioritization**: Agents are ordered by importance score for the specific user question
2. **Specialized Responses**: Each agent provides their optimal thought from their expertise area
3. **Collaborative Approach**: Agents work together to provide comprehensive answers
4. **Quality Assurance**: Higher importance agents take lead roles in response formulation

## Technical Metadata
- **Generated**: ${new Date().toISOString()}
- **Agent Count**: ${agents.length}
- **Total Expertise Areas**: ${agents.reduce((acc, agent) => acc + agent.expertise.length, 0)}
- **Average Importance Score**: ${(agents.reduce((acc, agent) => acc + agent.importanceScore, 0) / agents.length).toFixed(1)}
- **Document Version**: 2.0
`

    const fileName = `archetypal-agent-responses-${Date.now()}.md`

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

export async function fetchAndAnalyzeLatestConversation(workspaceSlug = "archetypals"): Promise<{
  conversationData: string
  analysis: any
}> {
  console.log(`🔍 Starting fetchAndAnalyzeLatestConversation for workspace: ${workspaceSlug}`)

  try {
    const client = getAnythingLLMClient()
    if (!client) {
      console.log("❌ AnythingLLM client is not configured, falling back to sessionStorage")

      // Fallback to sessionStorage if client not available
      const storedData = sessionStorage.getItem("anythingllm-responses")
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        let latestUserMessage = ""

        if (parsedData.content) {
          latestUserMessage = parsedData.content
        } else if (Array.isArray(parsedData)) {
          const userMessages = parsedData.filter((msg) => msg.role === "user" || msg.type === "user")
          if (userMessages.length > 0) {
            latestUserMessage =
              userMessages[userMessages.length - 1].content || userMessages[userMessages.length - 1].message
          }
        } else if (typeof parsedData === "string") {
          latestUserMessage = parsedData
        }

        return {
          conversationData: latestUserMessage || "No user message found in sessionStorage",
          analysis: {
            source: "sessionStorage_fallback",
            timestamp: new Date().toISOString(),
            messageType: "user_query",
          },
        }
      }

      throw new Error("AnythingLLM client is not configured and no sessionStorage data available")
    }

    console.log(`🌐 Fetching latest conversation from workspace: ${workspaceSlug}`)

    // Fetch the latest conversation from AnythingLLM
    const result = await client.getLatestConversation(workspaceSlug)

    console.log("📊 API result:", {
      success: result.success,
      hasMessage: !!result.latestMessage,
      messageLength: result.latestMessage?.length || 0,
      messagePreview: result.latestMessage?.substring(0, 100) || "No message",
    })

    if (result.success && result.latestMessage && result.latestMessage.trim().length > 0) {
      console.log("✅ Successfully retrieved message from API")
      return {
        conversationData: result.latestMessage,
        analysis: {
          source: "anythingllm_api",
          workspace: workspaceSlug,
          timestamp: new Date().toISOString(),
          messageType: "user_query",
          conversationCount: result.conversation?.length || 0,
          debugInfo: result.debugInfo,
        },
      }
    }

    console.log("⚠️ API call succeeded but no valid message found, trying fallbacks...")

    // Fallback to sessionStorage if API call doesn't return a valid message
    const storedData = sessionStorage.getItem("anythingllm-responses")
    if (storedData) {
      console.log("📦 Found sessionStorage data, attempting to parse...")
      const parsedData = JSON.parse(storedData)

      // Extract the latest user message
      let latestUserMessage = ""
      if (parsedData.content) {
        latestUserMessage = parsedData.content
      } else if (Array.isArray(parsedData)) {
        // If it's an array of messages, get the last user message
        const userMessages = parsedData.filter((msg) => msg.role === "user" || msg.type === "user")
        if (userMessages.length > 0) {
          latestUserMessage =
            userMessages[userMessages.length - 1].content || userMessages[userMessages.length - 1].message
        }
      } else if (typeof parsedData === "string") {
        latestUserMessage = parsedData
      }

      if (latestUserMessage && latestUserMessage.trim().length > 0) {
        console.log("✅ Successfully retrieved message from sessionStorage")
        return {
          conversationData: latestUserMessage,
          analysis: {
            source: "sessionStorage_fallback",
            timestamp: new Date().toISOString(),
            messageType: "user_query",
            apiResult: result,
          },
        }
      }
    }

    console.log("⚠️ No valid data found in API or sessionStorage, using sample data")

    // If no stored data, return sample data for testing
    const sampleConversation =
      "I need help building a scalable web application with real-time features. What technologies should I consider and what are the main challenges I should be aware of?"

    return {
      conversationData: sampleConversation,
      analysis: {
        source: "sample",
        timestamp: new Date().toISOString(),
        messageType: "sample_query",
        apiResult: result,
        reason: "No valid message found in API or sessionStorage",
      },
    }
  } catch (error) {
    console.error("💥 Error in fetchAndAnalyzeLatestConversation:", error)
    return {
      conversationData: "Error fetching conversation data",
      analysis: {
        source: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
    }
  }
}
