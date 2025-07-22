"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, CheckCircle, XCircle, Loader2, Settings, Bot, GitBranch } from "lucide-react"
import { useRouter } from "next/navigation"
import { getAnythingLLMClient, type DeploymentResult } from "@/lib/anything-llm-client"

export default function DeployPage() {
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null)
  const [deploymentProgress, setDeploymentProgress] = useState(0)
  const [workflowName, setWorkflowName] = useState("OKR Workflow")
  const [agents, setAgents] = useState<any[]>([])
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([])
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [apiConfigured, setApiConfigured] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check if API client is configured
    const client = getAnythingLLMClient()
    setApiConfigured(!!client)

    // Load workflow data from sessionStorage
    const workflowData = sessionStorage.getItem("workflowData")
    if (workflowData) {
      try {
        const data = JSON.parse(workflowData)
        setAgents(data.agents || [])
        setWorkflowSteps(data.workflow || [])
        setWorkflowDescription(data.description || "")
      } catch (error) {
        console.error("Failed to parse workflow data:", error)
        toast({
          title: "Error Loading Workflow",
          description: "Failed to load workflow data. Please go back and try again.",
          variant: "destructive",
        })
      }
    } else {
      // No workflow data found, redirect back to workflow page
      toast({
        title: "No Workflow Found",
        description: "Please create a workflow before attempting to deploy.",
        variant: "destructive",
      })
      router.push("/workflow")
    }
  }, [router, toast])

  const deployWorkflow = async () => {
    const client = getAnythingLLMClient()
    if (!client) {
      toast({
        title: "API Not Configured",
        description: "Please configure the AnythingLLM API settings before deploying.",
        variant: "destructive",
      })
      return
    }

    setIsDeploying(true)
    setDeploymentProgress(0)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setDeploymentProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 500)

    try {
      // Deploy the workflow
      const result = await client.deployWorkflow(agents, workflowSteps, workflowDescription, workflowName)

      setDeploymentResult(result)
      setDeploymentProgress(100)

      if (result.success) {
        toast({
          title: "Deployment Successful",
          description: "Your workflow has been successfully deployed to AnythingLLM.",
        })

        // Store the deployment ID for future reference
        sessionStorage.setItem("deploymentId", result.deploymentId || "")
      } else {
        toast({
          title: "Deployment Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      setDeploymentResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred during deployment",
        agents: [],
        errors: [error],
      })

      toast({
        title: "Deployment Error",
        description: "An error occurred while deploying your workflow.",
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setIsDeploying(false)
    }
  }

  if (!apiConfigured) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/workflow")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Deploy Workflow</h1>
                <p className="text-gray-600">Deploy your workflow to AnythingLLM</p>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>API Configuration Required</CardTitle>
              <CardDescription>
                You need to configure the AnythingLLM API before deploying your workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertTitle>API Not Configured</AlertTitle>
                <AlertDescription>
                  Please configure your AnythingLLM API settings to enable workflow deployment.
                </AlertDescription>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/workflow")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deploy Workflow</h1>
              <p className="text-gray-600">Deploy your workflow to AnythingLLM</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {isDeploying ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <CardTitle>Deploying Workflow</CardTitle>
              <CardDescription>Deploying your workflow to AnythingLLM...</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={deploymentProgress} className="mb-4" />
              <p className="text-sm text-gray-600 text-center">
                {deploymentProgress < 30 && "Preparing agents for deployment..."}
                {deploymentProgress >= 30 && deploymentProgress < 60 && "Creating agents in AnythingLLM..."}
                {deploymentProgress >= 60 && deploymentProgress < 90 && "Configuring workflow orchestration..."}
                {deploymentProgress >= 90 && "Finalizing deployment..."}
              </p>
            </CardContent>
          </Card>
        ) : deploymentResult ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                {deploymentResult.success ? (
                  <CheckCircle className="h-12 w-12 text-green-600" />
                ) : (
                  <XCircle className="h-12 w-12 text-red-600" />
                )}
              </div>
              <CardTitle className="text-center">
                {deploymentResult.success ? "Deployment Successful" : "Deployment Failed"}
              </CardTitle>
              <CardDescription className="text-center">{deploymentResult.message}</CardDescription>
            </CardHeader>
            <CardContent>
              {deploymentResult.success ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Deployment Details</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm mb-2">
                        <span className="font-medium">Deployment ID:</span> {deploymentResult.deploymentId}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Agents Deployed:</span> {deploymentResult.agents.length}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Deployed Agents</h3>
                    <div className="space-y-2">
                      {deploymentResult.agents.map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <Bot className="h-4 w-4 mr-2 text-blue-600" />
                            <span>{agent.name}</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">{agent.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => router.push("/dashboard")} className="flex-1">
                      Go to Dashboard
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/workflow")}>
                      Back to Workflow
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Deployment Error</AlertTitle>
                    <AlertDescription>{deploymentResult.message}</AlertDescription>
                  </Alert>

                  {deploymentResult.errors && deploymentResult.errors.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Error Details</h3>
                      <div className="bg-red-50 p-4 rounded-md overflow-auto max-h-40">
                        <pre className="text-xs text-red-800">{JSON.stringify(deploymentResult.errors, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => deployWorkflow()} className="flex-1">
                      Retry Deployment
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/settings")}>
                      Check API Settings
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Deployment Configuration</CardTitle>
                <CardDescription>Configure your workflow deployment to AnythingLLM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="workflow-name">Workflow Name</Label>
                    <Input
                      id="workflow-name"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      placeholder="Enter a name for your workflow"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Workflow Summary</Label>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Agents:</span>
                        <span>{agents.length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <GitBranch className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Workflow Steps:</span>
                        <span>{workflowSteps.length}</span>
                      </div>
                    </div>
                  </div>

                  <Button onClick={deployWorkflow} className="w-full">
                    Deploy to AnythingLLM
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Deployment Preview</CardTitle>
                <CardDescription>Preview of the agents and workflow to be deployed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Agents</h3>
                    <div className="space-y-2">
                      {agents.map((agent) => (
                        <div key={agent.id} className="flex items-center p-3 bg-gray-50 rounded-md">
                          <Bot className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{agent.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Workflow Steps</h3>
                    <div className="space-y-2">
                      {workflowSteps.map((step, index) => (
                        <div key={step.id} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold mr-2">
                              {index + 1}
                            </div>
                            <span className="font-medium">{step.agent}:</span>
                            <span className="ml-2">{step.action}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
