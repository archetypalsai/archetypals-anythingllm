"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GitBranch, Play, Settings, CheckCircle, ArrowDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { generateWorkflowDescription } from "@/lib/workflow-generator"
import { isOpenAIConfigured } from "@/lib/api-keys"

interface WorkflowStep {
  id: string
  agent: string
  action: string
  description: string
  triggers: string[]
  outputs: string[]
  approvals?: string[]
}

export default function WorkflowPage() {
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([])
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [isGenerating, setIsGenerating] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    generateWorkflow()
  }, [])

  const generateWorkflow = async () => {
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
        return prev + 15
      })
    }, 400)

    try {
      const description = await generateWorkflowDescription()
      setWorkflowDescription(description)

      setProgress(100)
      setTimeout(() => {
        setWorkflow(sampleWorkflow)
        setIsGenerating(false)
      }, 500)
    } catch (error) {
      console.error("Error generating workflow:", error)
      setError(error instanceof Error ? error.message : "Failed to generate workflow")
      setWorkflow(sampleWorkflow)
      setWorkflowDescription(sampleDescription)
      setIsGenerating(false)
      setProgress(100)
    }

    clearInterval(progressInterval)
  }

  const sampleDescription = `The agentic workflow orchestrates four specialized agents to achieve your OKRs:

1. **SalesAgent** continuously monitors market conditions and recommends pricing updates based on competitive analysis and customer feedback.

2. **GovernanceAgent** receives pricing recommendations and evaluates them against compliance requirements, budget constraints, and strategic alignment before approval.

3. **MarketingAgent** launches targeted campaigns upon approval, coordinating messaging across channels while monitoring customer acquisition costs and engagement metrics.

4. **SecurityAgent** performs final compliance checks before campaign rollout, ensuring data privacy, security protocols, and regulatory adherence.

The workflow includes automated escalation paths, approval gates, and performance monitoring to ensure optimal execution of your revenue and growth objectives.`

  const sampleWorkflow: WorkflowStep[] = [
    {
      id: "step-1",
      agent: "SalesAgent",
      action: "Market Analysis & Pricing Recommendations",
      description:
        "Analyzes market conditions, competitor pricing, and customer feedback to recommend optimal pricing strategies.",
      triggers: ["Market data updates", "Customer feedback threshold", "Scheduled analysis"],
      outputs: ["Pricing recommendations", "Market analysis report", "Customer insights"],
    },
    {
      id: "step-2",
      agent: "GovernanceAgent",
      action: "Strategic Review & Approval",
      description:
        "Reviews pricing recommendations against strategic objectives, compliance requirements, and budget constraints.",
      triggers: ["Pricing recommendations from SalesAgent"],
      outputs: ["Approval/rejection decision", "Compliance assessment", "Strategic alignment score"],
      approvals: ["Budget impact assessment", "Regulatory compliance check", "Strategic alignment verification"],
    },
    {
      id: "step-3",
      agent: "MarketingAgent",
      action: "Campaign Execution",
      description: "Launches multi-channel marketing campaigns based on approved pricing and positioning strategies.",
      triggers: ["Approval from GovernanceAgent"],
      outputs: ["Campaign launch confirmation", "Channel activation status", "Initial performance metrics"],
    },
    {
      id: "step-4",
      agent: "SecurityAgent",
      action: "Compliance Validation",
      description: "Performs final security and compliance checks before full campaign rollout.",
      triggers: ["Campaign launch from MarketingAgent"],
      outputs: ["Security clearance", "Compliance certification", "Rollout authorization"],
      approvals: ["Data privacy verification", "Security protocol check", "Regulatory compliance confirmation"],
    },
  ]

  const sampleAgents = [
    {
      name: "SalesAgent",
      description: "Analyzes market conditions and recommends pricing updates.",
    },
    {
      name: "GovernanceAgent",
      description: "Reviews pricing recommendations against strategic objectives.",
    },
    {
      name: "MarketingAgent",
      description: "Launches multi-channel marketing campaigns.",
    },
    {
      name: "SecurityAgent",
      description: "Performs final security and compliance checks.",
    },
  ]

  // Add this function to store workflow data before navigating to deployment page
  const handleDeployWorkflow = () => {
    // Store workflow data in sessionStorage
    sessionStorage.setItem(
      "workflowData",
      JSON.stringify({
        agents: sampleAgents,
        workflow: workflow,
        description: workflowDescription,
      }),
    )

    // Navigate to deployment page
    router.push("/workflow/deploy")
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/agents")}>
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Workflow Generation</h1>
                <p className="text-gray-600">Generate AI workflow based on your agents</p>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>API Configuration Required</CardTitle>
              <CardDescription>An error occurred while generating workflow</CardDescription>
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
            <GitBranch className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <CardTitle>Generating Workflow</CardTitle>
            <CardDescription>Creating optimal agent interaction flow...</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-4" />
            <p className="text-sm text-gray-600 text-center">
              {progress < 25 && "Analyzing agent capabilities..."}
              {progress >= 25 && progress < 50 && "Mapping interaction patterns..."}
              {progress >= 50 && progress < 75 && "Defining decision logic..."}
              {progress >= 75 && progress < 90 && "Optimizing workflow efficiency..."}
              {progress >= 90 && "Finalizing orchestration..."}
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
          <h1 className="text-2xl font-bold text-gray-900">Agentic Workflow</h1>
          <p className="text-gray-600">AI-generated orchestration flow</p>
        </div>
        <Button onClick={handleDeployWorkflow}>
          Deploy Workflow <Play className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Workflow Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <GitBranch className="h-6 w-6 mr-2" />
              Workflow Description
            </CardTitle>
            <CardDescription>AI-generated description of your agentic workflow orchestration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {workflowDescription.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Workflow Steps</CardTitle>
            <CardDescription>Detailed breakdown of agent interactions and decision points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {workflow.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Step Card */}
                  <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{step.agent}</h3>
                          <p className="text-gray-600">{step.action}</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>

                    <p className="text-gray-700 mb-4">{step.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Triggers</h4>
                        <ul className="space-y-1">
                          {step.triggers.map((trigger, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start">
                              <span className="text-green-600 mr-2">▶</span>
                              {trigger}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Outputs</h4>
                        <ul className="space-y-1">
                          {step.outputs.map((output, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-600 mr-2">📤</span>
                              {output}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {step.approvals && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-900 mb-2">Approvals Required</h4>
                          <ul className="space-y-1">
                            {step.approvals.map((approval, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start">
                                <CheckCircle className="h-3 w-3 text-yellow-600 mr-2 mt-0.5" />
                                {approval}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow to next step */}
                  {index < workflow.length - 1 && (
                    <div className="flex justify-center my-4">
                      <ArrowDown className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Implementation Status */}
        <Card>
          <CardHeader>
            <CardTitle>AnythingLLM Implementation</CardTitle>
            <CardDescription>Ready to deploy this workflow to AnythingLLM orchestration engine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Implementation Features</h4>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Agent instantiation with defined tasks
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Workflow orchestration logic
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Decision gates and approval flows
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Performance monitoring hooks
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Deployment Options</h4>
                <div className="space-y-3">
                  <Button className="w-full" onClick={handleDeployWorkflow}>
                    <Play className="mr-2 h-4 w-4" />
                    Deploy to AnythingLLM
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Settings className="mr-2 h-4 w-4" />
                    Customize Workflow
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
