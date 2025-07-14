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
  const [selectedModel, setSelectedModel] = useState('rajataiagent');

  const handleContinueProject = (project: any) => {
    // Navigate to generate page with existing sandbox
    router.push(`/generate?prompt=${encodeURIComponent(project.prompt)}&sandboxId=${project.sandboxId}&continue=true`);
  };

  const handleNewProject = () => {
    if (!prompt.trim()) return;
    // Navigate to generate page with new prompt and selected model
    router.push(`/generate?prompt=${encodeURIComponent(prompt)}&model=${selectedModel}`);
  };

  const handleDeleteProject = async (project: any) => {
    if (!window.confirm(`Are you sure you want to delete the project "${project.name}"?`)) {
      return;
    }

    try {
      const response = await fetch("/api/delete-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sandboxId: project.sandboxId, userId: user.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete project");
      }

      // Remove project from user's projects
      const updatedProjects = user.projects.filter((p) => p.id !== project.id);
      const updatedUser = { ...user, projects: updatedProjects };

      // Update user data in local storage
      localStorage.setItem("lovable_current_user", JSON.stringify(updatedUser));

      // Update users database in local storage
      const users = JSON.parse(localStorage.getItem("lovable_users") || "{}");
      if (users[user.email]) {
        users[user.email].projects = updatedProjects;
        localStorage.setItem("lovable_users", JSON.stringify(users));
      }

      // Update the UI
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    }
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back, {user.name.split(' ')[0]}!</h1>
              <p className="text-gray-400 mt-1">Start a new project or continue an existing one.</p>
            </div>
            <button
              onClick={handleNewProject}
              disabled={!prompt.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
            >
              Create New Project
            </button>
          </div>

          {/* Prompt input for new project */}
          <div className="mb-12">
            <div className="relative">
              <textarea
                placeholder="What do you want to build today? For example: a todo list app with react and tailwindcss"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleNewProject();
                  }
                }}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button onClick={() => setSelectedModel('code')} className={`px-4 py-2 text-sm rounded-lg transition-colors ${selectedModel === 'code' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Code</button>
            <button onClick={() => setSelectedModel('rajataiagent')} className={`px-4 py-2 text-sm rounded-lg transition-colors ${selectedModel === 'rajataiagent' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>RajatAiAgent</button>
          </div>

          {/* Existing Projects */}
          {user.projects.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Your Projects</h2>
              <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-700/60 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Project</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Prompt</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/50 divide-y divide-gray-700">
                    {user.projects.map((project) => (
                      <tr key={project.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{project.name}</div>
                          <div className="text-xs text-gray-400">ID: {project.sandboxId.slice(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4 max-w-sm">
                          <p className="text-sm text-gray-300 truncate">{project.prompt}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(project.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {project.previewUrl ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-300">
                              Live
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleContinueProject(project)} className="text-purple-400 hover:text-purple-300 mr-4">Continue</button>
                          {project.previewUrl && (
                            <a href={project.previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">View</a>
                          )}
                          <button onClick={() => handleDeleteProject(project)} className="text-red-400 hover:text-red-300 ml-4">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-2xl">
                <h2 className="text-2xl font-bold text-white mb-4">You have no projects yet</h2>
                <p className="text-gray-400 mb-8">Start by entering a prompt above and creating your first project.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}