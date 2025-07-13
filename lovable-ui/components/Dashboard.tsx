"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const handleContinueProject = (project: any) => {
    // Navigate to generate page with existing sandbox
    router.push(`/generate?prompt=${encodeURIComponent(project.prompt)}&sandboxId=${project.sandboxId}&continue=true`);
  };

  const handleNewProject = () => {
    if (!prompt.trim()) return;
    // Navigate to generate page with new prompt
    router.push(`/generate?prompt=${encodeURIComponent(prompt)}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/gradient.png')" }}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <h1 className="text-xl font-bold text-white">RAJAT</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-300">
                  Welcome, <span className="font-semibold text-white">{user.name}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Section */}
            <h1 className="text-4xl sm:text-4xl md:text-4xl font-bold text-white mb-6">
              Welcome back, {user.name.split(' ')[0]}! 👋
            </h1>
            <h3 className="text-xl sm:text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              What would you like to build today?
            </h3>

            <p className="text-xl sm:text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Turn your ideas into production-ready code in minutes. Powered by
              RAJAT's advanced AI capabilities.
            </p>

            {/* Input Section */}
            <div className="relative max-w-2xl mx-auto">
              <div className="relative flex items-center bg-black rounded-2xl border border-gray-800 shadow-2xl px-2">
                {/* Textarea */}
                <textarea
                  placeholder="Ask RAJAT to create a prototype..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleNewProject();
                    }
                  }}
                  className="flex-1 px-5 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg resize-none min-h-[120px] max-h-[300px]"
                  rows={3}
                />

                {/* Send button */}
                <button
                  onClick={handleNewProject}
                  disabled={!prompt.trim()}
                  className="flex-shrink-0 mr-3 p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
                >
                  <svg
                    className="h-5 w-5 group-hover:scale-110 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                </button>
              </div>

              {/* Example prompts */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() =>
                    setPrompt(
                      "Create a modern blog website with markdown support"
                    )
                  }
                  className="px-4 py-2 text-sm text-gray-400 bg-gray-800/50 backdrop-blur-sm rounded-full hover:bg-gray-700/50 transition-colors border border-gray-700"
                >
                  Blog website
                </button>
                <button
                  onClick={() =>
                    setPrompt("Build a portfolio website with project showcase")
                  }
                  className="px-4 py-2 text-sm text-gray-400 bg-gray-800/50 backdrop-blur-sm rounded-full hover:bg-gray-700/50 transition-colors border border-gray-700"
                >
                  Portfolio site
                </button>
                <button
                  onClick={() =>
                    setPrompt(
                      "Create an e-commerce product catalog with shopping cart"
                    )
                  }
                  className="px-4 py-2 text-sm text-gray-400 bg-gray-800/50 backdrop-blur-sm rounded-full hover:bg-gray-700/50 transition-colors border border-gray-700"
                >
                  E-commerce
                </button>
                <button
                  onClick={() =>
                    setPrompt(
                      "Build a dashboard with charts and data visualization"
                    )
                  }
                  className="px-4 py-2 text-sm text-gray-400 bg-gray-800/50 backdrop-blur-sm rounded-full hover:bg-gray-700/50 transition-colors border border-gray-700"
                >
                  Dashboard
                </button>
              </div>
            </div>

          
            {/* Existing Projects */}
            {user.projects.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-white mb-8 text-center">Your Recent Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {user.projects.slice(-6).map((project) => (
                    <div key={project.id} className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-700/60 overflow-hidden hover:border-purple-500/40 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 group">
                      <div className="p-6">
                        {/* Project Header */}
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-shadow">
                            <span className="text-white font-bold text-base">R</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-xl leading-tight mb-2 truncate group-hover:text-purple-100 transition-colors">
                              {project.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                              <p className="text-xs text-gray-400 font-medium">
                                Created {formatDate(project.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Project Description */}
                        <div className="mb-6">
                          <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 min-h-[4.5rem] group-hover:text-gray-200 transition-colors">
                            {project.prompt}
                          </p>
                        </div>
                        
                        {/* Project Stats */}
                        <div className="mb-5 flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1 text-gray-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
                            </svg>
                            <span>Sandbox: {project.sandboxId.slice(0, 8)}...</span>
                          </div>
                          {project.previewUrl && (
                            <div className="flex items-center gap-1 text-green-400">
                              <div className="w-2 h-2 bg-green-400 rounded-full" />
                              <span>Live</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleContinueProject(project)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 via-purple-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/30 group-hover:shadow-lg"
                          >
                            Continue Building
                          </button>
                          {project.previewUrl && (
                            <a
                              href={project.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-3 bg-gray-800/90 text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-700 transition-all duration-200 flex items-center gap-2 border border-gray-600/50 hover:border-gray-500 hover:text-white"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              View
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}