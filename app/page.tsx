import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Bot, FileText, GitBranch, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Transform OKRs into
          <span className="text-blue-600"> AI Workflows</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl">
          Upload your OKRs and watch as our AI automatically generates archetypal agents, designs optimal interaction
          flows, and implements them in AnythingLLM for seamless orchestration.
        </p>
        <Link href="/upload">
          <Button size="lg" className="text-lg px-8 py-4">
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>OKR Ingestion</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload OKRs via PDF, text files, or API connections. Automatically parsed and stored in vector database.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bot className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Agent Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI analyzes OKRs and generates archetypal agents (Sales, Security, Marketing, Governance) with specific
                responsibilities.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <GitBranch className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Flow Orchestration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically generates workflow descriptions with agent interactions, handoff points, and decision
                logic.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Monitoring & Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track workflow progress, monitor agent performance, and optimize with real-time analytics.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20 rounded-lg mt-8">
        <div className="text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Orchestrate Your AI Workflows?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of organizations already using AgentFlow to automate their OKR execution.
          </p>
          <Link href="/upload">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
