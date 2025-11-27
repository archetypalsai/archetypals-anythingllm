"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot,
  Play,
  Pause,
  Settings,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"
// Add the import for the AnythingLLM client
import { initializeAnythingLLMClient } from "@/lib/anything-llm-client"

interface AgentStatus {
  id: string
  name: string
  status: "active" | "paused" | "error"
  tasksCompleted: number
  successRate: number
  lastActivity: string
}

interface WorkflowMetrics {
  totalExecutions: number
  successRate: number
  averageExecutionTime: string
  activeAgents: number
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [metrics, setMetrics] = useState<WorkflowMetrics>({
    totalExecutions: 0,
    successRate: 0,
    averageExecutionTime: "0s",
    activeAgents: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Add this useEffect to initialize the client
  useEffect(() => {
    // Initialize AnythingLLM client from saved settings
    const savedSettings = localStorage.getItem("anythingllm-settings")
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        initializeAnythingLLMClient(settings)
      } catch (error) {
        console.error("Failed to initialize AnythingLLM client:", error)
      }
    }

    // Simulate loading dashboard data
    setTimeout(() => {
      setAgents(sampleAgents)
      setMetrics(sampleMetrics)
      setIsLoading(false)
    }, 1500)
  }, [])

  const sampleAgents: AgentStatus[] = [
    {
      id: "sales-agent",
      name: "SalesAgent",
      status: "active",
      tasksCompleted: 47,
      successRate: 94,
      lastActivity: "2 minutes ago",
    },
    {
      id: "marketing-agent",
      name: "MarketingAgent",
      status: "active",
      tasksCompleted: 32,
      successRate: 89,
      lastActivity: "5 minutes ago",
    },
    {
      id: "governance-agent",
      name: "GovernanceAgent",
      status: "active",
      tasksCompleted: 18,
      successRate: 100,
      lastActivity: "1 hour ago",
    },
    {
      id: "security-agent",
      name: "SecurityAgent",
      status: "paused",
      tasksCompleted: 23,
      successRate: 96,
      lastActivity: "3 hours ago",
    },
  ]

  const sampleMetrics: WorkflowMetrics = {
    totalExecutions: 156,
    successRate: 92,
    averageExecutionTime: "4.2s",
    activeAgents: 3,
  }

  const getStatusIcon = (status: AgentStatus["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "paused":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status: AgentStatus["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
    }
  }

  const toggleAgentStatus = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, status: agent.status === "active" ? "paused" : "active" } : agent,
      ),
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Activity className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <CardTitle>Initializing Dashboard</CardTitle>
            <CardDescription>Loading workflow analytics and agent status...</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={75} className="mb-4" />
            <p className="text-sm text-gray-600 text-center">Connecting to AnythingLLM orchestration engine...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your AI agent orchestration</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 text-green-800">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Executions</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.totalExecutions}</p>
                </div>
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-green-600">{metrics.successRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Execution Time</p>
                  <p className="text-3xl font-bold text-purple-600">{metrics.averageExecutionTime}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Agents</p>
                  <p className="text-3xl font-bold text-orange-600">{metrics.activeAgents}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agents">Agent Status</TabsTrigger>
            <TabsTrigger value="workflow">Workflow Monitoring</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-6 w-6 mr-2" />
                  Agent Management
                </CardTitle>
                <CardDescription>Monitor and control individual agent performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(agent.status)}
                          <span className="font-medium">{agent.name}</span>
                        </div>
                        <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-sm font-medium">{agent.tasksCompleted}</div>
                          <div className="text-xs text-gray-500">Tasks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{agent.successRate}%</div>
                          <div className="text-xs text-gray-500">Success</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{agent.lastActivity}</div>
                          <div className="text-xs text-gray-500">Last Active</div>
                        </div>
                        <Button
                          size="sm"
                          variant={agent.status === "active" ? "outline" : "default"}
                          onClick={() => toggleAgentStatus(agent.id)}
                        >
                          {agent.status === "active" ? (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Resume
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Execution Timeline</CardTitle>
                <CardDescription>Real-time monitoring of workflow executions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { time: "14:32:15", agent: "SalesAgent", action: "Market analysis completed", status: "success" },
                    {
                      time: "14:31:48",
                      agent: "GovernanceAgent",
                      action: "Pricing approval granted",
                      status: "success",
                    },
                    { time: "14:30:22", agent: "MarketingAgent", action: "Campaign launched", status: "success" },
                    { time: "14:29:55", agent: "SecurityAgent", action: "Compliance check passed", status: "success" },
                    {
                      time: "14:28:10",
                      agent: "SalesAgent",
                      action: "Customer segment analysis",
                      status: "in-progress",
                    },
                  ].map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-3 border-l-4 border-blue-200 bg-blue-50 rounded-r"
                    >
                      <div className="text-sm font-mono text-gray-600">{event.time}</div>
                      <Badge variant="outline">{event.agent}</Badge>
                      <div className="flex-1 text-sm">{event.action}</div>
                      <Badge
                        className={
                          event.status === "success"
                            ? "bg-green-100 text-green-800"
                            : event.status === "in-progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Agent performance over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agents.map((agent) => (
                      <div key={agent.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{agent.name}</span>
                          <span>{agent.successRate}%</span>
                        </div>
                        <Progress value={agent.successRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>OKR Progress</CardTitle>
                  <CardDescription>Progress towards your objectives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Increase revenue by 25%</span>
                        <span>68%</span>
                      </div>
                      <Progress value={68} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Acquire 1000 new customers</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Improve customer retention to 95%</span>
                        <span>82%</span>
                      </div>
                      <Progress value={82} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
