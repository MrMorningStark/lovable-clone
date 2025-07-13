"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Auth from "@/components/Auth";
import Dashboard from "@/components/Dashboard";

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

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing user on mount
  useEffect(() => {
    const currentUser = localStorage.getItem("lovable_current_user");
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        setUser(userData);
      } catch (e) {
        localStorage.removeItem("lovable_current_user");
      }
    }
    setLoading(false);
  }, []);


  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("lovable_current_user");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Dashboard 
      user={user} 
      onLogout={handleLogout}
    />
  );
}
