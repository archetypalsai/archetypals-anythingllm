import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, MessageSquare, Brain, Users, Activity, Eye } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          AI Agent
          <span className="text-blue-600"> Thinking Orchestration</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl">
          Connect to your AnythingLLM workspace to automatically generate thinking agents that analyze conversations,
          make decisions through an archetype council, and self-correct using semantic drift techniques.
        </p>
        <Link href="/fetch-responses">
          <Button size="lg" className="text-lg px-8 py-4">
            Connect to AnythingLLM <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Response Ingestion</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically fetch and analyze the latest conversations from your AnythingLLM workspace in real-time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Brain className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Thinking Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI agents generate pre and post-action thoughts, analyzing conversations and storing insights in
                PostgreSQL.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Archetype Council</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Council of specialized agents reviews thoughts and makes decisions to maintain, tune, or offline agents.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Activity className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Real-time Tuning</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Semantic drift correction techniques tune agents in real-time without taking them offline.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20 rounded-lg mt-8">
        <div className="text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Intelligent Agent Orchestration?</h2>
          <p className="text-xl mb-8 opacity-90">
            Connect your AnythingLLM workspace and watch as thinking agents automatically analyze and optimize your AI
            conversations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/fetch-responses">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                <MessageSquare className="mr-2 h-5 w-5" />
                Fetch Latest Responses
              </Button>
            </Link>
            <Link href="/monitoring">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
              >
                <Eye className="mr-2 h-5 w-5" />
                View Monitoring Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
