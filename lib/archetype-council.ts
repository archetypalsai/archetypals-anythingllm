// /**
//  * Archetype Council System
//  * Manages the council of agents that review and make decisions about other agents
//  */

// import { generateText } from "ai"
// import { createOpenAI } from "@ai-sdk/openai"
// import { getOpenAIApiKey } from "./api-keys"
// import { databaseManager, type AgentThought } from "./database"

// export interface CouncilMember {
//   id: string
//   name: string
//   role: "classifier" | "evaluator" | "decision_maker"
//   specialization: string[]
//   personality: string
//   decisionThreshold: number
// }

// export interface CouncilDecision {
//   agentId: string
//   decision: "maintain" | "tune" | "offline"
//   confidence: number
//   reasoning: string
//   unanimity: boolean
//   votingResults: {
//     memberId: string
//     vote: "maintain" | "tune" | "offline"
//     confidence: number
//     reasoning: string
//   }[]
// }

// export class ArchetypeCouncil {
//   private members: CouncilMember[]
//   private openai: any

//   constructor() {
//     this.members = this.initializeCouncilMembers()

//     const apiKey = getOpenAIApiKey()
//     if (apiKey) {
//       this.openai = createOpenAI({ apiKey })
//     }

//     console.log("🏛️ Archetype Council initialized with", this.members.length, "members")
//   }

//   private initializeCouncilMembers(): CouncilMember[] {
//     return [
//       {
//         id: "council_classifier",
//         name: "The Classifier",
//         role: "classifier",
//         specialization: ["pattern_recognition", "anomaly_detection", "behavioral_analysis"],
//         personality: "Analytical and methodical, focuses on categorizing and understanding patterns in agent behavior",
//         decisionThreshold: 0.7,
//       },
//       {
//         id: "council_evaluator",
//         name: "The Evaluator",
//         role: "evaluator",
//         specialization: ["performance_assessment", "alignment_scoring", "risk_analysis"],
//         personality: "Critical and thorough, evaluates agent performance against objectives and identifies risks",
//         decisionThreshold: 0.75,
//       },
//       {
//         id: "council_strategist",
//         name: "The Strategist",
//         role: "decision_maker",
//         specialization: ["strategic_planning", "long_term_thinking", "system_optimization"],
//         personality: "Forward-thinking and holistic, considers long-term implications of agent decisions",
//         decisionThreshold: 0.8,
//       },
//       {
//         id: "council_guardian",
//         name: "The Guardian",
//         role: "decision_maker",
//         specialization: ["safety_monitoring", "ethical_compliance", "system_stability"],
//         personality: "Protective and cautious, prioritizes system safety and ethical alignment",
//         decisionThreshold: 0.85,
//       },
//     ]
//   }

//   /**
//    * Review agent thoughts and make collective decision
//    */
//   async reviewAgentThoughts(agentId: string, thoughts: AgentThought[]): Promise<CouncilDecision> {
//     console.log(`🏛️ Council reviewing thoughts for agent: ${agentId}`)
//     console.log(`📊 Analyzing ${thoughts.length} thoughts`)

//     const votingResults = []

//     // Each council member evaluates the thoughts
//     for (const member of this.members) {
//       const vote = await this.getMemberVote(member, agentId, thoughts)
//       votingResults.push(vote)

//       // Store individual decision in database
//       await databaseManager.storeArchetypeDecision({
//         thoughtId: thoughts[0]?.id || "batch_review",
//         agentId,
//         councilMemberId: member.id,
//         decision: vote.vote,
//         reasoning: vote.reasoning,
//         confidence: vote.confidence,
//       })
//     }

//     // Determine final decision based on votes
//     const finalDecision = this.calculateFinalDecision(votingResults)

//     console.log("🗳️ Council voting results:", {
//       agentId,
//       finalDecision: finalDecision.decision,
//       confidence: finalDecision.confidence,
//       unanimity: finalDecision.unanimity,
//     })

//     return {
//       agentId,
//       decision: finalDecision.decision,
//       confidence: finalDecision.confidence,
//       reasoning: finalDecision.reasoning,
//       unanimity: finalDecision.unanimity,
//       votingResults,
//     }
//   }

//   private async getMemberVote(
//     member: CouncilMember,
//     agentId: string,
//     thoughts: AgentThought[],
//   ): Promise<{
//     memberId: string
//     vote: "maintain" | "tune" | "offline"
//     confidence: number
//     reasoning: string
//   }> {
//     console.log(`🤔 ${member.name} evaluating agent ${agentId}`)

//     if (!this.openai) {
//       // Fallback decision logic
//       return {
//         memberId: member.id,
//         vote: "maintain",
//         confidence: 0.5,
//         reasoning: "OpenAI not configured, defaulting to maintain",
//       }
//     }

//     try {
//       const thoughtsSummary = thoughts
//         .map((t) => `${t.thoughtType}: ${t.content} (confidence: ${t.confidence})`)
//         .join("\n")

//       const { text } = await generateText({
//         model: this.openai("gpt-4o"),
//         system: `You are ${member.name}, a member of the Archetype Council.
        
// Your role: ${member.role}
// Your specialization: ${member.specialization.join(", ")}
// Your personality: ${member.personality}
// Your decision threshold: ${member.decisionThreshold}

// You must evaluate an agent's thoughts and decide whether to:
// - MAINTAIN: Agent is performing well and aligned
// - TUNE: Agent needs real-time adjustment via semantic drift correction
// - OFFLINE: Agent should be taken offline for major issues

// Respond in JSON format:
// {
//   "vote": "maintain|tune|offline",
//   "confidence": 0.0-1.0,
//   "reasoning": "detailed explanation of your decision"
// }`,
//         prompt: `Evaluate these thoughts from agent ${agentId}:

// ${thoughtsSummary}

// Consider:
// 1. Are the thoughts aligned with the agent's purpose?
// 2. Is the confidence level appropriate?
// 3. Are there signs of drift or misalignment?
// 4. What risks do you identify?
// 5. What action would best serve the system?

// Provide your vote and reasoning.`,
//       })

//       const decision = JSON.parse(text)
//       console.log(`✅ ${member.name} voted:`, decision.vote, `(confidence: ${decision.confidence})`)

//       return {
//         memberId: member.id,
//         vote: decision.vote,
//         confidence: decision.confidence,
//         reasoning: decision.reasoning,
//       }
//     } catch (error) {
//       console.error(`❌ Error getting vote from ${member.name}:`, error)
//       return {
//         memberId: member.id,
//         vote: "maintain",
//         confidence: 0.3,
//         reasoning: `Error in evaluation: ${error instanceof Error ? error.message : "Unknown error"}`,
//       }
//     }
//   }

//   private calculateFinalDecision(votes: any[]): {
//     decision: "maintain" | "tune" | "offline"
//     confidence: number
//     reasoning: string
//     unanimity: boolean
//   } {
//     const voteCount = {
//       maintain: 0,
//       tune: 0,
//       offline: 0,
//     }

//     let totalConfidence = 0
//     const reasonings: string[] = []

//     votes.forEach((vote) => {
//       voteCount[vote.vote]++
//       totalConfidence += vote.confidence
//       reasonings.push(`${vote.memberId}: ${vote.reasoning}`)
//     })

//     const avgConfidence = totalConfidence / votes.length
//     const maxVotes = Math.max(voteCount.maintain, voteCount.tune, voteCount.offline)

//     let finalDecision: "maintain" | "tune" | "offline" = "maintain"
//     if (voteCount.offline === maxVotes) finalDecision = "offline"
//     else if (voteCount.tune === maxVotes) finalDecision = "tune"

//     const unanimity = maxVotes === votes.length

//     return {
//       decision: finalDecision,
//       confidence: avgConfidence,
//       reasoning: `Council decision based on ${votes.length} votes. ${reasonings.join("; ")}`,
//       unanimity,
//     }
//   }

//   /**
//    * Get council member information
//    */
//   getCouncilMembers(): CouncilMember[] {
//     return [...this.members]
//   }
// }

// // Export singleton instance
// export const archetypeCouncil = new ArchetypeCouncil()
