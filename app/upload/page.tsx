"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, LinkIcon, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function UploadPage() {
  const [uploadMethod, setUploadMethod] = useState<"file" | "text" | "api">("file")
  const [isProcessing, setIsProcessing] = useState(false)
  const [okrText, setOkrText] = useState("")
  const [apiUrl, setApiUrl] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "OKRs Processed Successfully",
      description: "Your OKRs have been analyzed and agents are being generated.",
    })

    // Store the OKR data in sessionStorage for the next page
    const okrData = {
      method: uploadMethod,
      content: uploadMethod === "text" ? okrText : uploadMethod === "api" ? apiUrl : "uploaded-file.pdf",
      timestamp: new Date().toISOString(),
    }
    sessionStorage.setItem("okrData", JSON.stringify(okrData))

    router.push("/Archetypals")
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Your OKRs</h1>
          <p className="text-gray-600">Choose how you'd like to provide your OKRs for AI agent generation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>OKR Input Method</CardTitle>
            <CardDescription>Select the method that works best for your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Method Selection */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Button
                variant={uploadMethod === "file" ? "default" : "outline"}
                onClick={() => setUploadMethod("file")}
                className="h-20 flex-col"
              >
                <Upload className="h-6 w-6 mb-2" />
                File Upload
              </Button>
              <Button
                variant={uploadMethod === "text" ? "default" : "outline"}
                onClick={() => setUploadMethod("text")}
                className="h-20 flex-col"
              >
                <FileText className="h-6 w-6 mb-2" />
                Text Input
              </Button>
              <Button
                variant={uploadMethod === "api" ? "default" : "outline"}
                onClick={() => setUploadMethod("api")}
                className="h-20 flex-col"
              >
                <LinkIcon className="h-6 w-6 mb-2" />
                API Connection
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {uploadMethod === "file" && (
                <div>
                  <Label htmlFor="file">Upload OKR Document</Label>
                  <Input id="file" type="file" accept=".pdf,.txt,.docx" className="mt-2" required />
                  <p className="text-sm text-gray-500 mt-1">Supported formats: PDF, TXT, DOCX</p>
                </div>
              )}

              {uploadMethod === "text" && (
                <div>
                  <Label htmlFor="okr-text">Paste Your OKRs</Label>
                  <Textarea
                    id="okr-text"
                    placeholder="Objective 1: Increase revenue by 25%
Key Result 1.1: Launch 3 new product features
Key Result 1.2: Acquire 1000 new customers
Key Result 1.3: Improve customer retention to 95%

Objective 2: Enhance operational efficiency..."
                    className="mt-2 min-h-[200px]"
                    value={okrText}
                    onChange={(e) => setOkrText(e.target.value)}
                    required
                  />
                </div>
              )}

              {uploadMethod === "api" && (
                <div>
                  <Label htmlFor="api-url">API Endpoint URL</Label>
                  <Input
                    id="api-url"
                    type="url"
                    placeholder="https://your-okr-system.com/api/okrs"
                    className="mt-2"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">We'll connect to your OKR management system</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  "Processing OKRs..."
                ) : (
                  <>
                    Generate AI Agents <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
