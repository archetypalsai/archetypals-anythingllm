import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { getOpenAIApiKey, isOpenAIConfigured } from "./api-keys"

const AgentSchema = z.object({
  agents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      description: z.string(),
      responsibilities: z.array(z.string()),
      okrMapping: z.array(z.string()),
      status: z.literal("ready"),
    }),
  ),
})

//  const result = await generateObject({
//       model: openai("gpt-4o"), // Now we just select the model from the initialized client
//       schema: agentGenerationSchema, // Pass the Zod schema
//       prompt: `
//         Based on the following Objectives and Key Results (OKRs), generate a JSON object containing:
//         1. An array of archetypal AI agents. The 'name' of each agent MUST be one of the following: "SecurityAgent", "MarketingAgent", "GovernanceAgent", or "SalesAgent". Each agent should also have a 'functions' array listing their primary tasks derived from the OKRs.
//         2. A 'agenticFlow' string describing how these specific agents would interact to achieve the OKRs.

//         For each OKR, assign relevant functions to one of the four specified agent types. If an OKR doesn't directly fit, assign it to the most relevant agent or indicate its non-applicability within that agent's functions.

//         OKR List:
//         ${okrText}

//         Ensure the output strictly adheres to the provided JSON schema.
//       `,
//     })

export async function generateAgentsFromOKRs(okrContent: string) {
  try {
    // Check if OpenAI API key is configured
    if (!isOpenAIConfigured()) {
      throw new Error("OpenAI API key is not configured. Please configure it in the settings.")
    }

    const apiKey = getOpenAIApiKey()

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: AgentSchema,
      system: `You are an AI system that analyzes OKRs (Objectives and Key Results) and generates archetypal agents for workflow orchestration. 

Based on the provided OKRs, generate 3-5 specialized agents that would be most effective for achieving these objectives. Each agent should have:
- A clear archetypal name (e.g., SalesAgent, MarketingAgent, SecurityAgent, GovernanceAgent)
- Specific responsibilities aligned with the OKRs
- Clear mapping to relevant objectives and key results

Focus on creating agents that complement each other and can work together in a coordinated workflow.`,
      prompt: `Analyze these OKRs and generate appropriate archetypal agents:

${okrContent}

Generate agents that would be most effective for achieving these objectives through coordinated workflow orchestration.`,
    })

    return object.agents
  } catch (error) {
    console.error("Error generating agents:", error)
    throw error
  }
}
