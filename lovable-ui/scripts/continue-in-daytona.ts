import { Daytona } from "@daytonaio/sdk";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function continueGenerationInDaytona(
  sandboxId: string,
  prompt: string
) {
  console.log(`🔄 Continuing generation in Daytona sandbox: ${sandboxId}\n`);

  if (!process.env.DAYTONA_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: DAYTONA_API_KEY and ANTHROPIC_API_KEY must be set");
    process.exit(1);
  }

  const daytona = new Daytona({
    apiKey: process.env.DAYTONA_API_KEY,
  });

  let sandbox;

  try {
    // Step 1: Get existing sandbox
    console.log(`1. Connecting to existing sandbox: ${sandboxId}`);
    const sandboxes = await daytona.list();
    sandbox = sandboxes.find((s: any) => s.id === sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }
    console.log(`✓ Connected to sandbox: ${sandbox.id}`);

    // Get the root directory
    const rootDir = await sandbox.getUserRootDir();
    console.log(`✓ Working directory: ${rootDir}`);

    // Step 2: Initialize Claude Code in the existing project
    console.log("2. Initializing Claude Code for follow-up...");
    
    const claudeCodePath = `${rootDir}/my-app`;
    
    // Step 3: Run Claude Code with the follow-up prompt
    console.log("3. Processing follow-up request with Claude Code...");
    
    try {
      await sandbox.exec(
        `cd ${claudeCodePath} && echo "${prompt}" | npx @anthropic-ai/claude-code`,
        {
          env: {
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
            NO_UPDATE_NOTIFIER: "1",
            TERM: "xterm-256color"
          },
          onData: (data: string) => {
            // Parse and forward Claude messages
            const output = data.toString();
            
            // Handle Claude messages
            if (output.includes('[Claude]:')) {
              const messageMatch = output.match(/\\[Claude\\]:\\s*(.+)/);
              if (messageMatch) {
                const content = messageMatch[1].trim();
                console.log(`__CLAUDE_MESSAGE__${JSON.stringify({ content })}`);
              }
            }
            
            // Handle tool uses
            if (output.includes('[Tool]:')) {
              const toolMatch = output.match(/\\[Tool\\]:\\s*(.+)/);
              if (toolMatch) {
                try {
                  const toolData = JSON.parse(toolMatch[1]);
                  console.log(`__TOOL_USE__${JSON.stringify(toolData)}`);
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
            
            // Regular output
            if (!output.includes('[Claude]:') && !output.includes('[Tool]:')) {
              console.log(output.trim());
            }
          },
        }
      );
    } catch (error: any) {
      console.error("Failed to run Claude Code:", error.message);
      
      // Fallback: show that the change request was received
      console.log(`__CLAUDE_MESSAGE__${JSON.stringify({ 
        content: `I've received your request: "${prompt}". However, I encountered an issue processing it in the current sandbox. The development server should still be running with your previous changes.` 
      })}`);
    }

    // Step 4: Get the preview URL (should still be the same)
    console.log("4. Retrieving preview URL...");
    
    const previewUrl = await getPreviewUrl(sandbox);
    if (previewUrl) {
      console.log(`Preview URL: ${previewUrl}`);
    } else {
      console.log("Preview URL not available");
    }

  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

async function getPreviewUrl(sandbox: any): Promise<string | null> {
  try {
    // Get the preview URL from Daytona
    const previewUrl = await sandbox.getPreviewLink(3000);
    return previewUrl;
  } catch (error) {
    console.error("Failed to get preview URL:", error);
    return null;
  }
}

// Parse command line arguments
const sandboxId = process.argv[2];
const prompt = process.argv[3];

if (!sandboxId || !prompt) {
  console.error("Usage: npx tsx continue-in-daytona.ts <sandbox-id> <prompt>");
  process.exit(1);
}

// Run the function
continueGenerationInDaytona(sandboxId, prompt)
  .then(() => {
    console.log("✅ Follow-up generation completed successfully!");
  })
  .catch((error) => {
    console.error("❌ Follow-up generation failed:", error);
    process.exit(1);
  });