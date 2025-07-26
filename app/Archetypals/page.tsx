"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Bot,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Upload,
  FileText,
  Loader2,
  TestTube,
  Info,
  MessageSquare,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  generateAgentsFromConversation,
  uploadAgentFlowToAnythingLLM,
  testAnythingLLMConnection,
  fetchAndAnalyzeLatestConversation,
} from "@/lib/agent-generator"
import { isOpenAIConfigured, isAnythingLLMConfigured } from "@/lib/api-keys"

interface Agent {
  id: string
  name: string
  type: string
  description: string
  responsibilities: string[]
  conversationMapping: string[]
  status: "active" | "pending" | "offline"
  expertise: string[]
  personality: string
}

interface ConversationInsights {
  userNeeds: string[]
  responseGaps: string[]
  conversationPatterns: string[]
  recommendedAgentTypes: string[]
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [agenticFlow, setAgenticFlow] = useState<string>("")
  const [conversationInsights, setConversationInsights] = useState<ConversationInsights | null>(null)
  const [conversationData, setConversationData] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean
    message: string
    documentId?: string
    debugInfo?: any
  } | null>(null)
  const [connectionTest, setConnectionTest] = useState<{
    success: boolean
    message: string
    debugInfo?: any
  } | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const fetchLatestConversation = async () => {
    if (!isAnythingLLMConfigured()) {
      setError("AnythingLLM is not configured. Please configure it in the settings.")
      return
    }

    setIsFetching(true)
    setError(null)

    try {
      const { conversationData, analysis } = await fetchAndAnalyzeLatestConversation()
      setConversationData(conversationData)

      toast({
        title: "Conversation Fetched",
        description: "Successfully retrieved the latest conversation from AnythingLLM.",
      })

      console.log("📊 Conversation analysis:", analysis)
    } catch (error) {
      console.error("Error fetching conversation:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch conversation")
      toast({
        title: "Fetch Failed",
        description: error instanceof Error ? error.message : "Failed to fetch conversation",
        variant: "destructive",
      })
    } finally {
      setIsFetching(false)
    }
  }

  const generateAgents = async () => {
    if (!conversationData) {
      toast({
        title: "No Conversation Data",
        description: "Please fetch a conversation first before generating agents.",
        variant: "destructive",
      })
      return
    }

    if (!isOpenAIConfigured()) {
      setError("OpenAI API key is not configured. Please configure it in the settings.")
      return
    }

    setIsGenerating(true)
    setError(null)
    setProgress(0)

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
      const result = await generateAgentsFromConversation(conversationData)

      setProgress(100)
      setTimeout(() => {
        setAgents(result.agents)
        setAgenticFlow(result.agenticFlow)
        setConversationInsights(result.conversationInsights)
        setIsGenerating(false)

        toast({
          title: "Agents Generated",
          description: `Successfully generated ${result.agents.length} archetypal agents based on conversation analysis.`,
        })
      }, 500)
    } catch (error) {
      console.error("Error generating agents:", error)
      setError(error instanceof Error ? error.message : "Failed to generate agents")
      setIsGenerating(false)
      setProgress(100)

      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate agents",
        variant: "destructive",
      })
    }

    clearInterval(progressInterval)
  }

  const handleTestConnection = async () => {
    if (!isAnythingLLMConfigured()) {
      toast({
        title: "Configuration Required",
        description: "Please configure AnythingLLM API settings before testing.",
        variant: "destructive",
      })
      router.push("/settings")
      return
    }

    setIsTesting(true)
    setConnectionTest(null)

    try {
      const result = await testAnythingLLMConnection()
      setConnectionTest(result)

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to AnythingLLM API.",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Connection test failed"
      setConnectionTest({
        success: false,
        message: errorMessage,
      })
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleUploadToAnythingLLM = async () => {
    if (!isAnythingLLMConfigured()) {
      toast({
        title: "Configuration Required",
        description: "Please configure AnythingLLM API settings before uploading.",
        variant: "destructive",
      })
      router.push("/settings")
      return
    }

    if (!agents.length || !conversationInsights) {
      toast({
        title: "No Agents to Upload",
        description: "Please generate agents first before uploading.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadStatus(null)

    try {
      const result = await uploadAgentFlowToAnythingLLM(agenticFlow, agents, conversationInsights)
      setUploadStatus(result)

      if (result.success) {
        toast({
          title: "Upload Successful",
          description: "Conversation-based Agent System has been uploaded to AnythingLLM.",
        })
      } else {
        toast({
          title: "Upload Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload"
      setUploadStatus({
        success: false,
        message: errorMessage,
      })
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (error && !conversationData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/fetch-responses")}>
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Conversation-Based Agent Generation</h1>
                <p className="text-gray-600">Generate AI agents based on AnythingLLM conversation analysis</p>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Configuration Required</CardTitle>
              <CardDescription>An error occurred while setting up the agent generation system</CardDescription>
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
            <CardTitle>Generating Conversation-Based Agents</CardTitle>
            <CardDescription>Analyzing conversation patterns and creating specialized agents...</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-4" />
            <p className="text-sm text-gray-600 text-center">
              {progress < 30 && "Analyzing conversation patterns..."}
              {progress >= 30 && progress < 60 && "Identifying user needs and gaps..."}
              {progress >= 60 && progress < 90 && "Generating specialized agents..."}
              {progress >= 90 && "Finalizing agent configurations..."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Conversation-Based Agent Generation</h1>
        <p className="text-gray-600">
          Analyze conversations from AnythingLLM and generate specialized agents to improve future interactions
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-2">
          <Button onClick={fetchLatestConversation} disabled={isFetching} variant="outline">
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Fetch Latest Conversation
              </>
            )}
          </Button>
          <Button onClick={generateAgents} disabled={!conversationData || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Agents
              </>
            )}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleUploadToAnythingLLM} disabled={isUploading || !agents.length}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload to AnythingLLM
              </>
            )}
          </Button>
          {agents.length > 0 && (
            <Button onClick={() => router.push("/workflow")}>
              Create Workflow <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Connection Test Status */}
        {connectionTest && (
          <Alert className={`mb-6 ${connectionTest.success ? "border-green-200 bg-green-50" : ""}`}>
            <TestTube className="h-4 w-4" />
            <AlertTitle>{connectionTest.success ? "Connection Successful" : "Connection Failed"}</AlertTitle>
            <AlertDescription>
              {connectionTest.message}
              {connectionTest.debugInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Debug Information</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(connectionTest.debugInfo, null, 2)}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Status */}
        {uploadStatus && (
          <Alert className={`mb-6 ${uploadStatus.success ? "border-green-200 bg-green-50" : ""}`}>
            <FileText className="h-4 w-4" />
            <AlertTitle>{uploadStatus.success ? "Upload Successful" : "Upload Failed"}</AlertTitle>
            <AlertDescription>
              {uploadStatus.message}
              {uploadStatus.documentId && (
                <div className="mt-2 text-sm">
                  <strong>Document ID:</strong> {uploadStatus.documentId}
                </div>
              )}
              {uploadStatus.debugInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Debug Information</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(uploadStatus.debugInfo, null, 2)}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Info className="h-5 w-5 mr-2" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Fetch Latest Conversation" to retrieve the most recent conversation from AnythingLLM</li>
              <li>Review the conversation data and click "Generate Agents" to create specialized agents</li>
              <li>The AI will analyze the conversation to identify user needs, response gaps, and improvement areas</li>
              <li>Specialized agents will be generated with specific expertise to address these needs</li>
              <li>Upload the agent system back to AnythingLLM for future use</li>
            </ol>
          </CardContent>
        </Card>

        {/* Conversation Data Display */}
        {conversationData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-6 w-6 mr-2" />
                Analyzed Conversation
              </CardTitle>
              <CardDescription>Latest conversation fetched from AnythingLLM</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">{conversationData}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversation Insights */}
        {conversationInsights && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Conversation Analysis Insights</CardTitle>
              <CardDescription>Key findings from the conversation analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-green-700">User Needs Identified</h4>
                  <ul className="text-sm space-y-1">
                    {conversationInsights.userNeeds.map((need, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        {need}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-orange-700">Response Gaps Found</h4>
                  <ul className="text-sm space-y-1">
                    {conversationInsights.responseGaps.map((gap, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-600 mr-2">•</span>
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">Conversation Patterns</h4>
                  <ul className="text-sm space-y-1">
                    {conversationInsights.conversationPatterns.map((pattern, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-purple-700">Recommended Agent Types</h4>
                  <ul className="text-sm space-y-1">
                    {conversationInsights.recommendedAgentTypes.map((type, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        {type}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {agents.length > 0 && (
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
                    {agents.filter((a) => a.status === "active").length}
                  </div>
                  <div className="text-gray-600">Ready for Deployment</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {agents.reduce((acc, agent) => acc + agent.expertise.length, 0)}
                  </div>
                  <div className="text-gray-600">Expertise Areas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agentic Flow */}
        {agenticFlow && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Agent Interaction Flow</CardTitle>
              <CardDescription>How these agents will work together to improve conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{agenticFlow}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agents Grid */}
        {agents.length > 0 && (
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
                    <h4 className="font-semibold mb-2">Personality:</h4>
                    <p className="text-sm text-gray-600">{agent.personality}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Areas of Expertise:</h4>
                    <div className="flex flex-wrap gap-2">
                      {agent.expertise.map((exp, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>

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
                    <h4 className="font-semibold mb-2">Conversation Mapping:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {agent.conversationMapping.map((mapping, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          {mapping}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Next Steps */}
        {agents.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                Upload your conversation-based agents to AnythingLLM or proceed to create workflow orchestration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleTestConnection}
                  variant="outline"
                  disabled={isTesting}
                  className="flex-1 bg-transparent"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test AnythingLLM Connection
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleUploadToAnythingLLM}
                  variant="outline"
                  disabled={isUploading}
                  className="flex-1 bg-transparent"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading to AnythingLLM...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Agent System
                    </>
                  )}
                </Button>
                <Button onClick={() => router.push("/workflow")} className="flex-1">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Create Agentic Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
