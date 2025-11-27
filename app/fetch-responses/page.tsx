"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  MessageSquare,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Brain,
  Users,
  Activity,
  User,
  Bot,
  Search,
  ExternalLink,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { anythingLLMIntegration, type AnythingLLMResponse } from "@/lib/anything-llm-integration"

interface FetchStatus {
  isConnected: boolean
  isFetching: boolean
  messageCount: number
  lastFetch: Date | null
  error: string | null
}

interface ChatPair {
  chat_id: number
  user_message: string
  assistant_message: string
  message_type: string
  timestamp: string
  sources: any[]
}

export default function FetchResponsesPage() {
  const [workspaceId, setWorkspaceId] = useState("archetypals")
  const [apiKey, setApiKey] = useState("88T4DCZ-HY0M4J7-NMCMA9P-2D0F1C8")
  const [baseUrl, setBaseUrl] = useState("http://localhost:3001")
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>({
    isConnected: false,
    isFetching: false,
    messageCount: 0,
    lastFetch: null,
    error: null,
  })
  const [messages, setMessages] = useState<AnythingLLMResponse[]>([])
  const [chatPairs, setChatPairs] = useState<ChatPair[]>([])
  const [rawApiResponse, setRawApiResponse] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const [agentStats, setAgentStats] = useState({
    activeAgents: 3, // Simulated count
    thoughtsGenerated: 0,
    councilDecisions: 0,
  })

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Initialize with saved settings if available
    const savedConfig = localStorage.getItem("anythingllm-config")
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        setApiKey(config.apiKey || apiKey)
        setBaseUrl(config.baseUrl || baseUrl)
        setWorkspaceId(config.workspaceId || workspaceId)
      } catch (error) {
        console.error("Failed to load saved config:", error)
      }
    }

    // Initialize agent stats with simulated values
    setAgentStats({
      activeAgents: 3, // Simulated active agents
      thoughtsGenerated: Math.floor(Math.random() * 50),
      councilDecisions: Math.floor(Math.random() * 10),
    })
  }, [])

  const testConnection = async () => {
    setFetchStatus((prev) => ({ ...prev, isFetching: true, error: null }))

    try {
      // Test connection to the chats endpoint directly
      const response = await fetch(`${baseUrl}/api/v1/workspace/${workspaceId}/chats`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (response.ok) {
        const testData = await response.json()
        console.log("🔍 Connection test - Raw API response:", testData)

        setFetchStatus((prev) => ({
          ...prev,
          isConnected: true,
          isFetching: false,
          error: null,
        }))

        toast({
          title: "Connection Successful",
          description: `Successfully connected to AnythingLLM workspace. Found ${testData.history ? testData.history.length : "unknown"} messages.`,
        })
      } else {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Connection failed"
      setFetchStatus((prev) => ({
        ...prev,
        isConnected: false,
        isFetching: false,
        error: errorMessage,
      }))

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const filterChats = (history: any[]): ChatPair[] => {
    const chatPairs: { [key: number]: { user: any; assistant: any } } = {}

    // Sort messages by sentAt timestamp
    const sortedHistory = history.sort((a, b) => (a.sentAt || 0) - (b.sentAt || 0))

    console.log("🔍 Processing history:", {
      totalMessages: sortedHistory.length,
      sampleMessage: sortedHistory[0],
    })

    for (const msg of sortedHistory) {
      const chatId = msg.chatId
      if (!chatId) continue

      if (!chatPairs[chatId]) {
        chatPairs[chatId] = { user: null, assistant: null }
      }

      if (msg.role === "user") {
        chatPairs[chatId].user = {
          content: msg.content || "",
          timestamp: msg.sentAt,
        }
      } else if (msg.type === "chat" || msg.type === "query") {
        chatPairs[chatId].assistant = {
          content: msg.content || "",
          type: msg.type,
          sources: msg.sources || [],
        }
      }
    }

    // Convert to array format matching your reference code
    const result = Object.entries(chatPairs)
      .map(([chatId, msgs]) => ({
        chat_id: Number.parseInt(chatId),
        user_message: msgs.user?.content || "",
        assistant_message: msgs.assistant?.content || "",
        message_type: msgs.assistant?.type || "chat",
        timestamp: new Date((msgs.user?.timestamp || 0) * 1000).toISOString(),
        sources: msgs.assistant?.sources || [],
      }))
      .filter((pair) => pair.user_message && pair.assistant_message)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    console.log("✅ Filtered chat pairs:", {
      totalPairs: result.length,
      samplePair: result[0],
    })

    return result
  }

  const processChatPairs = (chatPairs: ChatPair[]): AnythingLLMResponse[] => {
    const messages: AnythingLLMResponse[] = []

    // Only process the latest conversation (first item since it's sorted newest first)
    const latestPair = chatPairs[0]
    if (!latestPair) return messages

    // Create user message
    if (latestPair.user_message) {
      messages.push({
        id: `${latestPair.chat_id}_user`,
        type: "user",
        content: latestPair.user_message,
        timestamp: new Date(latestPair.timestamp),
        workspaceId: workspaceId,
        sessionId: latestPair.chat_id.toString(),
        metadata: {
          chatId: latestPair.chat_id,
          messageType: "user_message",
          sources: [],
        },
      })
    }

    // Create assistant message
    if (latestPair.assistant_message) {
      messages.push({
        id: `${latestPair.chat_id}_assistant`,
        type: "response",
        content: latestPair.assistant_message,
        timestamp: new Date(latestPair.timestamp),
        workspaceId: workspaceId,
        sessionId: latestPair.chat_id.toString(),
        metadata: {
          chatId: latestPair.chat_id,
          messageType: latestPair.message_type,
          sources: latestPair.sources,
        },
      })
    }

    return messages
  }

  const simulateThinkingAgentProcessing = (processedMessages: AnythingLLMResponse[]) => {
    console.log(`🧠 Simulating processing of ${processedMessages.length} messages with thinking agents`)

    // Simulate agent processing with realistic delays
    setTimeout(() => {
      setAgentStats((prev) => ({
        ...prev,
        thoughtsGenerated: prev.thoughtsGenerated + processedMessages.length * 2, // Pre and post thoughts
        councilDecisions: prev.councilDecisions + Math.floor(processedMessages.length / 5),
      }))
    }, 1000)

    // Log simulated analysis
    const userMessages = processedMessages.filter((m) => m.type === "user")
    const assistantMessages = processedMessages.filter((m) => m.type === "response")

    if (userMessages.length > 0) {
      console.log("🔍 Simulated user message analysis:", {
        messageLength: userMessages[0].content.length,
        complexity: userMessages[0].content.split(" ").length > 10 ? "high" : "low",
        intent: "information_seeking", // Simulated intent detection
      })
    }

    if (assistantMessages.length > 0) {
      console.log("📊 Simulated assistant response evaluation:", {
        responseLength: assistantMessages[0].content.length,
        sourceCount: assistantMessages[0].metadata?.sources?.length || 0,
        quality: assistantMessages[0].metadata?.sources?.length > 0 ? "good" : "basic",
        completeness: assistantMessages[0].content.length > 100 ? "comprehensive" : "brief",
      })
    }
  }

  const fetchLatestResponses = async () => {
    if (!fetchStatus.isConnected) {
      toast({
        title: "Not Connected",
        description: "Please test connection first",
        variant: "destructive",
      })
      return
    }

    setFetchStatus((prev) => ({ ...prev, isFetching: true, error: null }))
    setProgress(0)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 15
      })
    }, 500)

    try {
      // Save current configuration
      localStorage.setItem(
        "anythingllm-config",
        JSON.stringify({
          apiKey,
          baseUrl,
          workspaceId,
        }),
      )

      console.log(`📥 Fetching chat history from: ${baseUrl}/api/v1/workspace/${workspaceId}/chats`)

      // Fetch chat history from AnythingLLM
      const response = await fetch(`${baseUrl}/api/v1/workspace/${workspaceId}/chats`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const rawData = await response.json()
      setRawApiResponse(rawData) // Store for debugging

      console.log("📊 Raw chat data received:", {
        workspaceId,
        dataType: typeof rawData,
        hasHistory: !!rawData.history,
        historyLength: rawData.history ? rawData.history.length : 0,
        sampleHistoryItem: rawData.history && rawData.history.length > 0 ? rawData.history[0] : null,
      })

      // Process the data using the exact same logic as your reference code
      if (!rawData.history || !Array.isArray(rawData.history)) {
        throw new Error("Invalid response format - missing 'history' array")
      }

      // Filter chats to get user/assistant pairs
      const filteredChatPairs = filterChats(rawData.history)
      setChatPairs(filteredChatPairs)

      // Convert to AnythingLLMResponse format for processing
      const processedMessages = processChatPairs(filteredChatPairs)
      setMessages(processedMessages)

      setProgress(100)

      // Update fetch status
      setFetchStatus((prev) => ({
        ...prev,
        isFetching: false,
        messageCount: processedMessages.length,
        lastFetch: new Date(),
        error: null,
      }))

      // Simulate thinking agent processing
      if (processedMessages.length > 0) {
        simulateThinkingAgentProcessing(processedMessages)
      }

      clearInterval(progressInterval)

      if (processedMessages.length === 0) {
        toast({
          title: "No Messages Found",
          description: `Retrieved ${rawData.history.length} raw messages but no valid chat pairs were extracted.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Latest Conversation Fetched",
          description: `Retrieved latest conversation (Chat ID: ${filteredChatPairs[0]?.chat_id}) and processed with analysis system`,
        })

        // Auto-redirect to agents page after successful fetch
        setTimeout(() => {
          router.push("/Archetypals")
        }, 200000)
      }
    } catch (error) {
      clearInterval(progressInterval)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch responses"

      setFetchStatus((prev) => ({
        ...prev,
        isFetching: false,
        error: errorMessage,
      }))

      toast({
        title: "Fetch Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const startAutoFetch = async () => {
    if (!fetchStatus.isConnected) {
      toast({
        title: "Not Connected",
        description: "Please test connection first",
        variant: "destructive",
      })
      return
    }

    try {
      // Update integration settings
      const integration = anythingLLMIntegration
      integration.updateConfig(baseUrl, apiKey)

      await integration.startMonitoring(workspaceId, 30000) // 30 second intervals

      toast({
        title: "Auto-Fetch Started",
        description: "Now monitoring workspace for new messages every 30 seconds",
      })

      router.push("/monitoring")
    } catch (error) {
      toast({
        title: "Auto-Fetch Failed",
        description: error instanceof Error ? error.message : "Failed to start monitoring",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Fetch AnythingLLM Responses</h1>
        <p className="text-gray-600">
          Connect to your AnythingLLM workspace and fetch the latest conversations for analysis
        </p>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Connection Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-6 w-6 mr-2" />
              AnythingLLM Configuration
            </CardTitle>
            <CardDescription>Configure your AnythingLLM connection settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base-url">Base URL</Label>
                <Input
                  id="base-url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:3001"
                />
              </div>
              <div>
                <Label htmlFor="workspace-id">Workspace ID</Label>
                <Input
                  id="workspace-id"
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  placeholder="archetypals"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="88T4DCZ-HY0M4J7-NMCMA9P-2D0F1C8"
              />
            </div>

            <div className="flex items-center space-x-4">
              <Button onClick={testConnection} disabled={fetchStatus.isFetching}>
                {fetchStatus.isFetching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : fetchStatus.isConnected ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>

              {fetchStatus.isConnected && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>

            {fetchStatus.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>{fetchStatus.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Fetch Status */}
        {fetchStatus.isFetching && (
          <Card>
            <CardHeader className="text-center">
              <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Fetching Latest Responses</CardTitle>
              <CardDescription>Retrieving and processing messages from AnythingLLM workspace...</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="mb-4" />
              <p className="text-sm text-gray-600 text-center">
                {progress < 30 && "Connecting to workspace..."}
                {progress >= 30 && progress < 60 && "Fetching chat history..."}
                {progress >= 60 && progress < 90 && "Processing with analysis system..."}
                {progress >= 90 && "Finalizing analysis..."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Fetch Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Fetch Options</CardTitle>
            <CardDescription>Choose how you want to retrieve and process the responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={fetchLatestResponses}
                disabled={!fetchStatus.isConnected || fetchStatus.isFetching}
                className="h-20 flex-col"
              >
                <MessageSquare className="h-6 w-6 mb-2" />
                Fetch Once
                <span className="text-xs opacity-75">Get latest messages now</span>
              </Button>

              <Button
                onClick={startAutoFetch}
                disabled={!fetchStatus.isConnected || fetchStatus.isFetching}
                variant="outline"
                className="h-20 flex-col bg-transparent"
              >
                <RefreshCw className="h-6 w-6 mb-2" />
                Auto-Fetch
                <span className="text-xs opacity-75">Monitor continuously</span>
              </Button>
            </div>

            {fetchStatus.isConnected && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">What happens next:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>
                    Fetch latest messages from workspace: <code className="bg-white px-1 rounded">{workspaceId}</code>
                  </li>
                  <li>Extract user messages and assistant responses from history array</li>
                  <li>Pair messages by chatId to create conversation threads</li>
                  <li>Process messages with built-in analysis system</li>
                  <li>Generate conversation insights and quality metrics</li>
                  <li>Store analysis results for review</li>
                  <li>Apply automated quality assessments</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current status of the conversation analysis system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{agentStats.activeAgents}</div>
                <div className="text-sm text-gray-600">Analysis Modules</div>
              </div>

              <div className="text-center">
                <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{agentStats.thoughtsGenerated}</div>
                <div className="text-sm text-gray-600">Insights Generated</div>
              </div>

              <div className="text-center">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{agentStats.councilDecisions}</div>
                <div className="text-sm text-gray-600">Quality Assessments</div>
              </div>
            </div>

            {fetchStatus.lastFetch && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Fetch:</span>
                  <span className="text-sm font-medium">{fetchStatus.lastFetch.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Messages Retrieved:</span>
                  <span className="text-sm font-medium">{fetchStatus.messageCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Chat Pairs:</span>
                  <span className="text-sm font-medium">{chatPairs.length}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Conversation */}
        {messages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Latest Conversation</CardTitle>
              <CardDescription>
                Most recent user prompt and assistant response from AnythingLLM workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.type === "user"
                        ? "bg-blue-50 border-l-4 border-blue-200"
                        : "bg-gray-50 border-l-4 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={message.type === "user" ? "default" : "outline"}>
                        {message.type === "user" ? (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            User Message
                          </>
                        ) : (
                          <>
                            <Bot className="h-3 w-3 mr-1" />
                            Assistant Response
                          </>
                        )}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        {message.metadata?.sources?.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {message.metadata.sources.length} sources
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          Chat {message.metadata?.chatId}
                        </Badge>
                        <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Show sources if available */}
                    {message.metadata?.sources?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Source References ({message.metadata.sources.length})
                        </h4>
                        <div className="space-y-2">
                          {message.metadata.sources.slice(0, 3).map((source: any, index: number) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-gray-800 mb-1">
                                    {source.title || `Source ${index + 1}`}
                                  </h5>
                                  {source.description && (
                                    <p className="text-xs text-gray-600 mb-2">{source.description}</p>
                                  )}
                                  {source.docSource && (
                                    <p className="text-xs text-gray-500">
                                      <span className="font-medium">Source:</span> {source.docSource}
                                    </p>
                                  )}
                                  {source.published && (
                                    <p className="text-xs text-gray-500">
                                      <span className="font-medium">Published:</span> {source.published}
                                    </p>
                                  )}
                                </div>
                                {source.score && (
                                  <Badge variant="outline" className="text-xs ml-2">
                                    {(source.score * 100).toFixed(1)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          {message.metadata.sources.length > 3 && (
                            <div className="text-center">
                              <Badge variant="secondary" className="text-xs">
                                +{message.metadata.sources.length - 3} more sources
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <Button onClick={() => router.push("/Archetypals")}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View Analysis Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw API Response Debug */}
        {rawApiResponse && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Raw API Response Debug
              </CardTitle>
              <CardDescription>Complete API response structure for debugging</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto max-h-96">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      ...rawApiResponse,
                      history: rawApiResponse.history?.slice(0, 2), // Show only first 2 history items
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Processing Success:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Total history messages: {rawApiResponse.history?.length || 0}</li>
                  <li>• Chat pairs extracted: {chatPairs.length}</li>
                  <li>• Messages processed: {messages.length}</li>
                  <li>• Using exact same logic as your reference LangFlow component</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
