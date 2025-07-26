"use client"

import { generateObject } from "ai"
import { z } from "zod"
import { createOpenAI } from "@ai-sdk/openai"
import { getOpenAIApiKey, isOpenAIConfigured } from "./api-keys"
import { getAnythingLLMClient } from "./anything-llm-client"
import { anythingLLMIntegration } from "./anything-llm-integration"

const agentGenerationSchema = z.object({
  agents: z
    .array(
      z.object({
        id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
        name: z.string().describe("Name of the AI agent archetype based on conversation analysis"),
        type: z.string().describe("Type/category of the agent based on conversation needs"),
        description: z.string().describe("Detailed description of the agent's purpose and capabilities"),
        responsibilities: z.array(z.string()).describe("List of primary tasks or responsibilities for this agent"),
        conversationMapping: z.array(z.string()).describe("How this agent relates to the analyzed conversation"),
        status: z.enum(["active", "pending", "offline"]).default("active"),
        expertise: z.array(z.string()).describe("Areas of expertise derived from conversation analysis"),
        personality: z.string().describe("Agent personality traits based on conversation context"),
      }),
    )
    .min(1, "At least one agent must be generated"),
  agenticFlow: z.string().describe("Description of how agents interact based on conversation patterns"),
  conversationInsights: z.object({
    userNeeds: z.array(z.string()).describe("Identified user needs from the conversation"),
    responseGaps: z.array(z.string()).describe("Areas where the response could be improved"),
    conversationPatterns: z.array(z.string()).describe("Patterns identified in the conversation"),
    recommendedAgentTypes: z.array(z.string()).describe("Types of agents that would improve this conversation"),
  }),
})

export async function generateAgentsFromConversation(conversationData: string) {
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
      system: `You are an AI system that analyzes conversations and generates archetypal agents that would improve future similar conversations.

Your task is to:
1. Analyze the conversation to understand user needs, response quality, and interaction patterns
2. Identify gaps or areas for improvement in the conversation
3. Generate archetypal agents that would address these needs and improve the conversation quality
4. Create agents with specific expertise, personalities, and responsibilities based on the conversation context

Focus on creating agents that would:
- Better understand user intent and emotional state
- Provide more comprehensive and accurate responses
- Offer specialized expertise in relevant domains
- Improve overall conversation flow and user satisfaction`,
      prompt: `Analyze this conversation and generate appropriate archetypal agents that would improve similar conversations:

${conversationData}

Based on this conversation, generate agents that would:
1. Better address the user's specific needs and questions
2. Provide more comprehensive responses with better sources
3. Improve emotional intelligence and user satisfaction
4. Offer specialized expertise in the relevant domains
5. Enhance overall conversation quality and flow

Generate agents with distinct personalities, expertise areas, and responsibilities that complement each other to create a comprehensive conversation improvement system.

Return ONLY the JSON object matching the required schema.`,
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
    console.error("Error in generateAgentsFromConversation:", error)
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
  conversationInsights: any,
  workspaceId?: string,
): Promise<{ success: boolean; message: string; documentId?: string; debugInfo?: any }> {
  console.log("🚀 Starting upload to AnythingLLM using client...")

  try {
    const client = getAnythingLLMClient()
    if (!client) {
      throw new Error("AnythingLLM client is not configured. Please configure it in settings.")
    }

    // Create a comprehensive document content
    const documentContent = `# Conversation-Based Agent System - ${new Date().toLocaleDateString()}

## Executive Summary
This document contains AI-generated archetypal agents designed to improve conversation quality based on analysis of actual user interactions. These agents are specifically tailored to address identified gaps and enhance user experience.

## Conversation Analysis Insights

### User Needs Identified
${conversationInsights.userNeeds.map((need: string) => `• ${need}`).join("\n")}

### Response Gaps Found
${conversationInsights.responseGaps.map((gap: string) => `• ${gap}`).join("\n")}

### Conversation Patterns
${conversationInsights.conversationPatterns.map((pattern: string) => `• ${pattern}`).join("\n")}

### Recommended Agent Types
${conversationInsights.recommendedAgentTypes.map((type: string) => `• ${type}`).join("\n")}

## Generated Archetypal Agents (${agents.length} total)
${agents
  .map(
    (agent, index) => `
### ${index + 1}. ${agent.name}
- **Type**: ${agent.type}
- **Description**: ${agent.description}
- **Status**: ${agent.status}
- **Personality**: ${agent.personality}

**Areas of Expertise:**
${agent.expertise.map((exp: string) => `  • ${exp}`).join("\n")}

**Key Responsibilities:**
${agent.responsibilities.map((resp: string) => `  • ${resp}`).join("\n")}

**Conversation Mapping:**
${agent.conversationMapping.map((mapping: string) => `  • ${mapping}`).join("\n")}

---
`,
  )
  .join("\n")}

## Agent Interaction Flow
${agenticFlow}

## Implementation Strategy
1. **Conversation Analysis**: Each agent analyzes incoming conversations based on their expertise
2. **Collaborative Response**: Agents work together to provide comprehensive, well-rounded responses
3. **Continuous Learning**: Agents adapt based on conversation outcomes and user feedback
4. **Quality Assurance**: Multi-agent review ensures response accuracy and completeness

## Performance Metrics
- **Agent Count**: ${agents.length}
- **Total Expertise Areas**: ${agents.reduce((acc, agent) => acc + agent.expertise.length, 0)}
- **Total Responsibilities**: ${agents.reduce((acc, agent) => acc + agent.responsibilities.length, 0)}
- **Conversation Mappings**: ${agents.reduce((acc, agent) => acc + agent.conversationMapping.length, 0)}

## Technical Metadata
- **Generated**: ${new Date().toISOString()}
- **Source**: Conversation Analysis
- **Agent Generation Method**: AI-powered analysis of user interactions
- **Document Version**: 1.0
`

    const fileName = `conversation-based-agents-${Date.now()}.md`

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

// Function to fetch and analyze latest conversation from AnythingLLM
export async function fetchAndAnalyzeLatestConversation(workspaceId = "default"): Promise<{
  conversationData: string
  analysis: {
    userMessage: string
    assistantResponse: string
    sources: any[]
    timestamp: string
    conversationId: string
  }
}> {
  console.log("📥 Fetching latest conversation from AnythingLLM...")

  try {
    // Use the AnythingLLM integration to fetch the latest conversation
    const conversation = await anythingLLMIntegration.fetchLatestConversation(workspaceId)

    // Format the conversation data for analysis
    const conversationData = anythingLLMIntegration.formatConversationForAnalysis(conversation)

    console.log("✅ Successfully fetched and formatted conversation data")

    return {
      conversationData,
      analysis: {
        userMessage: conversation.userMessage,
        assistantResponse: conversation.assistantResponse,
        sources: conversation.sources,
        timestamp: conversation.timestamp,
        conversationId: conversation.conversationId,
      },
    }
  } catch (error) {
    console.error("❌ Error fetching conversation:", error)
    throw new Error(`Failed to fetch conversation: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
