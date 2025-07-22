"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bot, Users, ArrowRight, CheckCircle, Clock, AlertCircle, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { generateAgentsFromOKRs } from "@/lib/agent-generator"
import { isOpenAIConfigured } from "@/lib/api-keys"

interface Agent {
  id: string
  name: string
  type: string
  description: string
  responsibilities: string[]
  okrMapping: string[]
  status: "generated" | "configuring" | "ready"
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isGenerating, setIsGenerating] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    generateAgents()
  }, [])

  const generateAgents = async () => {
    // Check if OpenAI API key is configured
    if (!isOpenAIConfigured()) {
      setError("OpenAI API key is not configured. Please configure it in the settings.")
      setIsGenerating(false)
      return
    }

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 300)

    try {
      // Get OKR data from sessionStorage
      const okrData = sessionStorage.getItem("okrData")
      const parsedOKRData = okrData ? JSON.parse(okrData) : null

      const generatedAgents = await generateAgentsFromOKRs(parsedOKRData?.content || "Sample OKRs")

      setProgress(100)
      setTimeout(() => {
        setAgents(generatedAgents)
        setIsGenerating(false)
      }, 500)
    } catch (error) {
      console.error("Error generating agents:", error)
      // Set error message
      setError(error instanceof Error ? error.message : "Failed to generate agents")
      // Fallback to sample data
      setAgents(sampleAgents)
      setIsGenerating(false)
      setProgress(100)
    }

    clearInterval(progressInterval)
  }

  const sampleAgents: Agent[] = [
    {
      id: "sales-agent",
      name: "SalesAgent",
      type: "Revenue Generation",
      description: "Focuses on customer acquisition, pricing optimization, and revenue growth strategies.",
      responsibilities: [
        "Monitor sales pipeline and conversion rates",
        "Recommend pricing adjustments based on market data",
        "Identify high-value customer segments",
        "Coordinate with marketing for lead generation",
      ],
      okrMapping: ["Increase revenue by 25%", "Acquire 1000 new customers"],
      status: "ready",
    },
    {
      id: "marketing-agent",
      name: "MarketingAgent",
      type: "Brand & Growth",
      description: "Manages campaign execution, brand positioning, and customer engagement strategies.",
      responsibilities: [
        "Execute multi-channel marketing campaigns",
        "Monitor brand sentiment and engagement",
        "Optimize customer acquisition costs",
        "Coordinate product launch communications",
      ],
      okrMapping: ["Launch 3 new product features", "Improve customer retention to 95%"],
      status: "ready",
    },
    {
      id: "governance-agent",
      name: "GovernanceAgent",
      type: "Compliance & Risk",
      description: "Ensures regulatory compliance, risk management, and approval workflows.",
      responsibilities: [
        "Review and approve strategic initiatives",
        "Monitor compliance with regulations",
        "Assess risk factors for new projects",
        "Maintain audit trails and documentation",
      ],
      okrMapping: ["Enhance operational efficiency", "Reduce compliance risks by 40%"],
      status: "ready",
    },
    {
      id: "security-agent",
      name: "SecurityAgent",
      type: "Security & Privacy",
      description: "Monitors security protocols, data privacy, and threat detection.",
      responsibilities: [
        "Conduct security assessments for new features",
        "Monitor data privacy compliance",
        "Detect and respond to security threats",
        "Validate security protocols before rollouts",
      ],
      okrMapping: ["Improve system security score to 95%", "Zero security incidents"],
      status: "ready",
    },
  ]

  const getStatusIcon = (status: Agent["status"]) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "configuring":
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800"
      case "configuring":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/upload")}>
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agent Generation</h1>
                <p className="text-gray-600">Generate AI agents based on your OKRs</p>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>API Configuration Required</CardTitle>
              <CardDescription>An error occurred while generating agents</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Configure API Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>Generating AI Agents</CardTitle>
            <CardDescription>Analyzing your OKRs and creating archetypal agents...</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-4" />
            <p className="text-sm text-gray-600 text-center">
              {progress < 30 && "Parsing OKR structure..."}
              {progress >= 30 && progress < 60 && "Identifying key objectives..."}
              {progress >= 60 && progress < 90 && "Generating agent archetypes..."}
              {progress >= 90 && "Finalizing agent configurations..."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generated Agents</h1>
          <p className="text-gray-600">AI-generated archetypal agents based on your OKRs</p>
        </div>
        <Button onClick={() => router.push("/workflow")}>
          Create Workflow <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-6 w-6 mr-2" />
              Agent Generation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{agents.length}</div>
                <div className="text-gray-600">Agents Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {agents.filter((a) => a.status === "ready").length}
                </div>
                <div className="text-gray-600">Ready for Deployment</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {agents.reduce((acc, agent) => acc + agent.okrMapping.length, 0)}
                </div>
                <div className="text-gray-600">OKRs Mapped</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Bot className="h-5 w-5 mr-2 text-blue-600" />
                      {agent.name}
                    </CardTitle>
                    <CardDescription>{agent.type}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(agent.status)}
                    <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{agent.description}</p>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Key Responsibilities:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {agent.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {responsibility}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Mapped OKRs:</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.okrMapping.map((okr, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {okr}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Your agents are ready! Proceed to create the workflow orchestration.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => router.push("/workflow")} className="flex-1">
                <ArrowRight className="mr-2 h-4 w-4" />
                Create Agentic Workflow
              </Button>
              <Button variant="outline" onClick={() => router.push("/upload")}>
                Upload Different OKRs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
