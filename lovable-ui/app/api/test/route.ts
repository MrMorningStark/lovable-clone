import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("🧪 Test API endpoint called");
  
  return new Response(
    JSON.stringify({ 
      message: "API is working!",
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        daytonaKey: !!process.env.DAYTONA_API_KEY,
        anthropicKey: !!process.env.ANTHROPIC_API_KEY
      }
    }),
    { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("🧪 Test POST endpoint called with body:", body);
    
    return new Response(
      JSON.stringify({ 
        message: "POST API is working!",
        receivedBody: body,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("❌ Test POST error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}