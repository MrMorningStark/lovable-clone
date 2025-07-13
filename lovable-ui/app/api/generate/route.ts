import { NextRequest } from "next/server";
import { query } from "@anthropic-ai/claude-code";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[API] Starting code generation for prompt:", prompt);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const abortController = new AbortController();
          let messageCount = 0;

          for await (const message of query({
            prompt: prompt,
            abortController: abortController,
            options: {
              maxTurns: 10,
              allowedTools: [
                "Read",
                "Write",
                "Edit",
                "MultiEdit",
                "Bash",
                "LS",
                "Glob",
                "Grep",
                "WebSearch",
                "WebFetch"
              ]
            }
          })) {
            messageCount++;
            console.log(`[API] Message ${messageCount} - Type: ${message.type}`);

            if (message.type === 'tool_use') {
              console.log(`[API] Tool use: ${(message as any).name}`);
            } else if (message.type === 'result') {
              console.log(`[API] Result: ${(message as any).subtype}`);
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(message)}`)
            );
          }

          console.log(`[API] Generation complete. Total messages: ${messageCount}`);
          controller.enqueue(encoder.encode("data: [DONE]"));
        } catch (error: any) {
          console.error("[API] Error during generation:", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}

`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
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