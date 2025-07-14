import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    console.log("🔄 API: Starting generation request");

    const { prompt, sandboxId, isFollowUp, model } = await req.json();

    console.log("📝 API: Received prompt:", prompt);
    console.log("📦 API: Received sandboxId:", sandboxId);
    console.log("🔄 API: isFollowUp:", isFollowUp);
    console.log("🤖 API: Selected model:", model);

    if (!prompt) {
      console.error("❌ API: No prompt provided");
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if ((model === 'claude' && !process.env.ANTHROPIC_API_KEY) || (model === 'chatgpt' && !process.env.OPENAI_API_KEY) || (model === 'lovable')) {
      console.error(`❌ API: Missing API key for ${model}`);
      return new Response(
        JSON.stringify({ error: `Missing API key for ${model}. Please check your environment variables.` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[API] Starting ${isFollowUp ? 'follow-up' : 'initial'} generation for prompt:`, prompt);
    if (isFollowUp && !sandboxId) {
      return new Response(
        JSON.stringify({ error: "Sandbox ID is required for follow-up requests" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
      try {
        const scriptName = model === 'chatgpt' ? "generate-with-chatgpt.ts" : model === 'lovable' ? "generate-with-lovable.ts" : "generate-in-daytona.ts";
        const scriptPath = path.join(process.cwd(), "scripts", scriptName);

        console.log("📄 API: Script path:", scriptPath);

        const args = isFollowUp
          ? ["tsx", scriptPath, sandboxId, prompt]
          : sandboxId
            ? ["tsx", scriptPath, sandboxId, prompt]
            : ["tsx", scriptPath, prompt];

        console.log("🚀 API: Spawning process with args:", args);

        const child = spawn("npx", args, {
          env: {
            ...process.env,
            DAYTONA_API_KEY: process.env.DAYTONA_API_KEY,
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
          },
        });

        let responseSandboxId = "";
        let previewUrl = "";
        let buffer = "";

        child.stdout.on("data", async (data) => {
          buffer += data.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            if (line.includes('__CLAUDE_MESSAGE__')) {
              const jsonStart = line.indexOf('__CLAUDE_MESSAGE__') + '__CLAUDE_MESSAGE__'.length;
              try {
                const message = JSON.parse(line.substring(jsonStart).trim());
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({
                    type: "claude_message",
                    content: message.content
                  })}\n\n`)
                );
              } catch (e) {
              }
            }
            else if (line.includes('__TOOL_USE__')) {
              const jsonStart = line.indexOf('__TOOL_USE__') + '__TOOL_USE__'.length;
              try {
                const toolUse = JSON.parse(line.substring(jsonStart).trim());
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({
                    type: "tool_use",
                    name: toolUse.name,
                    input: toolUse.input
                  })}\n\n`)
                );
              } catch (e) {
              }
            }
            else if (line.includes('__TOOL_RESULT__')) {
              continue;
            }
            else {
              const output = line.trim();

              if (output &&
                !output.includes('[Claude]:') &&
                !output.includes('[Tool]:') &&
                !output.includes('__')) {

                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({
                    type: "progress",
                    message: output
                  })}\n\n`)
                );

                const sandboxMatch = output.match(/Sandbox created: ([a-f0-9-]+)/);
                if (sandboxMatch) {
                  responseSandboxId = sandboxMatch[1];
                }

                const previewMatch = output.match(/Preview URL: (https:\/\/[^\s]+)/);
                if (previewMatch) {
                  previewUrl = previewMatch[1];
                }
              }
            }
          }
        });

        child.stderr.on("data", async (data) => {
          const error = data.toString();
          console.error("[Daytona Error]:", error);

          if (error.includes("Error") || error.includes("Failed")) {
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({
                type: "error",
                message: error.trim()
              })}\n\n`)
            );
          }
        });

        await new Promise((resolve, reject) => {
          child.on("exit", (code) => {
            console.log(`🏁 API: Process exited with code ${code}`);
            if (code === 0) {
              resolve(code);
            } else {
              reject(new Error(`Process exited with code ${code}`));
            }
          });

          child.on("error", (error) => {
            console.error("❌ API: Child process error:", error);
            reject(error);
          });
        });

        if (previewUrl) {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({
              type: "complete",
              sandboxId: responseSandboxId,
              previewUrl
            })}\n\n`)
          );
          console.log(`[API] Generation complete. Preview URL: ${previewUrl}`);
        } else {
          throw new Error("Failed to get preview URL");
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (error: any) {
        console.error("[API] Error during generation:", error);
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: "error",
            message: error.message
          })}\n\n`)
        );
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("[API] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}