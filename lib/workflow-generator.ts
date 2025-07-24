

/////////////////////// old code

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getOpenAIApiKey, isOpenAIConfigured } from "./api-keys"

export async function generateWorkflowDescription() {
  try {
    // Check if OpenAI API key is configured
    if (!isOpenAIConfigured()) {
      throw new Error("OpenAI API key is not configured. Please configure it in the settings.")
    }

    const apiKey = getOpenAIApiKey()

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an AI workflow orchestration expert. Generate clear, detailed descriptions of how AI agents should interact to achieve OKRs.

Your descriptions should include:
1. The sequence of agent interactions
2. Trigger conditions and handoff points
3. Decision logic and approval gates
4. Error handling and escalation paths
5. Performance monitoring touchpoints

Write in a professional, clear style that technical teams can implement.`,
      prompt: `Generate a comprehensive workflow description for a multi-agent system with these agents:
- SalesAgent: Market analysis and pricing recommendations
- GovernanceAgent: Strategic review and approvals
- MarketingAgent: Campaign execution and customer engagement
- SecurityAgent: Compliance validation and security checks

The workflow should optimize for revenue growth, customer acquisition, and operational efficiency while maintaining compliance and security standards.`,
    })

    return text
  } catch (error) {
    console.error("Error generating workflow description:", error)
    return `The agentic workflow orchestrates four specialized agents to achieve your OKRs:

1. **SalesAgent** continuously monitors market conditions and recommends pricing updates based on competitive analysis and customer feedback.

2. **GovernanceAgent** receives pricing recommendations and evaluates them against compliance requirements, budget constraints, and strategic alignment before approval.

3. **MarketingAgent** launches targeted campaigns upon approval, coordinating messaging across channels while monitoring customer acquisition costs and engagement metrics.

4. **SecurityAgent** performs final compliance checks before campaign rollout, ensuring data privacy, security protocols, and regulatory adherence.

The workflow includes automated escalation paths, approval gates, and performance monitoring to ensure optimal execution of your revenue and growth objectives.`
  }
}





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



// import { generateText } from "ai";
// import { openai } from "@ai-sdk/openai";

// /**
//  * Retrieves the OpenAI API key from environment variables.
//  * Throws an error if the API key is missing.
//  */
// function getOpenAIApiKey(): string {
//   const apiKey = process.env.OPENAI_API_KEY;
//   if (!apiKey) {
//     throw new Error(
//       "OpenAI API key is not set. Please set OPENAI_API_KEY as an environment variable."
//     );
//   }
//   return apiKey;
// }

// /**
//  * Generates a detailed workflow description for a multi-agent OKR system.
//  *
//  * @returns Promise resolving to the workflow description text.
//  */
// export async function generateWorkflowDescription(): Promise<string> {
//   const apiKey = getOpenAIApiKey();

//   try {
//     const { text } = await generateText({
//       model: openai("gpt-4o"),
//       system: `
//         You are an AI workflow orchestration expert. Generate clear, detailed descriptions of how AI agents should interact to achieve OKRs.

//         Your descriptions should include:
//         1. The sequence of agent interactions
//         2. Trigger conditions and handoff points
//         3. Decision logic and approval gates
//         4. Error handling and escalation paths
//         5. Performance monitoring touchpoints

//         Write in a professional, clear style that technical teams can implement.
//       `,
//       prompt: `
//         Generate a comprehensive workflow description for a multi-agent system with these agents:
//         - SalesAgent: Market analysis and pricing recommendations
//         - GovernanceAgent: Strategic review and approvals
//         - MarketingAgent: Campaign execution and customer engagement
//         - SecurityAgent: Compliance validation and security checks

//         The workflow should optimize for revenue growth, customer acquisition, and operational efficiency while maintaining compliance and security standards.
//       `,
//     });

//     return text;
//   } catch (error) {
//     console.error("Error generating workflow description:", error);

//     // Provide a default fallback description if AI generation fails.
//     return (
//       "The agentic workflow orchestrates four specialized agents to achieve your OKRs:\n\n" +
//       "1. **SalesAgent** continuously monitors market conditions and recommends pricing updates based on competitive analysis and customer feedback.\n\n" +
//       "2. **GovernanceAgent** receives pricing recommendations and evaluates them against compliance requirements, budget constraints, and strategic alignment before approval.\n\n" +
//       "3. **MarketingAgent** launches targeted campaigns upon approval, coordinating messaging across channels while monitoring customer acquisition costs and engagement metrics.\n\n" +
//       "4. **SecurityAgent** performs final compliance checks before campaign rollout, ensuring data privacy, security protocols, and regulatory adherence.\n\n" +
//       "The workflow includes automated escalation paths, approval gates, and performance monitoring to ensure optimal execution of your revenue and growth objectives."
//     );
//   }
// }



