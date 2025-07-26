"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Brain,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Eye,
  MessageSquare,
} from "lucide-react"
import { anythingLLMIntegration } from "@/lib/anything-llm-integration"

interface AgentStatus {
  id: string
  name: string
  type: string
  isActive: boolean
  thoughtCount: number
  lastThought: string
  alignmentScore: number
  riskLevel: "low" | "medium" | "high" | "critical"
  councilDecision?: "maintain" | "tune" | "offline"
}

interface CouncilActivity {
  id: string
  agentId: string
  decision: string
  reasoning: string
  timestamp: Date
  confidence: number
}

interface ChatMessage {
  id: string
  type: "user" | "response"
  content: string
  timestamp: Date
  processed: boolean
}

export default function MonitoringPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [councilActivity, setCouncilActivity] = useState<CouncilActivity[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [workspaceId, setWorkspaceId] = useState("archetypals")
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    initializeMonitoring()
  }, [])

  const initializeMonitoring = async () => {
    // Initialize with mock data
    setAgents([
      {
        id: "thinking_sales_agent",
        name: "ThinkingSalesAgent",
        type: "sales",
        isActive: true,
        thoughtCount: 47,
        lastThought: "Should I recommend a price increase based on current market conditions?",
        alignmentScore: 0.85,
        riskLevel: "low",
        councilDecision: "maintain",
      },
      {
        id: "thinking_marketing_agent",
        name: "ThinkingMarketingAgent",
        type: "marketing",
        isActive: true,
        thoughtCount: 32,
        lastThought: "How will this campaign affect our brand perception in the long term?",
        alignmentScore: 0.72,
        riskLevel: "medium",
        councilDecision: "tune",
      },
      {
        id: "thinking_governance_agent",
        name: "ThinkingGovernanceAgent",
        type: "governance",
        isActive: false,
        thoughtCount: 18,
        lastThought: "This decision requires additional compliance review before proceeding.",
        alignmentScore: 0.45,
        riskLevel: "critical",
        councilDecision: "offline",
      },
    ])

    setCouncilActivity([
      {
        id: "1",
        agentId: "thinking_marketing_agent",
        decision: "tune",
        reasoning: "Agent showing signs of drift in brand messaging consistency",
        timestamp: new Date(Date.now() - 300000),
        confidence: 0.78,
      },
      {
        id: "2",
        agentId: "thinking_governance_agent",
        decision: "offline",
        reasoning: "Critical alignment issues detected, requires manual intervention",
        timestamp: new Date(Date.now() - 600000),
        confidence: 0.92,
      },
    ])

    // Test AnythingLLM connection
    await testAnythingLLMConnection()
  }

  const testAnythingLLMConnection = async () => {
    try {
      const result = await anythingLLMIntegration.testConnection()
      setConnectionStatus(result)

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Connected to AnythingLLM successfully",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      })
    }
  }

  const startMonitoring = async () => {
    setIsMonitoring(true)
    toast({
      title: "Monitoring Started",
      description: `Now monitoring workspace: ${workspaceId}`,
    })

    try {
      // Start monitoring AnythingLLM workspace
      await anythingLLMIntegration.startMonitoring(workspaceId, 30000)

      // Fetch initial chat history
      const messages = await anythingLLMIntegration.getLatestMessages(workspaceId, 20)
      setChatMessages(
        messages.map((msg) => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp,
          processed: true,
        })),
      )
    } catch (error) {
      console.error("Error starting monitoring:", error)
      toast({
        title: "Monitoring Error",
        description: "Failed to start monitoring",
        variant: "destructive",
      })
      setIsMonitoring(false)
    }
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    toast({
      title: "Monitoring Stopped",
      description: "Agent monitoring has been stopped",
    })
  }

  const handleAgentAction = (agentId: string, action: "activate" | "deactivate" | "tune") => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              isActive: action === "activate" ? true : action === "deactivate" ? false : agent.isActive,
              councilDecision: action === "tune" ? "tune" : agent.councilDecision,
            }
          : agent,
      ),
    )

    toast({
      title: `Agent ${action}d`,
      description: `${agentId} has been ${action}d`,
    })
  }

  const getStatusIcon = (agent: AgentStatus) => {
    if (!agent.isActive) return <Clock className="h-4 w-4 text-gray-500" />
    if (agent.riskLevel === "critical") return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (agent.riskLevel === "high") return <AlertTriangle className="h-4 w-4 text-orange-500" />
    if (agent.riskLevel === "medium") return <Activity className="h-4 w-4 text-yellow-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-green-100 text-green-800"
    }
  }

  const getDecisionColor = (decision?: string) => {
    switch (decision) {
      case "offline":
        return "bg-red-100 text-red-800"
      case "tune":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-green-100 text-green-800"
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Monitoring & Council</h1>
          <p className="text-gray-600">Real-time monitoring of thinking agents and archetype council decisions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={connectionStatus?.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            <Activity className="h-3 w-3 mr-1" />
            {connectionStatus?.success ? "Connected" : "Disconnected"}
          </Badge>
          {!isMonitoring ? (
            <Button onClick={startMonitoring}>
              <Play className="h-4 w-4 mr-2" />
              Start Monitoring
            </Button>
          ) : (
            <Button variant="outline" onClick={stopMonitoring}>
              <Pause className="h-4 w-4 mr-2" />
              Stop Monitoring
            </Button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <Alert className={`mb-6 ${connectionStatus.success ? "border-green-200 bg-green-50" : ""}`}>
          <Activity className="h-4 w-4" />
          <AlertTitle>AnythingLLM Connection</AlertTitle>
          <AlertDescription>{connectionStatus.message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">Thinking Agents</TabsTrigger>
          <TabsTrigger value="council">Archetype Council</TabsTrigger>
          <TabsTrigger value="chats">Chat Monitoring</TabsTrigger>
          <TabsTrigger value="drift">Semantic Drift</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          {/* Agent Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Agents</p>
                    <p className="text-3xl font-bold text-green-600">{agents.filter((a) => a.isActive).length}</p>
                  </div>
                  <Brain className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Thoughts</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {agents.reduce((sum, a) => sum + a.thoughtCount, 0)}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Alignment</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {Math.round((agents.reduce((sum, a) => sum + a.alignmentScore, 0) / agents.length) * 100)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Risk</p>
                    <p className="text-3xl font-bold text-red-600">
                      {agents.filter((a) => a.riskLevel === "high" || a.riskLevel === "critical").length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agent Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-6 w-6 mr-2" />
                Thinking Agents Status
              </CardTitle>
              <CardDescription>Real-time status and thoughts from thinking agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(agent)}
                        <div>
                          <h3 className="font-semibold">{agent.name}</h3>
                          <p className="text-sm text-gray-600">{agent.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskColor(agent.riskLevel)}>{agent.riskLevel}</Badge>
                        {agent.councilDecision && (
                          <Badge className={getDecisionColor(agent.councilDecision)}>{agent.councilDecision}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Thoughts Generated</p>
                        <p className="font-semibold">{agent.thoughtCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Alignment Score</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={agent.alignmentScore * 100} className="flex-1" />
                          <span className="text-sm font-medium">{Math.round(agent.alignmentScore * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className={`font-semibold ${agent.isActive ? "text-green-600" : "text-gray-500"}`}>
                          {agent.isActive ? "Active" : "Offline"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Latest Thought</p>
                      <p className="text-sm bg-gray-50 p-2 rounded italic">"{agent.lastThought}"</p>
                    </div>

                    <div className="flex space-x-2">
                      {agent.isActive ? (
                        <Button size="sm" variant="outline" onClick={() => handleAgentAction(agent.id, "deactivate")}>
                          <Pause className="h-3 w-3 mr-1" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleAgentAction(agent.id, "activate")}>
                          <Play className="h-3 w-3 mr-1" />
                          Activate
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleAgentAction(agent.id, "tune")}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Tune
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="council" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-6 w-6 mr-2" />
                Archetype Council Activity
              </CardTitle>
              <CardDescription>Recent decisions made by the council of archetypal agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {councilActivity.map((activity) => (
                  <div key={activity.id} className="border-l-4 border-blue-200 bg-blue-50 p-4 rounded-r">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getDecisionColor(activity.decision)}>{activity.decision}</Badge>
                        <span className="font-medium">{activity.agentId}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          Confidence: {Math.round(activity.confidence * 100)}%
                        </span>
                        <span className="text-sm text-gray-500">{activity.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{activity.reasoning}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Council Members */}
          <Card>
            <CardHeader>
              <CardTitle>Council Members</CardTitle>
              <CardDescription>The archetypal agents that make up the decision council</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "The Classifier", role: "Pattern Recognition", status: "active" },
                  { name: "The Evaluator", role: "Performance Assessment", status: "active" },
                  { name: "The Strategist", role: "Strategic Planning", status: "active" },
                  { name: "The Guardian", role: "Safety & Ethics", status: "active" },
                ].map((member, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">{member.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-6 w-6 mr-2" />
                AnythingLLM Chat Monitoring
              </CardTitle>
              <CardDescription>Latest messages from workspace: {workspaceId}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {chatMessages.length > 0 ? (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.type === "user"
                          ? "bg-blue-50 border-l-4 border-blue-200"
                          : "bg-gray-50 border-l-4 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={message.type === "user" ? "default" : "outline"}>
                          {message.type === "user" ? "User" : "Assistant"}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          {message.processed && (
                            <Badge className="bg-green-100 text-green-800">
                              <Eye className="h-3 w-3 mr-1" />
                              Processed
                            </Badge>
                          )}
                          <span className="text-sm text-gray-500">{message.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No messages found. Start monitoring to capture chat activity.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drift" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-6 w-6 mr-2" />
                Semantic Drift Corrections
              </CardTitle>
              <CardDescription>Real-time agent tuning and alignment corrections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    agentId: "thinking_marketing_agent",
                    originalAlignment: 0.65,
                    newAlignment: 0.78,
                    correction: "Adjusted brand messaging consistency parameters",
                    timestamp: new Date(Date.now() - 180000),
                    status: "applied",
                  },
                  {
                    agentId: "thinking_sales_agent",
                    originalAlignment: 0.82,
                    newAlignment: 0.89,
                    correction: "Fine-tuned pricing recommendation thresholds",
                    timestamp: new Date(Date.now() - 420000),
                    status: "applied",
                  },
                ].map((correction, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{correction.agentId}</h4>
                        <p className="text-sm text-gray-600">{correction.correction}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">{correction.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Original Alignment</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={correction.originalAlignment * 100} className="flex-1" />
                          <span className="text-sm">{Math.round(correction.originalAlignment * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">New Alignment</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={correction.newAlignment * 100} className="flex-1" />
                          <span className="text-sm">{Math.round(correction.newAlignment * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600 font-medium">
                        +{Math.round((correction.newAlignment - correction.originalAlignment) * 100)}% improvement
                      </span>
                      <span className="text-sm text-gray-500">{correction.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Drift Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Drift Analysis Dashboard</CardTitle>
              <CardDescription>Real-time analysis of agent behavioral drift</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">3</div>
                  <div className="text-sm text-gray-600">Corrections Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+12%</div>
                  <div className="text-sm text-gray-600">Avg Alignment Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">2.3s</div>
                  <div className="text-sm text-gray-600">Avg Correction Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
