"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Brain,
  MessageSquare,
  TrendingUp,
  Users,
  Database,
  ExternalLink,
  Clock,
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Activity,
} from "lucide-react"
import { anythingLLMIntegration } from "@/lib/anything-llm-integration"

interface MonitoringData {
  conversations: any[]
  agentThoughts: any[]
  simulatedThoughts: any[]
  thoughtStatistics: any
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData>({
    conversations: [],
    agentThoughts: [],
    simulatedThoughts: [],
    thoughtStatistics: {
      totalThoughts: 0,
      thoughtsByAgent: {},
      thoughtsByType: {},
      averageConfidence: 0,
      sentimentDistribution: {},
    },
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("🔄 Fetching monitoring data...")

      // Fetch conversations and thoughts
      const result = await anythingLLMIntegration.fetchAndProcessLatestConversations()

      // Get thought statistics
      const statistics = await anythingLLMIntegration.getThoughtStatistics()

      setData({
        conversations: result.conversations,
        agentThoughts: result.agentThoughts,
        simulatedThoughts: result.simulatedThoughts,
        thoughtStatistics: statistics,
      })

      setLastUpdated(new Date())
      console.log("✅ Monitoring data updated successfully")
    } catch (err) {
      console.error("❌ Error fetching monitoring data:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600"
      case "negative":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Monitor conversations, agent thoughts, and simulated insights</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <Button onClick={fetchData} disabled={isLoading}>
            {isLoading ? "Processing..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.conversations.length}</div>
            <p className="text-xs text-muted-foreground">Latest processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Thoughts</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.agentThoughts.length}</div>
            <p className="text-xs text-muted-foreground">Generated this session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simulated Thoughts</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.thoughtStatistics.totalThoughts}</div>
            <p className="text-xs text-muted-foreground">Stored in PostgreSQL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.thoughtStatistics.averageConfidence * 100)}%</div>
            <p className="text-xs text-muted-foreground">Thought confidence</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversations">Latest Conversations</TabsTrigger>
          <TabsTrigger value="agent-thoughts">Agent Analysis</TabsTrigger>
          <TabsTrigger value="simulated-thoughts">Simulated Thoughts</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          {data.conversations.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  No conversations found. Click "Refresh Data" to fetch latest conversations.
                </div>
              </CardContent>
            </Card>
          ) : (
            data.conversations.map((conversation, index) => (
              <Card key={conversation.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Latest Conversation</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          conversation.responseQuality === "high"
                            ? "default"
                            : conversation.responseQuality === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {conversation.responseQuality} quality
                      </Badge>
                      <Badge variant="outline">{conversation.sourceCount} sources</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {conversation.timestamp.toLocaleString()} •{conversation.responseLength} characters •
                    {Math.round(conversation.userSatisfaction * 100)}% satisfaction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">USER PROMPT</h4>
                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm">{conversation.userPrompt}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">ASSISTANT RESPONSE</h4>
                    <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                      <p className="text-sm whitespace-pre-wrap">{conversation.assistantResponse}</p>
                    </div>
                  </div>

                  {conversation.sources.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        SOURCES ({conversation.sources.length})
                      </h4>
                      <div className="grid gap-2">
                        {conversation.sources.slice(0, 3).map((source: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm">{source.title || `Source ${idx + 1}`}</h5>
                                {source.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{source.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {source.type || "Unknown"}
                                  </Badge>
                                  {source.published && (
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(source.published).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {source.score && (
                                <Badge variant="secondary" className="ml-2">
                                  {Math.round(source.score * 100)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {conversation.sources.length > 3 && (
                          <div className="text-center text-sm text-muted-foreground">
                            +{conversation.sources.length - 3} more sources
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="agent-thoughts" className="space-y-4">
          {data.agentThoughts.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  No agent thoughts available. Process some conversations first.
                </div>
              </CardContent>
            </Card>
          ) : (
            data.agentThoughts.map((agentThought, index) => (
              <Card key={`${agentThought.agentId}-${index}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    {agentThought.agentName} Analysis
                  </CardTitle>
                  <CardDescription>Conversation: {agentThought.conversationId}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold">Pre-Action Analysis</h4>
                        <Badge
                          variant="outline"
                          className={getConfidenceColor(agentThought.preActionThought.confidence)}
                        >
                          {Math.round(agentThought.preActionThought.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{agentThought.preActionThought.content}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <h4 className="font-semibold">Post-Action Evaluation</h4>
                        <Badge
                          variant="outline"
                          className={getConfidenceColor(agentThought.postActionThought.confidence)}
                        >
                          {Math.round(agentThought.postActionThought.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{agentThought.postActionThought.content}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="simulated-thoughts" className="space-y-4">
          {data.simulatedThoughts.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  No simulated thoughts available. Process some conversations first.
                </div>
              </CardContent>
            </Card>
          ) : (
            data.simulatedThoughts.map((thought, index) => (
              <Card key={thought.id || index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {thought.agentName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{thought.thoughtType}</Badge>
                      <Badge variant="outline" className={getSentimentColor(thought.sentiment)}>
                        {thought.sentiment}
                      </Badge>
                      <Badge variant="outline" className={getConfidenceColor(thought.confidence)}>
                        {Math.round(thought.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {thought.timestamp.toLocaleString()} • Conversation: {thought.conversationId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">ANALYSIS</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{thought.thoughtContent}</p>
                    </div>
                  </div>

                  {thought.insights.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        KEY INSIGHTS
                      </h4>
                      <ul className="space-y-1">
                        {thought.insights.map((insight: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {thought.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        RECOMMENDATIONS
                      </h4>
                      <ul className="space-y-1">
                        {thought.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Thoughts by Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.thoughtStatistics.thoughtsByAgent).map(([agent, count]) => (
                    <div key={agent} className="flex items-center justify-between">
                      <span className="text-sm">{agent}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={((count as number) / data.thoughtStatistics.totalThoughts) * 100}
                          className="w-20"
                        />
                        <span className="text-sm font-medium">{count as number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Sentiment Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.thoughtStatistics.sentimentDistribution).map(([sentiment, count]) => (
                    <div key={sentiment} className="flex items-center justify-between">
                      <span className={`text-sm capitalize ${getSentimentColor(sentiment)}`}>{sentiment}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={((count as number) / data.thoughtStatistics.totalThoughts) * 100}
                          className="w-20"
                        />
                        <span className="text-sm font-medium">{count as number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thought Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.thoughtStatistics.thoughtsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={((count as number) / data.thoughtStatistics.totalThoughts) * 100}
                          className="w-20"
                        />
                        <span className="text-sm font-medium">{count as number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overall Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Thoughts</span>
                    <span className="text-lg font-bold">{data.thoughtStatistics.totalThoughts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Confidence</span>
                    <span className="text-lg font-bold">
                      {Math.round(data.thoughtStatistics.averageConfidence * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Agents</span>
                    <span className="text-lg font-bold">
                      {Object.keys(data.thoughtStatistics.thoughtsByAgent).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
