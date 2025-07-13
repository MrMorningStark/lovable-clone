import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { sandboxId, userId } = await req.json();

    if (!sandboxId || !userId) {
      return new Response(
        JSON.stringify({ error: "sandboxId and userId are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const scriptPath = path.join(process.cwd(), "scripts", "remove-sandbox.ts");

    const child = spawn("npx", ["tsx", scriptPath, sandboxId], {
      env: {
        ...process.env,
        DAYTONA_API_KEY: process.env.DAYTONA_API_KEY,
      },
    });

    child.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    const exitCode = await new Promise((resolve, reject) => {
      child.on("exit", (code) => {
        resolve(code);
      });
      child.on("error", (error) => {
        reject(error);
      });
    });

    if (exitCode !== 0) {
        return new Response(
            JSON.stringify({ error: "Failed to delete sandbox" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ message: "Project deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
