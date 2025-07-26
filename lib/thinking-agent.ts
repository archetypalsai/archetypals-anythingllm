/**
 * Thinking Agent Manager
 * Manages AI agents that simulate thoughts about conversations and actions
 */

import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { getOpenAIApiKey } from "./api-keys"
import { databaseManager } from "./database"

export interface ThinkingAgent {
  id: string
  name: string
  role: string
  personality: string
  expertise: string[]
  isActive: boolean
  workspaceId?: string
  sessionId?: string
  thoughtHistory: AgentThought[]
}

export interface AgentThought {
  id: string
  agentId: string
  thoughtType: "pre_action" | "post_action" | "reflection" | "decision"
  content: string
  confidence: number
  timestamp: Date
  context: ThoughtContext
}

export interface ThoughtContext {
  action: string
  context: any
  conversationAnalysis?: {
    userIntent: string
    responseQuality: string
    sourceRelevance: number
    userSatisfaction: number
  }
  agentPersonality?: {
    traits: string[]
    analysisStyle: string
    confidenceLevel: number
  }
  historicalContext?: {
    previousThoughts: number
    averageConfidence: number
    recentDecisions: string[]
  }
}

export interface ActionContext {
  action: string
  context: any
}

export interface ActionResult {
  responseQuality: string
  userSatisfaction: number
  sourceCount: number
  responseLength: number
}

class ThinkingAgentManager {
  private agents: Map<string, ThinkingAgent> = new Map()
  private openai: any
  generateThoughts: any

  constructor() {
    const apiKey = getOpenAIApiKey()
    if (apiKey) {
      this.openai = createOpenAI({ apiKey })
    }

    this.initializeDefaultAgents()
    console.log("🧠 Thinking Agent Manager initialized")
  }

  private initializeDefaultAgents(): void {
    const defaultAgents: Omit<ThinkingAgent, "thoughtHistory">[] = [
      {
        id: "conversation-analyst",
        name: "Conversation Analyst",
        role: "analyst",
        personality: "Analytical, detail-oriented, and systematic in approach",
        expertise: ["conversation flow", "user intent analysis", "response quality assessment"],
        isActive: true,
      },
      {
        id: "empathy-specialist",
        name: "Empathy Specialist",
        role: "empathy_expert",
        personality: "Emotionally intelligent, user-focused, and caring",
        expertise: ["emotional intelligence", "user satisfaction", "empathy demonstration"],
        isActive: true,
      },
      {
        id: "technical-advisor",
        name: "Technical Advisor",
        role: "technical_expert",
        personality: "Precise, knowledge-focused, and solution-oriented",
        expertise: ["technical accuracy", "implementation guidance", "educational value"],
        isActive: true,
      },
      {
        id: "strategic-planner",
        name: "Strategic Planner",
        role: "strategist",
        personality: "Big-picture thinker, forward-looking, and business-minded",
        expertise: ["strategic alignment", "long-term planning", "business impact"],
        isActive: true,
      },
    ]

    defaultAgents.forEach((agentData) => {
      const agent: ThinkingAgent = {
        ...agentData,
        thoughtHistory: [],
      }
      this.agents.set(agent.id, agent)
    })

    console.log(`✅ Initialized ${defaultAgents.length} default thinking agents`)
  }

  async generatePreActionThoughts(agentId: string, actionContext: ActionContext): Promise<AgentThought> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    console.log(`🤔 Generating pre-action thoughts for ${agent.name}`)

    const thoughtContext: ThoughtContext = {
      action: actionContext.action,
      context: actionContext.context,
      conversationAnalysis: {
        userIntent: this.analyzeUserIntent(actionContext.context.userPrompt || ""),
        responseQuality: "pending",
        sourceRelevance: actionContext.context.sources?.length || 0,
        userSatisfaction: 0.5,
      },
      agentPersonality: {
        traits: agent.personality.split(", "),
        analysisStyle: agent.role,
        confidenceLevel: 0.8,
      },
      historicalContext: {
        previousThoughts: agent.thoughtHistory.length,
        averageConfidence: this.calculateAverageConfidence(agent.thoughtHistory),
        recentDecisions: agent.thoughtHistory.slice(-3).map((t) => t.thoughtType),
      },
    }

    let thoughtContent = ""
    let confidence = 0.7

    if (this.openai) {
      try {
        const prompt = this.buildPreActionPrompt(agent, actionContext, thoughtContext)
        const { text } = await generateText({
          model: this.openai("gpt-4o"),
          system: this.buildSystemPrompt(agent),
          prompt,
        })

        const parsed = this.parseThoughtResponse(text)
        thoughtContent = parsed.content
        confidence = parsed.confidence
      } catch (error) {
        console.error(`❌ Error generating AI thought for ${agentId}:`, error)
        thoughtContent = this.generateFallbackPreActionThought(agent, actionContext)
      }
    } else {
      thoughtContent = this.generateFallbackPreActionThought(agent, actionContext)
    }

    const thought: AgentThought = {
      id: `${agentId}-pre-${Date.now()}`,
      agentId,
      thoughtType: "pre_action",
      content: thoughtContent,
      confidence,
      timestamp: new Date(),
      context: thoughtContext,
    }

    // Store in agent's history
    agent.thoughtHistory.push(thought)

    // Store in database
    await this.storeThoughtInDatabase(agent, thought)

    console.log(`💭 Generated pre-action thought for ${agent.name} with confidence ${confidence.toFixed(2)}`)
    return thought
  }

  async generatePostActionThoughts(
    agentId: string,
    actionContext: ActionContext,
    result: ActionResult,
  ): Promise<AgentThought> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    console.log(`🎯 Generating post-action thoughts for ${agent.name}`)

    const thoughtContext: ThoughtContext = {
      action: actionContext.action,
      context: actionContext.context,
      conversationAnalysis: {
        userIntent: this.analyzeUserIntent(actionContext.context.userPrompt || ""),
        responseQuality: result.responseQuality,
        sourceRelevance: result.sourceCount,
        userSatisfaction: result.userSatisfaction,
      },
      agentPersonality: {
        traits: agent.personality.split(", "),
        analysisStyle: agent.role,
        confidenceLevel: 0.8,
      },
      historicalContext: {
        previousThoughts: agent.thoughtHistory.length,
        averageConfidence: this.calculateAverageConfidence(agent.thoughtHistory),
        recentDecisions: agent.thoughtHistory.slice(-3).map((t) => t.thoughtType),
      },
    }

    let thoughtContent = ""
    let confidence = 0.7

    if (this.openai) {
      try {
        const prompt = this.buildPostActionPrompt(agent, actionContext, result, thoughtContext)
        const { text } = await generateText({
          model: this.openai("gpt-4o"),
          system: this.buildSystemPrompt(agent),
          prompt,
        })

        const parsed = this.parseThoughtResponse(text)
        thoughtContent = parsed.content
        confidence = parsed.confidence
      } catch (error) {
        console.error(`❌ Error generating AI thought for ${agentId}:`, error)
        thoughtContent = this.generateFallbackPostActionThought(agent, actionContext, result)
      }
    } else {
      thoughtContent = this.generateFallbackPostActionThought(agent, actionContext, result)
    }

    const thought: AgentThought = {
      id: `${agentId}-post-${Date.now()}`,
      agentId,
      thoughtType: "post_action",
      content: thoughtContent,
      confidence,
      timestamp: new Date(),
      context: thoughtContext,
    }

    // Store in agent's history
    agent.thoughtHistory.push(thought)

    // Store in database
    await this.storeThoughtInDatabase(agent, thought)

    console.log(`💭 Generated post-action thought for ${agent.name} with confidence ${confidence.toFixed(2)}`)
    return thought
  }

  private buildSystemPrompt(agent: ThinkingAgent): string {
    return `You are ${agent.name}, a ${agent.role} with the following characteristics:

Personality: ${agent.personality}
Expertise: ${agent.expertise.join(", ")}

Your role is to provide thoughtful analysis and insights based on your expertise. 
You should be ${agent.personality.toLowerCase()} in your responses.
Focus on your areas of expertise: ${agent.expertise.join(", ")}.

Provide your thoughts in a structured format:
ANALYSIS: [Your detailed analysis]
CONFIDENCE: [Your confidence level from 0.0 to 1.0]

Be specific, actionable, and true to your personality and expertise.`
  }

  private buildPreActionPrompt(
    agent: ThinkingAgent,
    actionContext: ActionContext,
    thoughtContext: ThoughtContext,
  ): string {
    return `As ${agent.name}, analyze this upcoming action and provide your pre-action thoughts:

ACTION: ${actionContext.action}
CONTEXT: ${JSON.stringify(actionContext.context, null, 2)}

USER PROMPT: "${actionContext.context.userPrompt || "N/A"}"
SOURCES AVAILABLE: ${actionContext.context.sources?.length || 0}
WORKSPACE: ${agent.workspaceId || "Unknown"}

Based on your expertise in ${agent.expertise.join(", ")}, what are your thoughts before this action is taken?
Consider:
- What you expect to happen
- Potential challenges or opportunities
- How this aligns with your expertise
- Your confidence in the approach

Provide your analysis and confidence level.`
  }

  private buildPostActionPrompt(
    agent: ThinkingAgent,
    actionContext: ActionContext,
    result: ActionResult,
    thoughtContext: ThoughtContext,
  ): string {
    return `As ${agent.name}, analyze the results of this action and provide your post-action evaluation:

ACTION TAKEN: ${actionContext.action}
CONTEXT: ${JSON.stringify(actionContext.context, null, 2)}

RESULTS:
- Response Quality: ${result.responseQuality}
- User Satisfaction: ${result.userSatisfaction}
- Source Count: ${result.sourceCount}
- Response Length: ${result.responseLength}

USER PROMPT: "${actionContext.context.userPrompt || "N/A"}"
ASSISTANT RESPONSE: "${actionContext.context.assistantResponse || "N/A"}"

Based on your expertise in ${agent.expertise.join(", ")}, evaluate:
- How well did the action perform?
- What worked well and what could be improved?
- How does this align with your expectations?
- What insights can you provide for future actions?

Provide your evaluation and confidence level.`
  }

  private parseThoughtResponse(response: string): { content: string; confidence: number } {
    const analysisMatch = response.match(/ANALYSIS:\s*([\s\S]*?)(?=CONFIDENCE:|$)/i)
    const confidenceMatch = response.match(/CONFIDENCE:\s*(\d*\.?\d+)/i)

    return {
      content: analysisMatch?.[1]?.trim() || response,
      confidence: confidenceMatch ? Number.parseFloat(confidenceMatch[1]) : 0.7,
    }
  }

  private generateFallbackPreActionThought(agent: ThinkingAgent, actionContext: ActionContext): string {
    const action = actionContext.action
    const context = actionContext.context

    switch (agent.role) {
      case "analyst":
        return `As a conversation analyst, I'm preparing to analyze ${action}. I expect to examine the conversation flow, user intent clarity, and response relevance. With ${
          context.sources?.length || 0
        } sources available, I anticipate ${
          context.sources?.length > 2 ? "comprehensive" : "basic"
        } analysis capabilities.`

      case "empathy_expert":
        return `As an empathy specialist, I'm focusing on the emotional aspects of ${action}. I'll be looking for user emotional needs, satisfaction indicators, and empathy demonstration in the response. The user's engagement level appears ${
          context.userPrompt?.length > 50 ? "high" : "moderate"
        }.`

      case "technical_expert":
        return `As a technical advisor, I'm evaluating ${action} for technical accuracy and educational value. I'll assess whether the response includes practical guidance, code examples, and step-by-step instructions appropriate for the technical complexity.`

      case "strategist":
        return `As a strategic planner, I'm considering the long-term implications of ${action}. I'll evaluate strategic alignment, business impact, and whether the response provides actionable guidance for future planning.`

      default:
        return `As ${agent.name}, I'm preparing to analyze ${action} based on my expertise in ${agent.expertise.join(
          ", ",
        )}. I'll provide insights aligned with my ${agent.personality.toLowerCase()} approach.`
    }
  }

  private generateFallbackPostActionThought(
    agent: ThinkingAgent,
    actionContext: ActionContext,
    result: ActionResult,
  ): string {
    const action = actionContext.action
    const quality = result.responseQuality
    const satisfaction = result.userSatisfaction

    switch (agent.role) {
      case "analyst":
        return `Analysis complete for ${action}. The response quality was ${quality} with ${satisfaction.toFixed(
          1,
        )} user satisfaction. The conversation flow was ${
          result.responseLength > 300 ? "comprehensive" : "concise"
        } with ${result.sourceCount} sources integrated. ${
          result.sourceCount > 2 ? "Excellent source utilization." : "Could benefit from more source integration."
        }`

      case "empathy_expert":
        return `Empathy evaluation for ${action} shows ${quality} emotional intelligence with ${satisfaction.toFixed(
          1,
        )} satisfaction. The response ${
          satisfaction > 0.7 ? "effectively addressed user emotional needs" : "could improve emotional connection"
        }. ${
          result.responseLength > 200
            ? "Comprehensive care demonstrated."
            : "More detailed empathy could enhance user experience."
        }`

      case "technical_expert":
        return `Technical assessment of ${action} reveals ${quality} accuracy with ${
          result.sourceCount
        } technical sources. The response ${
          result.responseLength > 400
            ? "provided comprehensive technical guidance"
            : "offered basic technical information"
        }. ${
          result.sourceCount > 1
            ? "Good technical backing with multiple sources."
            : "Additional technical references would strengthen the response."
        }`

      case "strategist":
        return `Strategic evaluation of ${action} indicates ${quality} alignment with ${satisfaction.toFixed(
          1,
        )} strategic value. The response ${
          result.responseLength > 300 ? "provided strategic depth" : "focused on tactical information"
        }. ${
          satisfaction > 0.8 ? "Strong strategic impact achieved." : "Opportunity for enhanced strategic perspective."
        }`

      default:
        return `Evaluation of ${action} complete. Quality: ${quality}, Satisfaction: ${satisfaction.toFixed(
          1,
        )}. Based on my expertise in ${agent.expertise.join(", ")}, the results align with expectations.`
    }
  }

  private analyzeUserIntent(userPrompt: string): string {
    if (userPrompt.includes("?")) return "inquiry"
    if (userPrompt.includes("help") || userPrompt.includes("how")) return "assistance_seeking"
    if (userPrompt.includes("explain") || userPrompt.includes("what")) return "explanation_request"
    if (userPrompt.includes("problem") || userPrompt.includes("issue")) return "problem_solving"
    return "general_interaction"
  }

  private calculateAverageConfidence(thoughts: AgentThought[]): number {
    if (thoughts.length === 0) return 0.5
    const sum = thoughts.reduce((acc, thought) => acc + thought.confidence, 0)
    return sum / thoughts.length
  }

  private async storeThoughtInDatabase(agent: ThinkingAgent, thought: AgentThought): Promise<void> {
    try {
      await databaseManager.storeAgentThought({
        agentId: thought.agentId,
        agentName: agent.name,
        thoughtType: thought.thoughtType,
        content: thought.content,
        context: thought.context,
        confidence: thought.confidence,
        workspaceId: agent.workspaceId,
        sessionId: agent.sessionId,
      })
    } catch (error) {
      console.error(`❌ Error storing thought in database:`, error)
    }
  }

  getAgent(agentId: string): ThinkingAgent | undefined {
    return this.agents.get(agentId)
  }

  getActiveAgents(): ThinkingAgent[] {
    return Array.from(this.agents.values()).filter((agent) => agent.isActive)
  }

  getAllAgents(): ThinkingAgent[] {
    return Array.from(this.agents.values())
  }

  setAgentActive(agentId: string, isActive: boolean): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.isActive = isActive
      console.log(`${isActive ? "✅ Activated" : "⏸️ Deactivated"} agent: ${agent.name}`)
    }
  }

  getAgentThoughts(agentId: string, limit = 10): AgentThought[] {
    const agent = this.agents.get(agentId)
    return agent ? agent.thoughtHistory.slice(-limit) : []
  }

  clearAgentHistory(agentId: string): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.thoughtHistory = []
      console.log(`🧹 Cleared thought history for ${agent.name}`)
    }
  }
}

// Export singleton instance
export const thinkingAgentManager = new ThinkingAgentManager()
