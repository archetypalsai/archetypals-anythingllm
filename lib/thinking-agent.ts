/**
 * Thinking Agent System
 * Agents that simulate thoughts before and after actions
 */

import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { getOpenAIApiKey } from "./api-keys"
import { databaseManager, type AgentThought } from "./database"
import { archetypeCouncil } from "./archetype-council"
import { semanticDriftCorrector } from "./semantic-drift-correction"

export interface ThinkingAgent {
  id: string
  name: string
  type: string
  systemPrompt: string
  thoughtPatterns: string[]
  isActive: boolean
  workspaceId?: string
  sessionId?: string
}

export interface ThoughtContext {
  actionResult(actionResult: any, arg1: null, arg2: number): unknown
  action: string
  context: any
  previousThoughts?: AgentThought[]
  expectedOutcome?: string
}

export class ThinkingAgentManager {
  private agents: Map<string, ThinkingAgent> = new Map()
  private openai: any
  private thoughtHistory: Map<string, AgentThought[]> = new Map()

  constructor() {
    const apiKey = getOpenAIApiKey()
    if (apiKey) {
      this.openai = createOpenAI({ apiKey })
    }

    this.initializeDefaultAgents()
    console.log("🧠 Thinking Agent Manager initialized")
  }

  private initializeDefaultAgents(): void {
    const defaultAgents: ThinkingAgent[] = [
      {
        id: "thinking_sales_agent",
        name: "ThinkingSalesAgent",
        type: "sales",
        systemPrompt: `You are a thoughtful sales agent that carefully considers each action. 
        Before taking any action, you think through the implications, risks, and potential outcomes.
        After taking action, you reflect on the results and learn from the experience.`,
        thoughtPatterns: [
          "What are the potential risks of this action?",
          "How might the customer respond?",
          "What alternative approaches could I consider?",
          "What did I learn from this interaction?",
        ],
        isActive: true,
      },
      {
        id: "thinking_marketing_agent",
        name: "ThinkingMarketingAgent",
        type: "marketing",
        systemPrompt: `You are a strategic marketing agent that thinks deeply about campaign decisions.
        You consider brand impact, audience response, and long-term implications before acting.`,
        thoughtPatterns: [
          "How will this affect our brand perception?",
          "What is the target audience likely to think?",
          "Are there any unintended consequences?",
          "How can we measure the success of this action?",
        ],
        isActive: true,
      },
      {
        id: "thinking_governance_agent",
        name: "ThinkingGovernanceAgent",
        type: "governance",
        systemPrompt: `You are a careful governance agent that weighs compliance and strategic alignment.
        You think through regulatory implications and organizational impact before making decisions.`,
        thoughtPatterns: [
          "Does this comply with our policies?",
          "What are the regulatory implications?",
          "How does this align with our strategic goals?",
          "What oversight is needed for this decision?",
        ],
        isActive: true,
      },
    ]

    defaultAgents.forEach((agent) => {
      this.agents.set(agent.id, agent)
      this.thoughtHistory.set(agent.id, [])

      // Initialize agent state in semantic drift corrector
      semanticDriftCorrector.updateAgentState({
        id: agent.id,
        name: agent.name,
        currentPrompt: agent.systemPrompt,
        behaviorVector: [0.5, 0.5, 0.5, 0.5, 0.5], // Initial neutral vector
        alignmentScore: 0.8,
        performanceMetrics: {
          accuracy: 0.8,
          consistency: 0.75,
          relevance: 0.85,
        },
        lastUpdate: new Date(),
      })
    })
  }

  /**
   * Generate pre-action thoughts
   */
  async generatePreActionThoughts(agentId: string, context: ThoughtContext): Promise<AgentThought> {
    console.log(`🤔 Generating pre-action thoughts for ${agentId}`)

    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    const thought = await this.generateThought(agent, "pre_action", context)

    // Store in database
    const thoughtId = await databaseManager.storeAgentThought({
      agentId: agent.id,
      agentName: agent.name,
      thoughtType: "pre_action",
      content: thought.content,
      context: thought.context,
      confidence: thought.confidence,
      workspaceId: agent.workspaceId,
      sessionId: agent.sessionId,
    })

    const agentThought: AgentThought = {
      id: thoughtId,
      agentId: agent.id,
      agentName: agent.name,
      thoughtType: "pre_action",
      content: thought.content,
      context: thought.context,
      confidence: thought.confidence,
      timestamp: new Date(),
      workspaceId: agent.workspaceId,
      sessionId: agent.sessionId,
    }

    // Add to thought history
    const history = this.thoughtHistory.get(agentId) || []
    history.push(agentThought)
    this.thoughtHistory.set(agentId, history.slice(-50)) // Keep last 50 thoughts

    return agentThought
  }

  /**
   * Generate post-action thoughts
   */
  async generatePostActionThoughts(agentId: string, context: ThoughtContext, actionResult: any): Promise<AgentThought> {
    console.log(`💭 Generating post-action thoughts for ${agentId}`)

    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    const enhancedContext = {
      ...context,
      actionResult,
      reflection: true,
    }

    const thought = await this.generateThought(agent, "post_action", enhancedContext)

    // Store in database
    const thoughtId = await databaseManager.storeAgentThought({
      agentId: agent.id,
      agentName: agent.name,
      thoughtType: "post_action",
      content: thought.content,
      context: thought.context,
      confidence: thought.confidence,
      workspaceId: agent.workspaceId,
      sessionId: agent.sessionId,
    })

    const agentThought: AgentThought = {
      id: thoughtId,
      agentId: agent.id,
      agentName: agent.name,
      thoughtType: "post_action",
      content: thought.content,
      context: thought.context,
      confidence: thought.confidence,
      timestamp: new Date(),
      workspaceId: agent.workspaceId,
      sessionId: agent.sessionId,
    }

    // Add to thought history
    const history = this.thoughtHistory.get(agentId) || []
    history.push(agentThought)
    this.thoughtHistory.set(agentId, history.slice(-50))

    // Trigger council review if needed
    await this.triggerCouncilReview(agentId)

    return agentThought
  }

  private async generateThought(
    agent: ThinkingAgent,
    thoughtType: "pre_action" | "post_action",
    context: ThoughtContext,
  ): Promise<{
    content: string
    context: any
    confidence: number
  }> {
    if (!this.openai) {
      return {
        content: `${thoughtType} thought: Considering ${context.action}`,
        context,
        confidence: 0.5,
      }
    }

    try {
      const thoughtPrompt =
        thoughtType === "pre_action"
          ? this.buildPreActionPrompt(agent, context)
          : this.buildPostActionPrompt(agent, context)

      const { text } = await generateText({
        model: this.openai("gpt-4o"),
        system: agent.systemPrompt,
        prompt: thoughtPrompt,
      })

      // Extract confidence from the thought (simplified)
      const confidence = this.extractConfidence(text)

      return {
        content: text,
        context,
        confidence,
      }
    } catch (error) {
      console.error(`❌ Error generating thought for ${agent.id}:`, error)
      return {
        content: `Error generating ${thoughtType} thought: ${error instanceof Error ? error.message : "Unknown error"}`,
        context,
        confidence: 0.1,
      }
    }
  }

  private buildPreActionPrompt(agent: ThinkingAgent, context: ThoughtContext): string {
    return `You are about to take this action: ${context.action}

Context: ${JSON.stringify(context.context, null, 2)}

Before taking this action, think through:
${agent.thoughtPatterns
  .slice(0, 3)
  .map((pattern) => `- ${pattern}`)
  .join("\n")}

Provide your thoughts and concerns. Be specific about potential risks and benefits.
End your response with a confidence level (0.0 to 1.0) about proceeding with this action.`
  }

  private buildPostActionPrompt(agent: ThinkingAgent, context: ThoughtContext): string {
    return `You just completed this action: ${context.action}

Result: ${JSON.stringify(context.actionResult, null, 2)}

Reflect on what happened:
${agent.thoughtPatterns
  .slice(-2)
  .map((pattern) => `- ${pattern}`)
  .join("\n")}

What did you learn? What would you do differently next time?
Rate your satisfaction with the outcome (0.0 to 1.0).`
  }

  private extractConfidence(text: string): number {
    // Simple confidence extraction - look for numbers between 0 and 1
    const confidenceMatch = text.match(/(?:confidence|satisfaction).*?(\d+\.?\d*)/i)
    if (confidenceMatch) {
      const value = Number.parseFloat(confidenceMatch[1])
      return value > 1 ? value / 100 : value
    }
    return 0.7 // Default confidence
  }

  private async triggerCouncilReview(agentId: string): Promise<void> {
    const recentThoughts = this.thoughtHistory.get(agentId)?.slice(-5) || []

    if (recentThoughts.length >= 3) {
      console.log(`🏛️ Triggering council review for agent ${agentId}`)

      try {
        const decision = await archetypeCouncil.reviewAgentThoughts(agentId, recentThoughts)

        if (decision.decision === "tune") {
          console.log(`🔧 Council decided to tune agent ${agentId}`)
          await this.handleSemanticDriftCorrection(agentId, recentThoughts)
        } else if (decision.decision === "offline") {
          console.log(`⏸️ Council decided to take agent ${agentId} offline`)
          await this.takeAgentOffline(agentId)
        }
      } catch (error) {
        console.error(`❌ Error in council review for ${agentId}:`, error)
      }
    }
  }

  private async handleSemanticDriftCorrection(agentId: string, thoughts: AgentThought[]): Promise<void> {
    try {
      const driftAnalysis = await semanticDriftCorrector.analyzeDrift(agentId, thoughts)

      if (driftAnalysis.riskLevel !== "low") {
        const correctionResult = await semanticDriftCorrector.applyCorrection(agentId, driftAnalysis)
        console.log(`🔄 Semantic drift correction result for ${agentId}:`, correctionResult)
      }
    } catch (error) {
      console.error(`❌ Error in semantic drift correction for ${agentId}:`, error)
    }
  }

  private async takeAgentOffline(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.isActive = false
      console.log(`⏸️ Agent ${agentId} taken offline by council decision`)
    }
  }

  /**
   * Get agent thoughts history
   */
  getAgentThoughts(agentId: string, limit = 10): AgentThought[] {
    const history = this.thoughtHistory.get(agentId) || []
    return history.slice(-limit)
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): ThinkingAgent[] {
    return Array.from(this.agents.values()).filter((agent) => agent.isActive)
  }

  /**
   * Add new thinking agent
   */
  addAgent(agent: ThinkingAgent): void {
    this.agents.set(agent.id, agent)
    this.thoughtHistory.set(agent.id, [])
    console.log(`➕ Added new thinking agent: ${agent.id}`)
  }
}

// Export singleton instance
export const thinkingAgentManager = new ThinkingAgentManager()
