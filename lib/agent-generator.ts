import { generateObject } from "ai"
import { z } from "zod"
import { createOpenAI } from "@ai-sdk/openai"
import { getOpenAIApiKey, isOpenAIConfigured } from "./api-keys"

// Make schema more flexible with optional fields and defaults
const AgentSchema = z.object({
  agents: z.array(
    z.object({
      id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
      name: z.string().min(2),
      type: z.string().default("general"),
      description: z.string().default(""),
      responsibilities: z.array(z.string()).default([]),
      okrMapping: z.array(z.string()).default([]),
      status: z.enum(["ready", "pending", "disabled"]).default("ready"),
    })
  ).min(1, "At least one agent must be generated")
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

    const openai = createOpenAI({ apiKey })

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: AgentSchema,
      system: `You are an AI system that analyzes OKRs (Objectives and Key Results) and generates archetypal agents for workflow orchestration. 

Based on the provided OKRs, generate 3-5 specialized agents that would be most effective for achieving these objectives. Each agent should have:
- A clear archetypal name (e.g., SalesAgent, MarketingAgent, SecurityAgent, GovernanceAgent)
- Specific responsibilities aligned with the OKRs
- Clear mapping to relevant objectives and key results

Respond with ONLY the JSON object matching the required schema.`,
      prompt: `Analyze these OKRs and generate appropriate archetypal agents:

${okrContent}

Generate agents that would be most effective for achieving these objectives through coordinated workflow orchestration. Return ONLY the JSON object matching the required schema.`,
    })

    // Validate the response
    const validation = AgentSchema.safeParse(result.object)
    if (!validation.success) {
      console.error("Schema validation failed:", validation.error)
      throw new Error("The generated agents didn't match the expected format")
    }

    return validation.data.agents
  } catch (error) {
    console.error("Error generating agents:", error)
    throw new Error(`Failed to generate agents: ${error instanceof Error ? error.message : String(error)}`)
  }
}
