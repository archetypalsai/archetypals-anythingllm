/**
 * Database Configuration and Operations
 * Handles in-memory storage for browser compatibility
 */

export interface AgentThought {
  id: string
  agentId: string
  agentName: string
  thoughtType: "pre_action" | "post_action" | "reflection" | "decision"
  content: string
  context: any
  confidence: number
  timestamp: Date
  workspaceId?: string
  sessionId?: string
}

export interface ArchetypeDecision {
  id: string
  thoughtId: string
  agentId: string
  councilMemberId: string
  decision: "maintain" | "tune" | "offline"
  reasoning: string
  confidence: number
  timestamp: Date
}

export interface SemanticDriftCorrection {
  id: string
  agentId: string
  originalState: any
  driftVector: number[]
  correctionVector: number[]
  alignmentScore: number
  timestamp: Date
  status: "applied" | "pending" | "failed"
}

export interface ConversationAnalysis {
  id: string
  conversationId: string
  workspaceId: string
  userMessage: string
  assistantMessage: string
  analysisSummary: any
  totalAgentsAnalyzed: number
  avgConfidence: number
  createdAt: Date
}

export interface ConversationThought {
  id: string
  agentId: string
  agentName: string
  conversationId: string
  userPrompt: string
  assistantResponse: string
  thoughtType: string
  thoughtContent: string
  confidence: number
  sentiment: string
  insights: string[]
  recommendations: string[]
  metadata: any
  timestamp: Date
}

class InMemoryDatabase {
  private agentThoughts: AgentThought[] = []
  private archetypeDecisions: ArchetypeDecision[] = []
  private semanticDriftCorrections: SemanticDriftCorrection[] = []
  private conversationAnalyses: ConversationAnalysis[] = []
  private conversationThoughts: ConversationThought[] = []

  constructor() {
    console.log("🗄️ In-Memory Database initialized")
  }

  /**
   * Generate UUID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  /**
   * Test database connection (always returns true for in-memory)
   */
  async testConnection(): Promise<boolean> {
    console.log("✅ In-memory database connection successful")
    return true
  }

  /**
   * Initialize database tables (no-op for in-memory)
   */
  async initializeTables(): Promise<void> {
    console.log("✅ In-memory database tables initialized")
  }

  /**
   * Store agent thought in memory
   */
  async storeAgentThought(thought: Omit<AgentThought, "id" | "timestamp">): Promise<string> {
    const id = this.generateId()
    const newThought: AgentThought = {
      ...thought,
      id,
      timestamp: new Date(),
    }

    this.agentThoughts.push(newThought)
    console.log("💭 Agent thought stored with ID:", id)
    return id
  }

  /**
   * Store conversation analysis summary
   */
  async storeConversationAnalysis(analysis: {
    conversationId: string
    workspaceId: string
    userMessage: string
    assistantMessage: string
    analysisSummary: any
    totalAgentsAnalyzed: number
    avgConfidence: number
  }): Promise<string> {
    const id = this.generateId()
    const newAnalysis: ConversationAnalysis = {
      ...analysis,
      id,
      createdAt: new Date(),
    }

    this.conversationAnalyses.push(newAnalysis)
    console.log("📊 Conversation analysis stored with ID:", id)
    return id
  }

  /**
   * Store conversation thought
   */
  async storeConversationThought(thought: Omit<ConversationThought, "timestamp">): Promise<string> {
    const newThought: ConversationThought = {
      ...thought,
      timestamp: new Date(),
    }

    this.conversationThoughts.push(newThought)
    console.log("💭 Conversation thought stored with ID:", thought.id)
    return thought.id
  }

  /**
   * Store archetype council decision
   */
  async storeArchetypeDecision(decision: Omit<ArchetypeDecision, "id" | "timestamp">): Promise<string> {
    const id = this.generateId()
    const newDecision: ArchetypeDecision = {
      ...decision,
      id,
      timestamp: new Date(),
    }

    this.archetypeDecisions.push(newDecision)
    console.log("🏛️ Archetype decision stored with ID:", id)
    return id
  }

  /**
   * Store semantic drift correction
   */
  async storeSemanticDriftCorrection(correction: Omit<SemanticDriftCorrection, "id" | "timestamp">): Promise<string> {
    const id = this.generateId()
    const newCorrection: SemanticDriftCorrection = {
      ...correction,
      id,
      timestamp: new Date(),
    }

    this.semanticDriftCorrections.push(newCorrection)
    console.log("🔄 Semantic drift correction stored with ID:", id)
    return id
  }

  /**
   * Get recent thoughts for an agent
   */
  async getAgentThoughts(agentId: string, limit = 10): Promise<AgentThought[]> {
    const thoughts = this.agentThoughts
      .filter((thought) => thought.agentId === agentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)

    console.log(`✅ Retrieved ${thoughts.length} thoughts for agent ${agentId}`)
    return thoughts
  }

  /**
   * Get recent conversation analyses
   */
  async getRecentConversationAnalyses(workspaceId?: string, limit = 10): Promise<ConversationAnalysis[]> {
    let analyses = this.conversationAnalyses

    if (workspaceId) {
      analyses = analyses.filter((analysis) => analysis.workspaceId === workspaceId)
    }

    const result = analyses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit)

    console.log(`✅ Retrieved ${result.length} conversation analyses`)
    return result
  }

  /**
   * Get recent conversation thoughts
   */
  async getRecentConversationThoughts(limit = 50): Promise<ConversationThought[]> {
    const thoughts = this.conversationThoughts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)

    console.log(`✅ Retrieved ${thoughts.length} conversation thoughts`)
    return thoughts
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    const thoughtsByAgent: Record<string, number> = {}
    const thoughtsByType: Record<string, number> = {}
    const sentimentDistribution: Record<string, number> = {}
    let totalConfidence = 0

    // Process agent thoughts
    this.agentThoughts.forEach((thought) => {
      thoughtsByAgent[thought.agentName] = (thoughtsByAgent[thought.agentName] || 0) + 1
      thoughtsByType[thought.thoughtType] = (thoughtsByType[thought.thoughtType] || 0) + 1
      totalConfidence += thought.confidence
    })

    // Process conversation thoughts
    this.conversationThoughts.forEach((thought) => {
      thoughtsByAgent[thought.agentName] = (thoughtsByAgent[thought.agentName] || 0) + 1
      thoughtsByType[thought.thoughtType] = (thoughtsByType[thought.thoughtType] || 0) + 1
      sentimentDistribution[thought.sentiment] = (sentimentDistribution[thought.sentiment] || 0) + 1
      totalConfidence += thought.confidence
    })

    const totalThoughts = this.agentThoughts.length + this.conversationThoughts.length
    const averageConfidence = totalThoughts > 0 ? totalConfidence / totalThoughts : 0

    return {
      totalThoughts,
      totalDecisions: this.archetypeDecisions.length,
      totalCorrections: this.semanticDriftCorrections.length,
      totalAnalyses: this.conversationAnalyses.length,
      thoughtsByAgent,
      thoughtsByType,
      sentimentDistribution,
      averageConfidence,
      agentStats: Object.entries(thoughtsByAgent).map(([agentId, count]) => ({
        agentId,
        thoughtCount: count,
        avgConfidence: averageConfidence,
      })),
    }
  }

  /**
   * Clear all data (for testing)
   */
  async clearAll(): Promise<void> {
    this.agentThoughts = []
    this.archetypeDecisions = []
    this.semanticDriftCorrections = []
    this.conversationAnalyses = []
    this.conversationThoughts = []
    console.log("🧹 All data cleared")
  }

  /**
   * Close database connection (no-op for in-memory)
   */
  async close(): Promise<void> {
    console.log("🔌 In-memory database connection closed")
  }
}

// Export singleton instance
export const databaseManager = new InMemoryDatabase()
export const db = databaseManager // Export as 'db' for compatibility
export { InMemoryDatabase as DatabaseManager }
