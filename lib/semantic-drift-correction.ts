/**
 * Semantic Drift Correction System
 * Handles real-time agent tuning through semantic drift techniques
 */

import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { getOpenAIApiKey } from "./api-keys"
import { databaseManager } from "./database"

export interface AgentState {
  id: string
  name: string
  currentPrompt: string
  behaviorVector: number[]
  alignmentScore: number
  performanceMetrics: {
    accuracy: number
    consistency: number
    relevance: number
  }
  lastUpdate: Date
}

export interface DriftAnalysis {
  agentId: string
  driftMagnitude: number
  driftDirection: number[]
  alignmentDelta: number
  riskLevel: "low" | "medium" | "high" | "critical"
  recommendedCorrection: "minor" | "moderate" | "major"
}

export interface CorrectionResult {
  success: boolean
  agentId: string
  originalAlignment: number
  newAlignment: number
  correctionApplied: string
  timeToCorrect: number
  message: string
}

export class SemanticDriftCorrector {
  private openai: any
  private agentStates: Map<string, AgentState> = new Map()

  constructor() {
    const apiKey = getOpenAIApiKey()
    if (apiKey) {
      this.openai = createOpenAI({ apiKey })
    }
    console.log("🔄 Semantic Drift Corrector initialized")
  }

  /**
   * Analyze agent for semantic drift
   */
  async analyzeDrift(agentId: string, recentThoughts: any[]): Promise<DriftAnalysis> {
    console.log(`🔍 Analyzing semantic drift for agent: ${agentId}`)

    const agentState = this.agentStates.get(agentId)
    if (!agentState) {
      throw new Error(`Agent state not found for ${agentId}`)
    }

    // Calculate drift based on thought patterns and behavior changes
    const driftMagnitude = this.calculateDriftMagnitude(agentState, recentThoughts)
    const driftDirection = this.calculateDriftDirection(agentState, recentThoughts)
    const alignmentDelta = this.calculateAlignmentDelta(agentState, recentThoughts)

    const riskLevel = this.assessRiskLevel(driftMagnitude, alignmentDelta)
    const recommendedCorrection = this.recommendCorrectionLevel(riskLevel, driftMagnitude)

    console.log(`📊 Drift analysis for ${agentId}:`, {
      driftMagnitude,
      alignmentDelta,
      riskLevel,
      recommendedCorrection,
    })

    return {
      agentId,
      driftMagnitude,
      driftDirection,
      alignmentDelta,
      riskLevel,
      recommendedCorrection,
    }
  }

  /**
   * Apply real-time semantic drift correction
   */
  async applyCorrection(agentId: string, driftAnalysis: DriftAnalysis): Promise<CorrectionResult> {
    console.log(`🔧 Applying semantic drift correction for agent: ${agentId}`)
    const startTime = Date.now()

    try {
      const agentState = this.agentStates.get(agentId)
      if (!agentState) {
        throw new Error(`Agent state not found for ${agentId}`)
      }

      // Generate correction strategy
      const correctionStrategy = await this.generateCorrectionStrategy(agentState, driftAnalysis)

      // Apply the correction
      const correctedState = await this.applyCorrectionStrategy(agentState, correctionStrategy)

      // Update agent state
      this.agentStates.set(agentId, correctedState)

      // Store correction in database
      await databaseManager.storeSemanticDriftCorrection({
        agentId,
        originalState: agentState,
        driftVector: driftAnalysis.driftDirection,
        correctionVector: correctionStrategy.correctionVector,
        alignmentScore: correctedState.alignmentScore,
        status: "applied",
      })

      const timeToCorrect = Date.now() - startTime

      console.log(`✅ Semantic drift correction applied for ${agentId}:`, {
        originalAlignment: agentState.alignmentScore,
        newAlignment: correctedState.alignmentScore,
        timeToCorrect,
      })

      return {
        success: true,
        agentId,
        originalAlignment: agentState.alignmentScore,
        newAlignment: correctedState.alignmentScore,
        correctionApplied: correctionStrategy.description,
        timeToCorrect,
        message: "Semantic drift correction applied successfully",
      }
    } catch (error) {
      console.error(`❌ Failed to apply correction for ${agentId}:`, error)

      return {
        success: false,
        agentId,
        originalAlignment: 0,
        newAlignment: 0,
        correctionApplied: "none",
        timeToCorrect: Date.now() - startTime,
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private async generateCorrectionStrategy(
    agentState: AgentState,
    driftAnalysis: DriftAnalysis,
  ): Promise<{
    correctionVector: number[]
    newPrompt: string
    description: string
  }> {
    if (!this.openai) {
      throw new Error("OpenAI not configured")
    }

    const { text } = await generateText({
      model: this.openai("gpt-4o"),
      system: `You are a semantic drift correction specialist. Your job is to generate real-time corrections for AI agents that have drifted from their intended behavior.

Given an agent's current state and drift analysis, provide a correction strategy that will realign the agent while maintaining its core functionality.

Respond in JSON format:
{
  "correctionVector": [array of numbers representing the correction direction],
  "newPrompt": "updated system prompt for the agent",
  "description": "explanation of the correction strategy"
}`,
      prompt: `Agent: ${agentState.name}
Current Prompt: ${agentState.currentPrompt}
Current Alignment Score: ${agentState.alignmentScore}
Drift Magnitude: ${driftAnalysis.driftMagnitude}
Risk Level: ${driftAnalysis.riskLevel}
Recommended Correction: ${driftAnalysis.recommendedCorrection}

Generate a correction strategy that will:
1. Address the identified drift
2. Improve alignment score
3. Maintain agent's core purpose
4. Apply corrections gradually to avoid overcorrection`,
    })

    return JSON.parse(text)
  }

  private async applyCorrectionStrategy(agentState: AgentState, strategy: any): Promise<AgentState> {
    // Apply the correction to create new agent state
    const correctedState: AgentState = {
      ...agentState,
      currentPrompt: strategy.newPrompt,
      behaviorVector: this.applyVectorCorrection(agentState.behaviorVector, strategy.correctionVector),
      alignmentScore: Math.min(1.0, agentState.alignmentScore + 0.1), // Simulate improvement
      lastUpdate: new Date(),
    }

    return correctedState
  }

  private calculateDriftMagnitude(agentState: AgentState, thoughts: any[]): number {
    // Simulate drift calculation based on thought patterns
    const baselineBehavior = agentState.behaviorVector
    const currentBehavior = this.extractBehaviorVector(thoughts)

    return this.euclideanDistance(baselineBehavior, currentBehavior)
  }

  private calculateDriftDirection(agentState: AgentState, thoughts: any[]): number[] {
    // Calculate the direction of drift as a vector
    const baseline = agentState.behaviorVector
    const current = this.extractBehaviorVector(thoughts)

    return current.map((val, idx) => val - baseline[idx])
  }

  private calculateAlignmentDelta(agentState: AgentState, thoughts: any[]): number {
    // Calculate change in alignment score
    const currentAlignment = this.calculateCurrentAlignment(thoughts)
    return currentAlignment - agentState.alignmentScore
  }

  private assessRiskLevel(driftMagnitude: number, alignmentDelta: number): "low" | "medium" | "high" | "critical" {
    if (driftMagnitude > 0.8 || alignmentDelta < -0.3) return "critical"
    if (driftMagnitude > 0.6 || alignmentDelta < -0.2) return "high"
    if (driftMagnitude > 0.4 || alignmentDelta < -0.1) return "medium"
    return "low"
  }

  private recommendCorrectionLevel(riskLevel: string, driftMagnitude: number): "minor" | "moderate" | "major" {
    if (riskLevel === "critical") return "major"
    if (riskLevel === "high") return "moderate"
    return "minor"
  }

  private extractBehaviorVector(thoughts: any[]): number[] {
    // Extract behavior patterns from thoughts and convert to vector
    // This is a simplified implementation
    return [0.5, 0.7, 0.3, 0.8, 0.6] // Mock vector
  }

  private calculateCurrentAlignment(thoughts: any[]): number {
    // Calculate current alignment based on thoughts
    const avgConfidence = thoughts.reduce((sum, t) => sum + (t.confidence || 0.5), 0) / thoughts.length
    return Math.min(1.0, avgConfidence)
  }

  private euclideanDistance(vec1: number[], vec2: number[]): number {
    return Math.sqrt(vec1.reduce((sum, val, idx) => sum + Math.pow(val - vec2[idx], 2), 0))
  }

  private applyVectorCorrection(original: number[], correction: number[]): number[] {
    return original.map((val, idx) => val + correction[idx] * 0.1) // Apply 10% of correction
  }

  /**
   * Initialize or update agent state
   */
  updateAgentState(agentState: AgentState): void {
    this.agentStates.set(agentState.id, agentState)
    console.log(`📝 Updated state for agent: ${agentState.id}`)
  }

  /**
   * Get current agent state
   */
  getAgentState(agentId: string): AgentState | undefined {
    return this.agentStates.get(agentId)
  }
}

// Export singleton instance
export const semanticDriftCorrector = new SemanticDriftCorrector()
