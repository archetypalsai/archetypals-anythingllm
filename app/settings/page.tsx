"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { AnythingLLMClient, initializeAnythingLLMClient } from "@/lib/anything-llm-client"
import { saveApiKeys, getApiKeys } from "@/lib/api-keys"

export default function SettingsPage() {
  // AnythingLLM settings
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("https://api.anythingllm.com")
  const [organizationId, setOrganizationId] = useState("")
  const [isTesting, setIsTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null)

  // OpenAI settings
  const [openaiApiKey, setOpenaiApiKey] = useState("")

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Load saved settings
    const apiKeys = getApiKeys()

    // Set OpenAI API key
    if (apiKeys.openaiApiKey) {
      setOpenaiApiKey(apiKeys.openaiApiKey)
    }

    // Set AnythingLLM settings
    if (apiKeys.anythingLlmApiKey) {
      setApiKey(apiKeys.anythingLlmApiKey)
    }

    if (apiKeys.anythingLlmBaseUrl) {
      setBaseUrl(apiKeys.anythingLlmBaseUrl)
    } else {
      setBaseUrl("https://api.anythingllm.com")
    }

    if (apiKeys.anythingLlmOrgId) {
      setOrganizationId(apiKeys.anythingLlmOrgId)
    }
  }, [])

  const saveAnythingLLMSettings = () => {
    // Save AnythingLLM settings
    saveApiKeys({
      openaiApiKey: openaiApiKey, // Keep existing OpenAI key
      anythingLlmApiKey: apiKey,
      anythingLlmBaseUrl: baseUrl,
      anythingLlmOrgId: organizationId || undefined,
    })

    // Initialize the client with the new settings
    initializeAnythingLLMClient({
      apiKey,
      baseUrl,
      organizationId: organizationId || undefined,
    })

    toast({
      title: "Settings Saved",
      description: "Your AnythingLLM API settings have been saved.",
    })
  }

  const saveOpenAISettings = () => {
    // Save OpenAI settings
    saveApiKeys({
      openaiApiKey: openaiApiKey,
      anythingLlmApiKey: apiKey, // Keep existing AnythingLLM key
      anythingLlmBaseUrl: baseUrl,
      anythingLlmOrgId: organizationId,
    })

    toast({
      title: "OpenAI Settings Saved",
      description: "Your OpenAI API key has been saved.",
    })
  }

  const testConnection = async () => {
    setIsTesting(true)
    setConnectionStatus(null)

    try {
      const client = new AnythingLLMClient({
        apiKey,
        baseUrl,
        organizationId: organizationId || undefined,
      })

      const result = await client.testConnection()
      setConnectionStatus(result)

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
      setConnectionStatus({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      })

      toast({
        title: "Connection Error",
        description: "Failed to connect to AnythingLLM API.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">API Settings</h1>
        <p className="text-gray-600">Configure API integrations</p>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="openai" className="max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="anythingllm">AnythingLLM</TabsTrigger>
          </TabsList>

          <TabsContent value="openai">
            <Card>
              <CardHeader>
                <CardTitle>OpenAI API Configuration</CardTitle>
                <CardDescription>Enter your OpenAI API key to enable agent and workflow generation</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault()
                    saveOpenAISettings()
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="openai-api-key">API Key</Label>
                    <Input
                      id="openai-api-key"
                      type="password"
                      placeholder="Enter your OpenAI API key"
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Your API key can be found in your OpenAI dashboard under API settings.
                    </p>
                  </div>

                  <Button type="submit" className="w-full">
                    Save OpenAI Settings
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anythingllm">
            <Card>
              <CardHeader>
                <CardTitle>AnythingLLM API Configuration</CardTitle>
                <CardDescription>Enter your AnythingLLM API credentials to enable workflow deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault()
                    saveAnythingLLMSettings()
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter your AnythingLLM API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Your API key can be found in your AnythingLLM dashboard under API settings.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="base-url">API Base URL</Label>
                    <Input
                      id="base-url"
                      type="url"
                      placeholder="https://api.anythingllm.com"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      The base URL for the AnythingLLM API. Use the default unless you have a custom deployment.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="org-id">Organization ID (Optional)</Label>
                    <Input
                      id="org-id"
                      placeholder="Enter your organization ID"
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">Required only if you're part of multiple organizations.</p>
                  </div>

                  {connectionStatus && (
                    <div className={`p-4 rounded-md ${connectionStatus.success ? "bg-green-50" : "bg-red-50"}`}>
                      <div className="flex items-center">
                        {connectionStatus.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <p className={connectionStatus.success ? "text-green-700" : "text-red-700"}>
                          {connectionStatus.message}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button type="submit" className="flex-1">
                      Save AnythingLLM Settings
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testConnection}
                      disabled={isTesting || !apiKey || !baseUrl}
                    >
                      {isTesting ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
