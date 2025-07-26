/**
 * Enhanced Agent Generator with Conversation Analysis
 *
 * This module generates specialized archetypal agents based on user conversations
 * and provides optimal responses for specific user questions.
 */

import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { getOpenAIApiKey, isOpenAIConfigured } from "./api-keys"
import { getAnythingLLMClient, initializeAnythingLLMClient } from "./anything-llm-client"

export interface Agent {
  id: string
  name: "SalesAgent" | "SecurityAgent" | "GovernanceAgent" | "MarketingAgent"
  type: string
  description: string
  responsibilities: string[]
  conversationMapping: string[]
  status: "active" | "pending" | "offline"
  expertise: string[]
  personality: string
  optimalThought: string
  importanceScore: number
}

export interface ConversationInsights {
  userNeeds: string[]
  responseGaps: string[]
  conversationPatterns: string[]
  recommendedAgentTypes: string[]
}

export interface AgentGenerationResult {
  agents: Agent[]
  agenticFlow: string
  conversationInsights: ConversationInsights
}

/**
 * Fetch and analyze the latest conversation from AnythingLLM
 */
export async function fetchAndAnalyzeLatestConversation(workspaceSlug: string): Promise<{
  conversationData: string
  analysis: {
    source: "anythingllm_api" | "sessionStorage_fallback" | "sample" | "error"
    timestamp: string
    workspace?: string
    conversationCount?: number
    error?: string
    reason?: string
    debugInfo?: any
  }
}> {
  console.log(`🔍 Fetching latest conversation from workspace: ${workspaceSlug}`)

  try {
    // Initialize AnythingLLM client
    const client = getAnythingLLMClient() || initializeAnythingLLMClient()

    if (!client) {
      console.log("❌ AnythingLLM client not available, trying sessionStorage fallback")

      // Try sessionStorage fallback
      if (typeof window !== "undefined") {
        const storedMessage = sessionStorage.getItem("latestUserMessage")
        if (storedMessage && storedMessage.trim().length > 0) {
          return {
            conversationData: storedMessage,
            analysis: {
              source: "sessionStorage_fallback",
              timestamp: new Date().toISOString(),
              reason: "AnythingLLM client not configured, used stored message",
            },
          }
        }
      }

      // Use sample data as final fallback
      const sampleMessage =
        "How can I improve the security of my web application while maintaining good user experience and ensuring compliance with data protection regulations?"

      return {
        conversationData: sampleMessage,
        analysis: {
          source: "sample",
          timestamp: new Date().toISOString(),
          reason: "No AnythingLLM client and no stored message, using sample data",
        },
      }
    }

    // Fetch from AnythingLLM API
    const result = await client.getLatestConversation(workspaceSlug)

    if (result.success && result.latestMessage) {
      console.log("✅ Successfully fetched latest user message from AnythingLLM API")

      // Store in sessionStorage for future fallback
      if (typeof window !== "undefined") {
        sessionStorage.setItem("latestUserMessage", result.latestMessage)
      }

      return {
        conversationData: result.latestMessage,
        analysis: {
          source: "anythingllm_api",
          timestamp: new Date().toISOString(),
          workspace: workspaceSlug,
          conversationCount: result.conversation?.length || 0,
          debugInfo: result.debugInfo,
        },
      }
    } else {
      console.log("⚠️ API call failed, trying sessionStorage fallback")

      // Try sessionStorage fallback
      if (typeof window !== "undefined") {
        const storedMessage = sessionStorage.getItem("latestUserMessage")
        if (storedMessage && storedMessage.trim().length > 0) {
          return {
            conversationData: storedMessage,
            analysis: {
              source: "sessionStorage_fallback",
              timestamp: new Date().toISOString(),
              workspace: workspaceSlug,
              error: result.message,
              reason: "API failed, used stored message",
              debugInfo: result.debugInfo,
            },
          }
        }
      }

      // Use sample data as final fallback
      const sampleMessage =
        "How can I improve the security of my web application while maintaining good user experience and ensuring compliance with data protection regulations?"

      return {
        conversationData: sampleMessage,
        analysis: {
          source: "sample",
          timestamp: new Date().toISOString(),
          workspace: workspaceSlug,
          error: result.message,
          reason: "API failed and no stored message, using sample data",
          debugInfo: result.debugInfo,
        },
      }
    }
  } catch (error) {
    console.error("❌ Error fetching conversation:", error)

    // Try sessionStorage fallback
    if (typeof window !== "undefined") {
      const storedMessage = sessionStorage.getItem("latestUserMessage")
      if (storedMessage && storedMessage.trim().length > 0) {
        return {
          conversationData: storedMessage,
          analysis: {
            source: "sessionStorage_fallback",
            timestamp: new Date().toISOString(),
            workspace: workspaceSlug,
            error: error instanceof Error ? error.message : "Unknown error",
            reason: "Exception occurred, used stored message",
          },
        }
      }
    }

    // Use sample data as final fallback
    const sampleMessage =
      "How can I improve the security of my web application while maintaining good user experience and ensuring compliance with data protection regulations?"

    return {
      conversationData: sampleMessage,
      analysis: {
        source: "sample",
        timestamp: new Date().toISOString(),
        workspace: workspaceSlug,
        error: error instanceof Error ? error.message : "Unknown error",
        reason: "Exception occurred and no stored message, using sample data",
      },
    }
  }
}

/**
 * Generate archetypal agents based on a user's question
 */
export async function generateAgentsFromConversation(userMessage: string): Promise<AgentGenerationResult> {
  console.log("🤖 Generating archetypal agents for user question...")
  console.log("📝 User question:", userMessage.substring(0, 200))

  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key is not configured")
  }

  const apiKey = getOpenAIApiKey()
  if (!apiKey) {
    throw new Error("OpenAI API key is missing")
  }

  // Create OpenAI provider instance correctly
  const openaiProvider = createOpenAI({
    apiKey: apiKey,
  })

  try {
    const prompt = `You are an expert in archetypal agent design and business analysis. 

TASK: Analyze the following user question and generate 2-4 specialized archetypal agents that can provide specific, actionable answers to this question.

USER QUESTION: "${userMessage}"

AGENT TYPES TO CHOOSE FROM (select only the most relevant):
- SalesAgent: Revenue generation, customer acquisition, market expansion
- SecurityAgent: Risk management, compliance, data protection, cybersecurity  
- GovernanceAgent: Legal compliance, policy, ethics, regulatory requirements
- MarketingAgent: Brand building, customer engagement, market positioning

REQUIREMENTS:
1. Only generate agents that are HIGHLY RELEVANT to answering the user's specific question
2. Each agent must provide a SPECIFIC, ACTIONABLE ANSWER to the user's question from their expertise area
3. Assign importance scores (1-10) based on how crucial each agent's perspective is for this question
4. Focus on practical, implementable advice rather than generic responses

Generate a JSON response with this exact structure:

{
  "agents": [
    {
      "id": "agent_1",
      "name": "SalesAgent|SecurityAgent|GovernanceAgent|MarketingAgent",
      "type": "Archetypal Specialist",
      "description": "Brief description of this agent's role",
      "responsibilities": ["responsibility1", "responsibility2", "responsibility3"],
      "conversationMapping": ["specific area 1", "specific area 2", "specific area 3"],
      "status": "active",
      "expertise": ["expertise1", "expertise2", "expertise3"],
      "personality": "Professional personality description",
      "optimalThought": "SPECIFIC, DETAILED ANSWER to the user's question from this agent's perspective. This should be actionable advice, not generic thoughts. Address the user's question directly.",
      "importanceScore": 8
    }
  ],
  "agenticFlow": "Detailed explanation of how these agents work together to comprehensively answer the user's question",
  "conversationInsights": {
    "userNeeds": ["identified need 1", "identified need 2"],
    "responseGaps": ["gap 1", "gap 2"],
    "conversationPatterns": ["pattern 1", "pattern 2"],
    "recommendedAgentTypes": ["agent type 1", "agent type 2"]
  }
}

IMPORTANT: 
- The "optimalThought" field must contain the agent's SPECIFIC ANSWER to the user's question
- Each agent should provide unique, non-overlapping advice
- Focus on practical implementation steps
- Only include agents that can meaningfully contribute to answering this specific question`

    const { text } = await generateText({
      model: openaiProvider("gpt-4o"),
      prompt,
      temperature: 0.7,
      maxTokens: 3000,
    })

    console.log("🤖 Raw AI response:", text.substring(0, 500))

    // Parse the JSON response
    let parsedResponse
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        parsedResponse = JSON.parse(text)
      }
    } catch (parseError) {
      console.error("❌ Failed to parse AI response as JSON:", parseError)
      console.log("Raw response:", text)
      throw new Error("Failed to parse agent generation response")
    }

    // Validate and ensure we have the required structure
    if (!parsedResponse.agents || !Array.isArray(parsedResponse.agents)) {
      throw new Error("Invalid response structure: missing agents array")
    }

    // Ensure each agent has required fields and proper format
    const validatedAgents: Agent[] = parsedResponse.agents.map((agent: any, index: number) => {
      // Validate agent name is one of the allowed types
      const allowedNames = ["SalesAgent", "SecurityAgent", "GovernanceAgent", "MarketingAgent"]
      if (!allowedNames.includes(agent.name)) {
        console.warn(`⚠️ Invalid agent name: ${agent.name}, defaulting to SalesAgent`)
        agent.name = "SalesAgent"
      }

      return {
        id: agent.id || `agent_${index + 1}`,
        name: agent.name as Agent["name"],
        type: agent.type || "Archetypal Specialist",
        description: agent.description || "Specialized archetypal agent",
        responsibilities: Array.isArray(agent.responsibilities) ? agent.responsibilities : [],
        conversationMapping: Array.isArray(agent.conversationMapping) ? agent.conversationMapping : [],
        status: "active" as const,
        expertise: Array.isArray(agent.expertise) ? agent.expertise : [],
        personality: agent.personality || "Professional and knowledgeable",
        optimalThought: agent.optimalThought || "I can help with this question from my area of expertise.",
        importanceScore: typeof agent.importanceScore === "number" ? agent.importanceScore : 5,
      }
    })

    const result: AgentGenerationResult = {
      agents: validatedAgents,
      agenticFlow: parsedResponse.agenticFlow || "These agents work together to provide comprehensive answers.",
      conversationInsights: {
        userNeeds: parsedResponse.conversationInsights?.userNeeds || [],
        responseGaps: parsedResponse.conversationInsights?.responseGaps || [],
        conversationPatterns: parsedResponse.conversationInsights?.conversationPatterns || [],
        recommendedAgentTypes: parsedResponse.conversationInsights?.recommendedAgentTypes || [],
      },
    }

    console.log("✅ Successfully generated agents:", {
      agentCount: result.agents.length,
      agentNames: result.agents.map((a) => a.name),
      avgImportance: result.agents.reduce((sum, a) => sum + a.importanceScore, 0) / result.agents.length,
    })

    return result
  } catch (error) {
    console.error("❌ Error generating agents:", error)
    throw error
  }
}

/**
 * Test AnythingLLM connection
 */
export async function testAnythingLLMConnection(): Promise<{
  success: boolean
  message: string
  debugInfo?: any
}> {
  console.log("🧪 Testing AnythingLLM connection...")

  try {
    const client = getAnythingLLMClient() || initializeAnythingLLMClient()

    if (!client) {
      return {
        success: false,
        message: "AnythingLLM client is not initialized. Please configure your API settings.",
      }
    }

    const result = await client.testConnection()
    return result
  } catch (error) {
    console.error("❌ Connection test failed:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection test failed",
    }
  }
}

/**
 * Upload agent flow to AnythingLLM
 */
export async function uploadAgentFlowToAnythingLLM(
  agenticFlow: string,
  agents: Agent[],
): Promise<{
  success: boolean
  message: string
  documentId?: string
  debugInfo?: any
}> {
  console.log("📤 Uploading agent flow to AnythingLLM...")

  try {
    const client = getAnythingLLMClient() || initializeAnythingLLMClient()

    if (!client) {
      return {
        success: false,
        message: "AnythingLLM client is not initialized. Please configure your API settings.",
      }
    }

    // Create a comprehensive document with the agent flow and agent details
    const document = `# Archetypal Agent Response System

## Generated: ${new Date().toISOString()}

## Agent Flow Description
${agenticFlow}

## Generated Agents

${agents
  .map(
    (agent) => `
### ${agent.name} (${agent.type})

**Description:** ${agent.description}

**Personality:** ${agent.personality}

**Importance Score:** ${agent.importanceScore}/10

**Specific Response:**
${agent.optimalThought}

**Areas of Expertise:**
${agent.expertise.map((exp) => `- ${exp}`).join("\n")}

**Key Responsibilities:**
${agent.responsibilities.map((resp) => `- ${resp}`).join("\n")}

**Response Focus Areas:**
${agent.conversationMapping.map((mapping) => `- ${mapping}`).join("\n")}

---
`,
  )
  .join("\n")}

## Implementation Notes

This archetypal agent system was generated to provide specialized responses to user questions. Each agent offers unique perspectives and actionable advice from their area of expertise.

### Usage Instructions

1. Present the user question to all relevant agents
2. Collect each agent's specific response
3. Synthesize the responses into a comprehensive answer
4. Prioritize responses based on importance scores

### Agent Collaboration

The agents work together by:
- Providing complementary perspectives on the same question
- Offering specialized knowledge from different domains
- Ensuring comprehensive coverage of all relevant aspects
- Delivering actionable, implementable advice
`

    const fileName = `archetypal-agents-${Date.now()}.md`
    const result = await client.uploadDocument(document, fileName)

    if (result.success) {
      console.log("✅ Successfully uploaded agent flow to AnythingLLM")
    } else {
      console.log("❌ Failed to upload agent flow:", result.message)
    }

    return result
  } catch (error) {
    console.error("❌ Upload failed:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Upload failed",
    }
  }
}
