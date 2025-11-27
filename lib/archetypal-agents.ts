// /**
//  * Archetypal Agents System
//  * Specialized agents that analyze user messages from different business perspectives
//  */

// import { generateText } from "ai"
// import { createOpenAI } from "@ai-sdk/openai"
// import { getOpenAIApiKey } from "./api-keys"
// //import { databaseManager } from "./database"

// export interface ArchetypalAgent {
//   id: string
//   name: string
//   type: "security" | "sales" | "marketing" | "governance"
//   personality: string
//   expertise: string[]
//   analysisFramework: string[]
//   isActive: boolean
//   thoughtHistory: ArchetypalThought[]
// }

// export interface ArchetypalThought {
//   id: string
//   agentId: string
//   agentName: string
//   agentType: string
//   userMessage: string
//   assistantResponse: string
//   thoughtContent: string
//   insights: AgentInsight[]
//   recommendations: AgentRecommendation[]
//   riskAssessment?: RiskAssessment
//   opportunityAnalysis?: OpportunityAnalysis
//   confidence: number
//   priority: "high" | "medium" | "low"
//   timestamp: Date
//   metadata: {
//     analysisTime: number
//     keyFactors: string[]
//     confidenceFactors: string[]
//   }
// }

// export interface AgentInsight {
//   category: string
//   insight: string
//   impact: "high" | "medium" | "low"
//   evidence: string[]
//   score: number
// }

// export interface AgentRecommendation {
//   priority: "high" | "medium" | "low"
//   action: string
//   rationale: string
//   expectedOutcome: string
//   timeframe: string
//   category: string
// }

// export interface RiskAssessment {
//   riskLevel: "high" | "medium" | "low"
//   riskFactors: string[]
//   mitigationStrategies: string[]
//   potentialImpact: string
// }

// export interface OpportunityAnalysis {
//   opportunityLevel: "high" | "medium" | "low"
//   opportunities: string[]
//   actionItems: string[]
//   potentialValue: string
// }

// class ArchetypalAgentManager {
//   private agents: Map<string, ArchetypalAgent> = new Map()
//   private openai: any

//   constructor() {
//     const apiKey = getOpenAIApiKey()
//     if (apiKey) {
//       this.openai = createOpenAI({ apiKey })
//     }

//     this.initializeArchetypalAgents()
//     console.log("🎭 Archetypal Agent Manager initialized")
//   }

//   private initializeArchetypalAgents(): void {
//     const archetypalAgents: Omit<ArchetypalAgent, "thoughtHistory">[] = [
//       {
//         id: "security-agent",
//         name: "Security Agent",
//         type: "security",
//         personality: "Vigilant, risk-aware, and security-focused with a protective mindset",
//         expertise: [
//           "cybersecurity",
//           "data protection",
//           "vulnerability assessment",
//           "compliance",
//           "threat analysis",
//           "security best practices",
//         ],
//         analysisFramework: [
//           "threat_identification",
//           "vulnerability_assessment",
//           "risk_evaluation",
//           "compliance_check",
//           "security_recommendations",
//         ],
//         isActive: true,
//       },
//       {
//         id: "sales-agent",
//         name: "Sales Agent",
//         type: "sales",
//         personality: "Results-driven, customer-focused, and opportunity-oriented with persuasive communication",
//         expertise: [
//           "lead generation",
//           "customer acquisition",
//           "sales strategy",
//           "revenue optimization",
//           "customer relationship management",
//           "market penetration",
//         ],
//         analysisFramework: [
//           "lead_qualification",
//           "sales_opportunity_analysis",
//           "customer_needs_assessment",
//           "competitive_positioning",
//           "revenue_impact_evaluation",
//         ],
//         isActive: true,
//       },
//       {
//         id: "marketing-agent",
//         name: "Marketing Agent",
//         type: "marketing",
//         personality: "Creative, brand-conscious, and audience-focused with strategic communication skills",
//         expertise: [
//           "brand management",
//           "content strategy",
//           "audience analysis",
//           "campaign optimization",
//           "market research",
//           "digital marketing",
//         ],
//         analysisFramework: [
//           "audience_segmentation",
//           "brand_alignment_check",
//           "content_optimization",
//           "engagement_analysis",
//           "marketing_opportunity_identification",
//         ],
//         isActive: true,
//       },
//       {
//         id: "governance-agent",
//         name: "Governance Agent",
//         type: "governance",
//         personality: "Systematic, compliance-focused, and process-oriented with strong ethical standards",
//         expertise: [
//           "regulatory compliance",
//           "policy development",
//           "risk management",
//           "ethical guidelines",
//           "process optimization",
//           "stakeholder management",
//         ],
//         analysisFramework: [
//           "compliance_assessment",
//           "policy_alignment_check",
//           "stakeholder_impact_analysis",
//           "process_evaluation",
//           "governance_recommendations",
//         ],
//         isActive: true,
//       },
//     ]

//     archetypalAgents.forEach((agentData) => {
//       const agent: ArchetypalAgent = {
//         ...agentData,
//         thoughtHistory: [],
//       }
//       this.agents.set(agent.id, agent)
//     })

//     console.log(`✅ Initialized ${archetypalAgents.length} archetypal agents`)
//   }

//   /**
//    * Analyze user message with all active archetypal agents
//    */
//   async analyzeUserMessage(
//     userMessage: string,
//     assistantResponse: string,
//     conversationId: string,
//   ): Promise<ArchetypalThought[]> {
//     console.log("🎭 Analyzing user message with archetypal agents")
//     console.log(`📝 User message: ${userMessage.substring(0, 100)}...`)

//     const thoughts: ArchetypalThought[] = []
//     const activeAgents = Array.from(this.agents.values()).filter((agent) => agent.isActive)

//     for (const agent of activeAgents) {
//       try {
//         console.log(`🤔 ${agent.name} analyzing message...`)
//         const thought = await this.generateAgentThought(agent, userMessage, assistantResponse, conversationId)
//         thoughts.push(thought)

//         // Store in database
//         await databaseManager.storeConversationThought({
//           id: thought.id,
//           agentId: agent.id,
//           agentName: agent.name,
//           conversationId,
//           userPrompt: userMessage,
//           assistantResponse,
//           thoughtType: agent.type,
//           thoughtContent: thought.thoughtContent,
//           confidence: thought.confidence,
//           sentiment: this.determineSentiment(thought),
//           insights: thought.insights.map((i) => i.insight),
//           recommendations: thought.recommendations.map((r) => r.action),
//           metadata: thought.metadata,
//         })

//         console.log(`✅ ${agent.name} analysis complete (confidence: ${thought.confidence.toFixed(2)})`)
//       } catch (error) {
//         console.error(`❌ Error analyzing with ${agent.name}:`, error)
//       }
//     }

//     console.log(`🎯 Generated ${thoughts.length} archetypal thoughts`)
//     return thoughts
//   }

//   /**
//    * Generate thought for specific agent
//    */
//   private async generateAgentThought(
//     agent: ArchetypalAgent,
//     userMessage: string,
//     assistantResponse: string,
//     conversationId: string,
//   ): Promise<ArchetypalThought> {
//     const startTime = Date.now()

//     let thoughtContent = ""
//     let insights: AgentInsight[] = []
//     let recommendations: AgentRecommendation[] = []
//     let confidence = 0.7
//     let riskAssessment: RiskAssessment | undefined
//     let opportunityAnalysis: OpportunityAnalysis | undefined

//     if (this.openai) {
//       try {
//         const analysis = await this.generateAIAnalysis(agent, userMessage, assistantResponse)
//         thoughtContent = analysis.thoughtContent
//         insights = analysis.insights
//         recommendations = analysis.recommendations
//         confidence = analysis.confidence
//         riskAssessment = analysis.riskAssessment
//         opportunityAnalysis = analysis.opportunityAnalysis
//       } catch (error) {
//         console.error(`❌ Error generating AI analysis for ${agent.name}:`, error)
//         const fallback = this.generateFallbackAnalysis(agent, userMessage, assistantResponse)
//         thoughtContent = fallback.thoughtContent
//         insights = fallback.insights
//         recommendations = fallback.recommendations
//       }
//     } else {
//       const fallback = this.generateFallbackAnalysis(agent, userMessage, assistantResponse)
//       thoughtContent = fallback.thoughtContent
//       insights = fallback.insights
//       recommendations = fallback.recommendations
//     }

//     const thought: ArchetypalThought = {
//       id: `${agent.id}-${Date.now()}`,
//       agentId: agent.id,
//       agentName: agent.name,
//       agentType: agent.type,
//       userMessage,
//       assistantResponse,
//       thoughtContent,
//       insights,
//       recommendations,
//       riskAssessment,
//       opportunityAnalysis,
//       confidence,
//       priority: this.determinePriority(insights, recommendations),
//       timestamp: new Date(),
//       metadata: {
//         analysisTime: Date.now() - startTime,
//         keyFactors: this.extractKeyFactors(userMessage, agent.type),
//         confidenceFactors: this.getConfidenceFactors(userMessage, assistantResponse, agent.type),
//       },
//     }

//     // Add to agent's history
//     agent.thoughtHistory.push(thought)

//     return thought
//   }

//   /**
//    * Generate AI-powered analysis
//    */
//   private async generateAIAnalysis(
//     agent: ArchetypalAgent,
//     userMessage: string,
//     assistantResponse: string,
//   ): Promise<{
//     thoughtContent: string
//     insights: AgentInsight[]
//     recommendations: AgentRecommendation[]
//     confidence: number
//     riskAssessment?: RiskAssessment
//     opportunityAnalysis?: OpportunityAnalysis
//   }> {
//     const systemPrompt = `You are ${agent.name}, a ${agent.type} specialist with the following characteristics:

// Personality: ${agent.personality}
// Expertise: ${agent.expertise.join(", ")}
// Analysis Framework: ${agent.analysisFramework.join(", ")}

// Your role is to analyze user messages and assistant responses from your specialized perspective.
// Focus on your domain expertise and provide actionable insights and recommendations.

// Respond in JSON format:
// {
//   "thoughtContent": "Your detailed analysis and thoughts",
//   "insights": [
//     {
//       "category": "category_name",
//       "insight": "specific insight",
//       "impact": "high|medium|low",
//       "evidence": ["evidence1", "evidence2"],
//       "score": 0.0-1.0
//     }
//   ],
//   "recommendations": [
//     {
//       "priority": "high|medium|low",
//       "action": "specific action to take",
//       "rationale": "why this action is needed",
//       "expectedOutcome": "what result to expect",
//       "timeframe": "when to implement",
//       "category": "category of recommendation"
//     }
//   ],
//   "confidence": 0.0-1.0,
//   ${agent.type === "security" ? '"riskAssessment": {"riskLevel": "high|medium|low", "riskFactors": [], "mitigationStrategies": [], "potentialImpact": ""},' : ""}
//   ${agent.type !== "security" ? '"opportunityAnalysis": {"opportunityLevel": "high|medium|low", "opportunities": [], "actionItems": [], "potentialValue": ""}' : ""}
// }`

//     const prompt = `Analyze this conversation from your ${agent.type} perspective:

// USER MESSAGE: "${userMessage}"

// ASSISTANT RESPONSE: "${assistantResponse}"

// Consider:
// 1. What ${agent.type}-specific insights can you provide?
// 2. What risks or opportunities do you identify?
// 3. What recommendations would you make?
// 4. How confident are you in your analysis?

// Focus on your expertise areas: ${agent.expertise.join(", ")}
// Use your analysis framework: ${agent.analysisFramework.join(", ")}

// Provide your analysis in the specified JSON format.`

//     const { text } = await generateText({
//       model: this.openai("gpt-4o"),
//       system: systemPrompt,
//       prompt,
//     })

//     try {
//       const parsed = JSON.parse(text)
//       return {
//         thoughtContent: parsed.thoughtContent || "Analysis completed",
//         insights: parsed.insights || [],
//         recommendations: parsed.recommendations || [],
//         confidence: parsed.confidence || 0.7,
//         riskAssessment: parsed.riskAssessment,
//         opportunityAnalysis: parsed.opportunityAnalysis,
//       }
//     } catch (error) {
//       console.error("❌ Error parsing AI response:", error)
//       throw error
//     }
//   }

//   /**
//    * Generate fallback analysis when AI is not available
//    */
//   private generateFallbackAnalysis(
//     agent: ArchetypalAgent,
//     userMessage: string,
//     assistantResponse: string,
//   ): {
//     thoughtContent: string
//     insights: AgentInsight[]
//     recommendations: AgentRecommendation[]
//   } {
//     switch (agent.type) {
//       case "security":
//         return this.generateSecurityFallback(userMessage, assistantResponse)
//       case "sales":
//         return this.generateSalesFallback(userMessage, assistantResponse)
//       case "marketing":
//         return this.generateMarketingFallback(userMessage, assistantResponse)
//       case "governance":
//         return this.generateGovernanceFallback(userMessage, assistantResponse)
//       default:
//         return {
//           thoughtContent: `As ${agent.name}, I've analyzed the conversation and identified key areas for consideration.`,
//           insights: [],
//           recommendations: [],
//         }
//     }
//   }

//   private generateSecurityFallback(userMessage: string, assistantResponse: string) {
//     const hasSecurityTerms = /security|password|auth|token|encrypt|vulnerability|attack|breach/i.test(
//       userMessage + assistantResponse,
//     )
//     const hasCodeExamples = assistantResponse.includes("```")

//     return {
//       thoughtContent: `From a security perspective, I've identified ${hasSecurityTerms ? "security-relevant" : "general"} content that requires ${hasSecurityTerms ? "careful" : "standard"} security consideration. ${hasCodeExamples ? "Code examples present - security review recommended." : "No code examples detected."}`,
//       insights: [
//         {
//           category: "security_assessment",
//           insight: hasSecurityTerms
//             ? "Security-sensitive content detected"
//             : "General content with standard security considerations",
//           impact: hasSecurityTerms ? "high" : ("low" as const),
//           evidence: hasSecurityTerms ? ["Security keywords found"] : ["No security keywords detected"],
//           score: hasSecurityTerms ? 0.8 : 0.3,
//         },
//       ],
//       recommendations: [
//         {
//           priority: hasSecurityTerms ? "high" : ("medium" as const),
//           action: hasSecurityTerms ? "Conduct security review of recommendations" : "Apply standard security practices",
//           rationale: "Ensure security best practices are followed",
//           expectedOutcome: "Reduced security risk",
//           timeframe: "Immediate",
//           category: "security_compliance",
//         },
//       ],
//     }
//   }

//   private generateSalesFallback(userMessage: string, assistantResponse: string) {
//     const hasBuyingSignals = /buy|purchase|cost|price|budget|implement|solution|need/i.test(userMessage)
//     const responseLength = assistantResponse.length

//     return {
//       thoughtContent: `From a sales perspective, I've identified ${hasBuyingSignals ? "strong buying signals" : "informational needs"} in this conversation. The comprehensive response (${responseLength} characters) demonstrates ${responseLength > 500 ? "high" : "moderate"} engagement potential.`,
//       insights: [
//         {
//           category: "sales_opportunity",
//           insight: hasBuyingSignals
//             ? "Buying signals detected - potential sales opportunity"
//             : "Educational engagement - nurturing opportunity",
//           impact: hasBuyingSignals ? "high" : ("medium" as const),
//           evidence: hasBuyingSignals ? ["Buying intent keywords found"] : ["Information-seeking behavior"],
//           score: hasBuyingSignals ? 0.8 : 0.5,
//         },
//       ],
//       recommendations: [
//         {
//           priority: hasBuyingSignals ? "high" : ("medium" as const),
//           action: hasBuyingSignals
//             ? "Follow up with sales consultation offer"
//             : "Continue nurturing with valuable content",
//           rationale: "Capitalize on engagement and interest level",
//           expectedOutcome: hasBuyingSignals ? "Potential conversion" : "Increased brand trust",
//           timeframe: hasBuyingSignals ? "Within 24 hours" : "Ongoing",
//           category: "lead_development",
//         },
//       ],
//     }
//   }

//   private generateMarketingFallback(userMessage: string, assistantResponse: string) {
//     const hasEngagementIndicators = userMessage.length > 50
//     const hasDetailedResponse = assistantResponse.length > 300

//     return {
//       thoughtContent: `From a marketing perspective, this conversation shows ${hasEngagementIndicators ? "high" : "moderate"} user engagement with ${hasDetailedResponse ? "comprehensive" : "basic"} content delivery. This represents a ${hasEngagementIndicators && hasDetailedResponse ? "strong" : "moderate"} brand interaction opportunity.`,
//       insights: [
//         {
//           category: "brand_engagement",
//           insight: hasEngagementIndicators
//             ? "High user engagement - strong brand interaction"
//             : "Moderate engagement - standard interaction",
//           impact: hasEngagementIndicators ? "high" : ("medium" as const),
//           evidence: [`User message length: ${userMessage.length} characters`],
//           score: hasEngagementIndicators ? 0.8 : 0.5,
//         },
//       ],
//       recommendations: [
//         {
//           priority: hasEngagementIndicators ? "high" : ("medium" as const),
//           action: hasEngagementIndicators
//             ? "Create follow-up content series"
//             : "Optimize content for better engagement",
//           rationale: "Leverage engagement momentum for brand building",
//           expectedOutcome: "Increased brand awareness and loyalty",
//           timeframe: "Within 1 week",
//           category: "content_strategy",
//         },
//       ],
//     }
//   }

//   private generateGovernanceFallback(userMessage: string, assistantResponse: string) {
//     const hasComplianceTerms = /compliance|regulation|policy|legal|gdpr|privacy|audit/i.test(
//       userMessage + assistantResponse,
//     )
//     const hasProcessTerms = /process|procedure|workflow|standard|guideline/i.test(userMessage + assistantResponse)

//     return {
//       thoughtContent: `From a governance perspective, I've identified ${hasComplianceTerms ? "compliance-related" : "general"} content with ${hasProcessTerms ? "process implications" : "standard considerations"}. This requires ${hasComplianceTerms || hasProcessTerms ? "enhanced" : "standard"} governance oversight.`,
//       insights: [
//         {
//           category: "governance_assessment",
//           insight: hasComplianceTerms
//             ? "Compliance considerations identified"
//             : "Standard governance requirements apply",
//           impact: hasComplianceTerms ? "high" : ("medium" as const),
//           evidence: hasComplianceTerms ? ["Compliance keywords detected"] : ["General content assessment"],
//           score: hasComplianceTerms ? 0.8 : 0.4,
//         },
//       ],
//       recommendations: [
//         {
//           priority: hasComplianceTerms ? "high" : ("medium" as const),
//           action: hasComplianceTerms ? "Conduct compliance review" : "Apply standard governance practices",
//           rationale: "Ensure adherence to governance standards",
//           expectedOutcome: "Maintained compliance and reduced risk",
//           timeframe: hasComplianceTerms ? "Immediate" : "Standard timeline",
//           category: "compliance_management",
//         },
//       ],
//     }
//   }

//   private determineSentiment(thought: ArchetypalThought): "positive" | "neutral" | "negative" {
//     const highImpactInsights = thought.insights.filter((i) => i.impact === "high").length
//     const highPriorityRecommendations = thought.recommendations.filter((r) => r.priority === "high").length

//     if (thought.confidence > 0.8 && highImpactInsights > 0) return "positive"
//     if (thought.confidence < 0.5 || highPriorityRecommendations > 2) return "negative"
//     return "neutral"
//   }

//   private determinePriority(
//     insights: AgentInsight[],
//     recommendations: AgentRecommendation[],
//   ): "high" | "medium" | "low" {
//     const highImpactInsights = insights.filter((i) => i.impact === "high").length
//     const highPriorityRecommendations = recommendations.filter((r) => r.priority === "high").length

//     if (highImpactInsights > 0 || highPriorityRecommendations > 0) return "high"
//     if (insights.length > 2 || recommendations.length > 1) return "medium"
//     return "low"
//   }

//   private extractKeyFactors(userMessage: string, agentType: string): string[] {
//     const factors: string[] = []

//     switch (agentType) {
//       case "security":
//         if (/security|auth|password|token/i.test(userMessage)) factors.push("security_keywords")
//         if (/vulnerability|attack|breach/i.test(userMessage)) factors.push("threat_indicators")
//         break
//       case "sales":
//         if (/buy|purchase|cost|price/i.test(userMessage)) factors.push("buying_signals")
//         if (/need|solution|help/i.test(userMessage)) factors.push("pain_points")
//         break
//       case "marketing":
//         if (userMessage.length > 100) factors.push("high_engagement")
//         if (/brand|product|service/i.test(userMessage)) factors.push("brand_mentions")
//         break
//       case "governance":
//         if (/compliance|regulation|policy/i.test(userMessage)) factors.push("compliance_terms")
//         if (/process|procedure|workflow/i.test(userMessage)) factors.push("process_terms")
//         break
//     }

//     return factors
//   }

//   private getConfidenceFactors(userMessage: string, assistantResponse: string, agentType: string): string[] {
//     const factors: string[] = []

//     if (userMessage.length > 50) factors.push("detailed_user_input")
//     if (assistantResponse.length > 300) factors.push("comprehensive_response")
//     if (assistantResponse.includes("```")) factors.push("code_examples_present")

//     // Agent-specific confidence factors
//     switch (agentType) {
//       case "security":
//         if (/security|auth|encrypt/i.test(userMessage + assistantResponse)) factors.push("security_domain_match")
//         break
//       case "sales":
//         if (/solution|help|need/i.test(userMessage)) factors.push("sales_opportunity_indicators")
//         break
//       case "marketing":
//         if (/brand|marketing|content/i.test(userMessage + assistantResponse)) factors.push("marketing_domain_match")
//         break
//       case "governance":
//         if (/policy|compliance|process/i.test(userMessage + assistantResponse)) factors.push("governance_domain_match")
//         break
//     }

//     return factors
//   }

//   /**
//    * Get all archetypal agents
//    */
//   getArchetypalAgents(): ArchetypalAgent[] {
//     return Array.from(this.agents.values())
//   }

//   /**
//    * Get active archetypal agents
//    */
//   getActiveArchetypalAgents(): ArchetypalAgent[] {
//     return Array.from(this.agents.values()).filter((agent) => agent.isActive)
//   }

//   /**
//    * Get agent by ID
//    */
//   getArchetypalAgent(agentId: string): ArchetypalAgent | undefined {
//     return this.agents.get(agentId)
//   }

//   /**
//    * Set agent active status
//    */
//   setArchetypalAgentActive(agentId: string, isActive: boolean): void {
//     const agent = this.agents.get(agentId)
//     if (agent) {
//       agent.isActive = isActive
//       console.log(`${isActive ? "✅ Activated" : "⏸️ Deactivated"} archetypal agent: ${agent.name}`)
//     }
//   }

//   /**
//    * Get recent thoughts from all agents
//    */
//   getRecentArchetypalThoughts(limit = 20): ArchetypalThought[] {
//     const allThoughts: ArchetypalThought[] = []

//     for (const agent of this.agents.values()) {
//       allThoughts.push(...agent.thoughtHistory)
//     }

//     return allThoughts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit)
//   }

//   /**
//    * Get thoughts by agent type
//    */
//   getThoughtsByType(agentType: string, limit = 10): ArchetypalThought[] {
//     const agent = Array.from(this.agents.values()).find((a) => a.type === agentType)
//     return agent ? agent.thoughtHistory.slice(-limit) : []
//   }

//   /**
//    * Clear all agent histories
//    */
//   clearAllArchetypalHistories(): void {
//     for (const agent of this.agents.values()) {
//       agent.thoughtHistory = []
//     }
//     console.log("🧹 Cleared all archetypal agent histories")
//   }
// }

// // Export singleton instance
// export const archetypalAgentManager = new ArchetypalAgentManager()
