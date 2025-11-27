import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, MessageCircle, FileText, ExternalLink } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Help & Support</h1>
        <p className="text-gray-600">Get help with AgentFlow and learn how to maximize your workflow orchestration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>Documentation</CardTitle>
            <CardDescription>Comprehensive guides and API references</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Docs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MessageCircle className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>Live Chat</CardTitle>
            <CardDescription>Get instant help from our support team</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent">
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Chat
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Mail className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle>Email Support</CardTitle>
            <CardDescription>Send us a detailed message about your issue</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent">
              <Mail className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">How do I configure my API keys?</h4>
              <p className="text-sm text-gray-600">
                Go to Settings and enter your OpenAI and AnythingLLM API keys in the respective tabs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What OKR formats are supported?</h4>
              <p className="text-sm text-gray-600">
                We support PDF, TXT, DOCX files, direct text input, and API connections to OKR management systems.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">How are agents generated?</h4>
              <p className="text-sm text-gray-600">
                Our AI analyzes your OKRs and creates specialized agents (Sales, Marketing, Governance, Security) with
                specific responsibilities aligned to your objectives.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Configure API Keys</h4>
                <p className="text-sm text-gray-600">Set up your OpenAI and AnythingLLM API keys in Settings</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Upload OKRs</h4>
                <p className="text-sm text-gray-600">
                  Upload your OKRs using file upload, text input, or API connection
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Generate Agents</h4>
                <p className="text-sm text-gray-600">AI will analyze your OKRs and create specialized agents</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold">Deploy Workflow</h4>
                <p className="text-sm text-gray-600">Deploy your workflow to AnythingLLM and monitor performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
