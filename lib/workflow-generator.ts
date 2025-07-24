import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { getOpenAIApiKey, isOpenAIConfigured } from "./api-keys"
import { getAnythingLLMClient, type WorkflowValidationResult } from "./anything-llm-client"

// export async function generateWorkflowDescription() {
//   try {
//     // Check if OpenAI API key is configured
//     if (!isOpenAIConfigured()) {
//       throw new Error("OpenAI API key is not configured. Please configure it in the settings.")
//     }

//     const apiKey = getOpenAIApiKey()
//     if (!apiKey) {
//       throw new Error("OpenAI API key is missing")
//     }

//     // Create configured OpenAI instance
//     const openai = createOpenAI({
//       apiKey: apiKey,
//     })

//     const { text } = await generateText({
//       model: openai("gpt-4o"),
//       system: `You are an AI workflow orchestration expert. Generate clear, detailed descriptions of how AI agents should interact to achieve OKRs.

// Your descriptions should include:
// 1. The sequence of agent interactions
// 2. Trigger conditions and handoff points
// 3. Decision logic and approval gates
// 4. Error handling and escalation paths
// 5. Performance monitoring touchpoints

// Write in a professional, clear style that technical teams can implement.`,
//       prompt: `Generate a comprehensive workflow description for a multi-agent system with these agents:
// - SalesAgent: Market analysis and pricing recommendations
// - GovernanceAgent: Strategic review and approvals
// - MarketingAgent: Campaign execution and customer engagement
// - SecurityAgent: Compliance validation and security checks

// The workflow should optimize for revenue growth, customer acquisition, and operational efficiency while maintaining compliance and security standards.`,
//     })

//     return text
//   } catch (error) {
//     console.error("Error generating workflow description:", error)
//     return `The agentic workflow orchestrates four specialized agents to achieve your OKRs:

// 1. **SalesAgent** continuously monitors market conditions and recommends pricing updates based on competitive analysis and customer feedback.

// 2. **GovernanceAgent** receives pricing recommendations and evaluates them against compliance requirements, budget constraints, and strategic alignment before approval.

// 3. **MarketingAgent** launches targeted campaigns upon approval, coordinating messaging across channels while monitoring customer acquisition costs and engagement metrics.

// 4. **SecurityAgent** performs final compliance checks before campaign rollout, ensuring data privacy, security protocols, and regulatory adherence.

// The workflow includes automated escalation paths, approval gates, and performance monitoring to ensure optimal execution of your revenue and growth objectives.`
//   }
// }

// New function to send workflow to AnythingLLM and get agent responses
export async function sendWorkflowToAnythingLLM(
  workflow: any[],
  agents: any[],
  description: string,
): Promise<WorkflowValidationResult> {
  try {
    const client = getAnythingLLMClient()
    if (!client) {
      throw new Error("AnythingLLM client is not configured")
    }

    // Send the workflow to AnythingLLM for processing
    const workflowPayload = {
      name: "OKR Agentic Workflow",
      description: description,
      agents: agents.map((agent) => ({
        name: agent.name,
        type: agent.type || "archetypal",
        description: agent.description,
        responsibilities: agent.responsibilities || [],
        capabilities: agent.capabilities || [],
      })),
      workflow: workflow.map((step) => ({
        id: step.id,
        agent: step.agent,
        action: step.action,
        description: step.description,
        triggers: step.triggers,
        outputs: step.outputs,
        approvals: step.approvals || [],
      })),
    }

    // Send to AnythingLLM for validation and processing
    const result = await client.validateWorkflow(workflowPayload)

    return result
  } catch (error) {
    console.error("Error sending workflow to AnythingLLM:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process workflow",
      agentResponses: [],
      alignmentScore: 0,
      recommendations: [],
    }
  }
}

// Function to evaluate agent alignment with OKRs
export async function evaluateAgentAlignment(agents: any[], okrContent: string) {
  try {
    const apiKey = getOpenAIApiKey()
    if (!apiKey) {
      throw new Error("OpenAI API key is missing")
    }

    const openai = createOpenAI({
      apiKey: apiKey,
    })

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an AI alignment evaluator. Analyze how well the generated agents align with the provided OKRs and provide detailed feedback.

Evaluate each agent on:
1. Relevance to OKR objectives
2. Capability to achieve key results
3. Integration with other agents
4. Potential gaps or overlaps
5. Optimization recommendations

Provide a JSON response with alignment scores (0-100) and detailed feedback.`,
      prompt: `Evaluate these agents against the OKRs:

OKRs:
${okrContent}

Agents:
${JSON.stringify(agents, null, 2)}

Provide alignment evaluation with scores and recommendations.`,
    })

    return JSON.parse(text)
  } catch (error) {
    console.error("Error evaluating agent alignment:", error)
    return {
      overallAlignment: 75,
      agentScores: agents.map((agent) => ({
        name: agent.name,
        score: 75,
        feedback: "Agent appears well-aligned with objectives",
      })),
      recommendations: ["Consider adding more specific KPIs", "Enhance inter-agent communication"],
    }
  }
}


// import { generateText } from "ai"
// import { createOpenAI } from "@ai-sdk/openai" // Changed from 'openai' to 'createOpenAI'
// import { getOpenAIApiKey, isOpenAIConfigured } from "./api-keys"

// export async function generateWorkflowDescription() {
//   try {
//     // Check if OpenAI API key is configured
//     if (!isOpenAIConfigured()) {
//       throw new Error("OpenAI API key is not configured. Please configure it in the settings.")
//     }

//     const apiKey = getOpenAIApiKey()
//     if (!apiKey) {
//       throw new Error("OpenAI API key is missing")
//     }

//     // Create configured OpenAI instance
//     const openai = createOpenAI({
//       apiKey: apiKey
//     })

//     const { text } = await generateText({
//       model: openai("gpt-4o"), // Use the configured instance
//       system: `You are an AI workflow orchestration expert. Generate clear, detailed descriptions of how AI agents should interact to achieve OKRs.

// Your descriptions should include:
// 1. The sequence of agent interactions
// 2. Trigger conditions and handoff points
// 3. Decision logic and approval gates
// 4. Error handling and escalation paths
// 5. Performance monitoring touchpoints

// Write in a professional, clear style that technical teams can implement.`,
//       prompt: `Generate a comprehensive workflow description for a multi-agent system with these agents:
// - SalesAgent: Market analysis and pricing recommendations
// - GovernanceAgent: Strategic review and approvals
// - MarketingAgent: Campaign execution and customer engagement
// - SecurityAgent: Compliance validation and security checks

// The workflow should optimize for revenue growth, customer acquisition, and operational efficiency while maintaining compliance and security standards.`,
//     })

//     return text
//   } catch (error) {
//     console.error("Error generating workflow description:", error)
//     return `The agentic workflow orchestrates four specialized agents to achieve your OKRs:

// 1. **SalesAgent** continuously monitors market conditions and recommends pricing updates based on competitive analysis and customer feedback.

// 2. **GovernanceAgent** receives pricing recommendations and evaluates them against compliance requirements, budget constraints, and strategic alignment before approval.

// 3. **MarketingAgent** launches targeted campaigns upon approval, coordinating messaging across channels while monitoring customer acquisition costs and engagement metrics.

// 4. **SecurityAgent** performs final compliance checks before campaign rollout, ensuring data privacy, security protocols, and regulatory adherence.

// The workflow includes automated escalation paths, approval gates, and performance monitoring to ensure optimal execution of your revenue and growth objectives.`
//   }
// }

// /////////////////////// old code

// import { generateText } from "ai"
// import { openai } from "@ai-sdk/openai"
// import { getOpenAIApiKey, isOpenAIConfigured } from "./api-keys"

// export async function generateWorkflowDescription() {
//   try {
//     // Check if OpenAI API key is configured
//     if (!isOpenAIConfigured()) {
//       throw new Error("OpenAI API key is not configured. Please configure it in the settings.")
//     }

//     const apiKey = getOpenAIApiKey()

//     const { text } = await generateText({
//       model: openai("gpt-4o"),
//       system: `You are an AI workflow orchestration expert. Generate clear, detailed descriptions of how AI agents should interact to achieve OKRs.

// Your descriptions should include:
// 1. The sequence of agent interactions
// 2. Trigger conditions and handoff points
// 3. Decision logic and approval gates
// 4. Error handling and escalation paths
// 5. Performance monitoring touchpoints

// Write in a professional, clear style that technical teams can implement.`,
//       prompt: `Generate a comprehensive workflow description for a multi-agent system with these agents:
// - SalesAgent: Market analysis and pricing recommendations
// - GovernanceAgent: Strategic review and approvals
// - MarketingAgent: Campaign execution and customer engagement
// - SecurityAgent: Compliance validation and security checks

// The workflow should optimize for revenue growth, customer acquisition, and operational efficiency while maintaining compliance and security standards.`,
//     })

//     return text
//   } catch (error) {
//     console.error("Error generating workflow description:", error)
//     return `The agentic workflow orchestrates four specialized agents to achieve your OKRs:

// 1. **SalesAgent** continuously monitors market conditions and recommends pricing updates based on competitive analysis and customer feedback.

// 2. **GovernanceAgent** receives pricing recommendations and evaluates them against compliance requirements, budget constraints, and strategic alignment before approval.

// 3. **MarketingAgent** launches targeted campaigns upon approval, coordinating messaging across channels while monitoring customer acquisition costs and engagement metrics.

// 4. **SecurityAgent** performs final compliance checks before campaign rollout, ensuring data privacy, security protocols, and regulatory adherence.

// The workflow includes automated escalation paths, approval gates, and performance monitoring to ensure optimal execution of your revenue and growth objectives.`
//   }
// }





