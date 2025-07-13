"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ResizablePanels from "@/components/ResizablePanels";
import React from "react";

interface User {
  email: string;
  name: string;
  projects: Array<{
    id: string;
    name: string;
    prompt: string;
    sandboxId: string;
    previewUrl: string;
    createdAt: string;
  }>;
}

interface Message {
  type: "claude_message" | "tool_use" | "tool_result" | "progress" | "error" | "complete";
  content?: string;
  name?: string;
  input?: any;
  result?: any;
  message?: string;
  previewUrl?: string;
  sandboxId?: string;
}

interface PreviewMessage {
  id: string;
  text: string;
  timestamp: number;
}

const renderMarkdown = (text: string) => {
    if (!text) return "";
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-white mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mb-3">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-300 italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 text-green-400 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^- (.*$)/gim, '<li class="text-gray-300 ml-4">• $1</li>')
      .replace(/^\* (.*$)/gim, '<li class="text-gray-300 ml-4">• $1</li>')
      .replace(/\n/g, '<br>');
};

const getImportantMessage = (message: Message) => {
    if (message.type === "claude_message" || message.type === "progress") {
      const content = message.content || message.message || "";
      const lowerContent = content.toLowerCase();
      
      if (content.includes("🚀 RAJAT:") || content.includes("❌ Error:") || content.includes("🎭 Mock:") || content.includes("🤖 You:")) {
        return content;
      }
      
      if (lowerContent.includes("creating") || lowerContent.includes("generating") || 
          lowerContent.includes("setting up") || lowerContent.includes("configuring") ||
          lowerContent.includes("installing") || lowerContent.includes("downloading") ||
          lowerContent.includes("starting") || lowerContent.includes("building") ||
          lowerContent.includes("sandbox") || lowerContent.includes("server") ||
          lowerContent.includes("preview") || lowerContent.includes("ready")) {
        return `**🛠️ Progress:** ${content}`;
      }
      
      return content;
    }
    
    return null;
};

const LeftPanel = React.memo(({
    prompt,
    user,
    messages,
    isGenerating,
    error,
    messagesEndRef,
    followUpInput,
    setFollowUpInput,
    handleFollowUpSubmit,
    previewUrl,
    sandboxId,
    handleStopGeneration,
    selectedModel,
    setSelectedModel
}: any) => {
    const router = useRouter();
    return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <h2 className="text-white font-semibold">RAJAT AI</h2>
            <p className="text-gray-400 text-xs">Building your project</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard
        </button>
      </div>
      
      {/* Project Info */}
      <div className="p-4 bg-gray-800/30 border-b border-gray-700">
        <p className="text-gray-300 text-sm break-words leading-relaxed">{prompt}</p>
        {user && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-400">{user.name}</span>
          </div>
        )}
      </div>
      
      {/* Model Selector */}
        <div className="p-4 bg-gray-800/30 border-b border-gray-700">
            <div className="relative w-full max-w-xs mx-auto bg-gray-900 rounded-full p-1 flex items-center">
                <div className={`absolute top-1 left-1 w-1/2 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-transform duration-300 ease-in-out transform ${selectedModel === 'claude' ? 'translate-x-0' : 'translate-x-full'}`}></div>
                <button onClick={() => setSelectedModel('claude')} className={`w-1/2 z-10 py-1 text-sm font-medium transition-colors duration-300 ${selectedModel === 'claude' ? 'text-white' : 'text-gray-400'}`}>Claude</button>
                <button onClick={() => setSelectedModel('chatgpt')} className={`w-1/2 z-10 py-1 text-sm font-medium transition-colors duration-300 ${selectedModel === 'chatgpt' ? 'text-white' : 'text-gray-400'}`}>ChatGPT</button>
            </div>
        </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll">
        <div className="p-4 space-y-3">
          {messages.map((message: Message, index: number) => {
            const importantMessage = getImportantMessage(message);
            
            return (
              <div key={index} className="message-fade-in">
                {(message.type === "claude_message" || message.type === "progress") && (importantMessage || message.content?.includes("🤖 You:")) && (
                  <div className={`rounded-xl p-4 border transition-all duration-200 hover:shadow-lg ${
                    message.content?.includes("🤖 You:") 
                      ? "bg-blue-900/40 border-blue-700/50 ml-6" 
                      : "bg-gray-800/60 border-gray-600/50"
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      {message.content?.includes("🤖 You:") ? (
                        <>
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">U</span>
                          </div>
                          <span className="text-blue-100 text-sm font-medium">You</span>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">R</span>
                          </div>
                          <span className="text-purple-100 text-sm font-medium">RAJAT</span>
                        </>
                      )}
                    </div>
                    <div className="text-gray-100 text-sm leading-relaxed" dangerouslySetInnerHTML={{
                      __html: renderMarkdown(importantMessage || "")
                    }} />
                  </div>
                )}
              </div>
            );
          })}
          
          {isGenerating && (
            <div className="flex items-center justify-between gap-3 text-gray-400 p-4 bg-gray-800/30 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                    <span className="text-sm">AI is working<span className="loading-dots"></span></span>
                </div>
                <button onClick={handleStopGeneration} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Stop
                </button>
            </div>
          )}
          
          {error && (
            <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-900/30">
        <div className="relative">
          <input
            type="text"
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleFollowUpSubmit();
              }
            }}
            placeholder={previewUrl ? "Ask for changes to your website..." : "Ask RAJAT..."}
            className="w-full px-4 py-3 pr-12 bg-gray-800/60 text-white rounded-xl border border-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-200"
            disabled={isGenerating || (!previewUrl && !sandboxId)}
          />
          <button 
            onClick={handleFollowUpSubmit}
            disabled={!followUpInput.trim() || isGenerating || (!previewUrl && !sandboxId)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        {previewUrl && (
          <div className="mt-3 p-3 bg-gray-800/40 rounded-lg border border-gray-600/30">
            <p className="text-xs text-gray-400 leading-relaxed">
              💡 <strong>Tip:</strong> You can ask for changes like "Add a contact form", "Change colors to blue", or "Make it mobile responsive"
            </p>
          </div>
        )}
      </div>
    </>
    );
});
LeftPanel.displayName = 'LeftPanel';

const RightPanel = React.memo(({
    previewUrl,
    isGenerating,
    previewMessages
} : any) => {
    return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-gray-300 text-sm font-medium">
            {previewUrl ? "Live Preview" : isGenerating ? "Generating..." : "Preview"}
          </span>
        </div>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in New Tab
          </a>
        )}
      </div>
      
      {/* Preview Content */}
      <div className="flex-1 relative">
        {!previewUrl && isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-600/50 to-gray-800/50 rounded-3xl flex items-center justify-center mb-8 animate-wobbleGlow backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl animate-pulse flex items-center justify-center">
                <div className="w-10 h-10 bg-white/20 rounded-xl animate-spin">
                  <div className="w-3 h-3 bg-white rounded-full m-1"></div>
                </div>
              </div>
            </div>
            
            <div className="relative bg-gray-700/20 backdrop-blur-md rounded-2xl p-6 w-[480px] h-48 overflow-hidden border border-gray-600/30">
              <div className="absolute inset-6 flex flex-col justify-end overflow-hidden">
                {previewMessages.slice(-6).map((msg: PreviewMessage, index: number) => (
                  <div
                    key={msg.id}
                    className="text-green-300 text-sm font-mono py-1.5 animate-smoothSlideUp flex items-center gap-2"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animationDuration: '4s',
                      animationFillMode: 'forwards',
                      opacity: 1 - (index * 0.12)
                    }}
                  >
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    {msg.text}
                  </div>
                ))}
              </div>
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-700/20 via-gray-700/10 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-700/20 to-transparent pointer-events-none" />
            </div>
          </div>
        )}
        
        {previewUrl && (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="Website Preview"
          />
        )}
        
        {!previewUrl && !isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-gray-400 text-center">Your website preview will appear here</p>
          </div>
        )}
      </div>
    </div>
    );
});
RightPanel.displayName = 'RightPanel';

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prompt = searchParams.get("prompt") || "";
  const model = searchParams.get("model") || "claude";
  const existingSandboxId = searchParams.get("sandboxId") || null;
  const isContinuing = searchParams.get("continue") === "true";
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [sandboxId, setSandboxId] = useState<string | null>(existingSandboxId);
  const [user, setUser] = useState<User | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(model);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const previewMessageIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      setError("Generation stopped by user.");
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const generateProjectName = (prompt: string): string => {
    const words = prompt.toLowerCase().match(/\b\w+\b/g) || [];
    const importantWords = words.filter(word => 
      !['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'create', 'make', 'build'].includes(word)
    );
    
    if (importantWords.length === 0) {
      return "My Website";
    }
    
    const name = importantWords.slice(0, 3).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return name.length > 30 ? name.substring(0, 30) + '...' : name;
  };

  const saveProject = useCallback((sandboxId: string, previewUrl: string | null) => {
    if (!user) return;
    
    try {
      const projectId = Date.now().toString();
      const projectName = generateProjectName(prompt);
      
      const newProject = {
        id: projectId,
        name: projectName,
        prompt,
        sandboxId,
        previewUrl: previewUrl || "",
        createdAt: new Date().toISOString()
      };
      
      const updatedUser = {
        ...user,
        projects: [...user.projects, newProject]
      };
      
      localStorage.setItem("lovable_current_user", JSON.stringify(updatedUser));
      
      const users = JSON.parse(localStorage.getItem("lovable_users") || "{}");
      if (users[user.email]) {
        users[user.email].projects = updatedUser.projects;
        localStorage.setItem("lovable_users", JSON.stringify(users));
      }
      
      setUser(updatedUser);
      setCurrentProjectId(projectId);
      
    } catch (error) {
      console.error("Failed to save project:", error);
    }
  }, [user, prompt]);

  const generateWebsite = useCallback(async () => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setMessages(prev => [...prev, {
        type: "claude_message",
        content: "**🚀 RAJAT:** Starting to generate your website..."
      }]);
      
      const requestBody = { 
        prompt,
        sandboxId: existingSandboxId,
        isFollowUp: false,
        model: selectedModel
      };
      
      const response = await fetch("/api/generate-daytona", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal
      });
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              setIsGenerating(false);
              break;
            }

            try {
              const message = JSON.parse(data) as Message;
              
              if (message.type === "error") {
                throw new Error(message.message);
              } else if (message.type === "complete") {
                const newPreviewUrl = message.previewUrl || null;
                const newSandboxId = message.sandboxId || null;
                
                setPreviewUrl(newPreviewUrl);
                setSandboxId(newSandboxId);
                setIsGenerating(false);
                
                if (newSandboxId && !isContinuing && user) {
                  saveProject(newSandboxId, newPreviewUrl);
                }
              } else {
                setMessages((prev) => [...prev, message]);
              }
            } catch (e) {
              console.warn("⚠️ Failed to parse message:", data, e);
            }
          }
        }
      }
    } catch (err: any) {
        if (err.name === 'AbortError') {
            return;
        }
      const errorMessage = err.message || "An unknown error occurred";
      setError(errorMessage);
      setIsGenerating(false);
      
      setMessages(prev => [...prev, {
        type: "claude_message",
        content: `**❌ Error:** ${errorMessage}`
      }]);
    }
  }, [prompt, existingSandboxId, user, isContinuing, saveProject, selectedModel]);

  useEffect(() => {
    const currentUser = localStorage.getItem("lovable_current_user");
    if (!currentUser) {
      router.push("/");
      return;
    }
    
    try {
      const userData = JSON.parse(currentUser);
      setUser(userData);
    } catch (e) {
      router.push("/");
      return;
    }
    
    if (!prompt) {
      router.push("/");
      return;
    }
  }, [prompt, router]);
  
  useEffect(() => {
    if (!user || !prompt || hasStartedRef.current || isContinuing) {
      return;
    }
    
    hasStartedRef.current = true;
    
    setTimeout(() => {
      setIsGenerating(true);
      
      fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'connection' })
      })
      .then(res => res.json())
      .then(data => {
        generateWebsite();
      })
      .catch(err => {
        generateWebsite(); // Try anyway
      });
    }, 100);
  }, [user, prompt, isContinuing, generateWebsite]);
  
  useEffect(() => {
    if (user && isContinuing && existingSandboxId && prompt) {
      const projectPreviewUrl = user.projects.find(p => p.sandboxId === existingSandboxId)?.previewUrl;
      
      if (projectPreviewUrl) {
        setPreviewUrl(projectPreviewUrl);
      } else {
        setPreviewUrl("https://example.com/existing-project");
      }
      
      setSandboxId(existingSandboxId);
      
      setMessages([{
        type: "claude_message",
        content: "**🔄 RAJAT:** Welcome back! Your existing project has been loaded and is ready for modifications.\n\n**Original prompt:** " + prompt + "\n\nYou can now ask me to make changes, add features, or fix any issues with your project. What would you like to do?"
      }]);
      
      setIsGenerating(false);
      setError(null);
    }
  }, [user, isContinuing, existingSandboxId, prompt]);

  const addPreviewMessage = (text: string) => {
    const newMessage: PreviewMessage = {
      id: `preview-${previewMessageIdRef.current++}`,
      text,
      timestamp: Date.now()
    };
    setPreviewMessages(prev => [...prev, newMessage]);
    
    setTimeout(() => {
      setPreviewMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }, 4000);
  };

  useEffect(() => {
    if (isGenerating && !previewUrl) {
      const messages = [
        "🚀 Initializing sandbox environment...",
        "📦 Downloading Next.js framework...",
        "⚙️ Installing dependencies...",
        "🔧 Configuring TypeScript...",
        "🎨 Setting up Tailwind CSS...",
        "📝 Generating project structure...",
        "🔄 Optimizing build configuration...",
        "🌐 Starting development server...",
        "⚡ Warming up modules...",
        "🔍 Running health checks...",
        "✨ Finalizing setup..."
      ];
      
      let messageIndex = 0;
      const interval = setInterval(() => {
        if (isGenerating && !previewUrl) {
          addPreviewMessage(messages[messageIndex % messages.length]);
          messageIndex++;
        } else {
          clearInterval(interval);
        }
      }, 1200);
      
      return () => clearInterval(interval);
    }
  }, [isGenerating, previewUrl]);

  const handleFollowUpSubmit = useCallback(async () => {
    if (!followUpInput.trim() || isGenerating || !sandboxId) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const userMessage: Message = {
      type: "claude_message",
      content: `**🤖 You:** ${followUpInput}`
    };
    
    setMessages(prev => [...prev, userMessage]);
    setFollowUpInput("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-daytona", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: followUpInput,
          sandboxId: sandboxId,
          isFollowUp: true,
          model: selectedModel
        }),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process follow-up");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              setIsGenerating(false);
              break;
            }

            try {
              const message = JSON.parse(data) as Message;
              
              if (message.type === "error") {
                throw new Error(message.message);
              } else if (message.type === "complete") {
                setIsGenerating(false);
              } else {
                setMessages((prev) => [...prev, message]);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
        if (err.name === 'AbortError') {
            return;
        }
      setError(err.message || "An error occurred");
      setIsGenerating(false);
    }
  }, [followUpInput, isGenerating, sandboxId, selectedModel]);

  return (
    <main className="h-screen bg-black flex flex-col overflow-hidden">
      <ResizablePanels
        leftPanel={
            <LeftPanel
                prompt={prompt}
                user={user}
                messages={messages}
                isGenerating={isGenerating}
                error={error}
                messagesEndRef={messagesEndRef}
                followUpInput={followUpInput}
                setFollowUpInput={setFollowUpInput}
                handleFollowUpSubmit={handleFollowUpSubmit}
                previewUrl={previewUrl}
                sandboxId={sandboxId}
                handleStopGeneration={handleStopGeneration}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
            />
        }
        rightPanel={
            <RightPanel
                previewUrl={previewUrl}
                isGenerating={isGenerating}
                previewMessages={previewMessages}
            />
        }
        initialLeftWidth={35}
        minLeftWidth={25}
        maxLeftWidth={60}
      />
    </main>
  );
}

const styles = `
  @keyframes slideUpFade {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    90% {
      opacity: 1;
      transform: translateY(-10px);
    }
    100% {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
  
  .animate-slideUpFade {
    animation: slideUpFade 3s ease-out forwards;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
