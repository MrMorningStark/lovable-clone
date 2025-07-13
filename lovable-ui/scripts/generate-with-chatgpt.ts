import { Daytona } from "@daytonaio/sdk";
import * as dotenv from "dotenv";
import * as path from "path";
import { OpenAI } from "openai";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function generateWebsiteInDaytona(
  sandboxIdArg?: string,
  prompt?: string
) {
  console.log("🚀 Starting website generation in Daytona sandbox with ChatGPT...\n");

  if (!process.env.DAYTONA_API_KEY || !process.env.OPENAI_API_KEY) {
    console.error("ERROR: DAYTONA_API_KEY and OPENAI_API_KEY must be set");
    process.exit(1);
  }

  const daytona = new Daytona({
    apiKey: process.env.DAYTONA_API_KEY,
  });

  let sandbox;
  let sandboxId = sandboxIdArg;

  try {
    if (sandboxId) {
      console.log(`1. Using existing sandbox: ${sandboxId}`);
      const sandboxes = await daytona.list();
      sandbox = sandboxes.find((s: any) => s.id === sandboxId);
      if (!sandbox) {
        throw new Error(`Sandbox ${sandboxId} not found`);
      }
      console.log(`✓ Connected to sandbox: ${sandbox.id}`);
    } else {
      console.log("1. Creating new Daytona sandbox...");
      sandbox = await daytona.create({
        public: true,
        image: "node:20",
      });
      sandboxId = sandbox.id;
      console.log(`✓ Sandbox created: ${sandboxId}`);
    }

    const rootDir = await sandbox.getUserRootDir();
    console.log(`✓ Working directory: ${rootDir}`);

    console.log("\n2. Setting up project directory...");
    const projectDir = `${rootDir}/website-project`;
    await sandbox.process.executeCommand(`mkdir -p ${projectDir}`, rootDir);
    console.log(`✓ Created project directory: ${projectDir}`);

    console.log("\n3. Initializing npm project...");
    await sandbox.process.executeCommand("npm init -y", projectDir);
    console.log("✓ Package.json created");

    console.log("\n4. Installing OpenAI SDK locally...");
    const installResult = await sandbox.process.executeCommand(
      "npm install openai@latest",
      projectDir,
      undefined,
      180000
    );

    if (installResult.exitCode !== 0) {
      console.error("Installation failed:", installResult.result);
      throw new Error("Failed to install OpenAI SDK");
    }
    console.log("✓ OpenAI SDK installed");

    console.log("\n5. Generating code with ChatGPT...");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const chatGptPrompt = `You are an expert web developer. Your task is to generate a complete web application based on the user's prompt. 
    
    Here's the user's request:
    "${prompt || "Create a modern blog website with markdown support and a dark theme"}"
    
    Important requirements:
    - Create a NextJS app with TypeScript and Tailwind CSS
    - Use the app directory structure
    - Generate all necessary files, including package.json with all dependencies, tsconfig.json, next.config.js, postcss.config.js, tailwind.config.js, and all relevant Next.js pages and components.
    - Make the design modern and responsive.
    - Add at least a home page and one other page.
    - Include proper navigation between pages.
    
    For each file, provide the file path relative to the project root, followed by the content of the file. Use the following format:
    
    \`\`\`filepath: <path/to/file>
    <file content>
    \`\`\`
    
    Example:
    
    \`\`\`filepath: package.json
    {
      "name": "my-app",
      "version": "0.1.0",
      "private": true,
      "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
      },
      "dependencies": {
        "next": "^14.0.0",
        "react": "^18",
        "react-dom": "^18"
      },
      "devDependencies": {
        "autoprefixer": "^10.0.1",
        "postcss": "^8",
        "tailwindcss": "^3.3.0",
        "typescript": "^5",
        "@types/node": "^20",
        "@types/react": "^18",
        "@types/react-dom": "^18"
      }
    }
    \`\`\`
    
    \`\`\`filepath: app/page.tsx
    export default function Home() {
      return (
        <main>
          <h1>Hello, Next.js!</h1>
        </main>
      );
    }
    \`\`\`
    
    Generate the complete project structure and all file contents now. Start with package.json.
    `;

    console.log("Sending prompt to ChatGPT...");
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4", // Or gpt-3.5-turbo
      messages: [{ role: "user", content: chatGptPrompt }],
      temperature: 0.7,
    });

    const generatedContent = chatCompletion.choices[0].message.content;
    if (!generatedContent) {
      throw new Error("ChatGPT did not return any content.");
    }
    console.log("✓ Received content from ChatGPT.");

    // Parse the generated content into files
    const files: { path: string; content: string }[] = [];
    const fileRegex = /```filepath: (\S+)\n([\s\S]*?)\n```/g;
    let match;

    while ((match = fileRegex.exec(generatedContent)) !== null) {
      files.push({
        path: match[1],
        content: match[2].trim(),
      });
    }

    if (files.length === 0) {
      throw new Error("No files were generated by ChatGPT. Please refine the prompt.");
    }

    console.log(`\n6. Writing ${files.length} files to sandbox...`);
    for (const file of files) {
      const filePath = path.join(projectDir, file.path);
      const dirName = path.dirname(filePath);

      // Create directory if it doesn't exist
      await sandbox.process.executeCommand(`mkdir -p ${dirName}`, rootDir);

      // Write file content
      await sandbox.process.executeCommand(
        `cat > ${filePath} << 'EOF_FILE_CONTENT'\n${file.content}\nEOF_FILE_CONTENT`,
        rootDir
      );
      console.log(`✓ Wrote ${file.path}`);
    }

    console.log("\n7. Checking generated files...");
    const filesResult = await sandbox.process.executeCommand(
      "ls -la",
      projectDir
    );
    console.log(filesResult.result);

    const hasNextJS = await sandbox.process.executeCommand(
      "test -f package.json && grep -q next package.json && echo yes || echo no",
      projectDir
    );

    if (hasNextJS.result?.trim() === "yes") {
      console.log("\n8. Installing project dependencies...");
      const npmInstall = await sandbox.process.executeCommand(
        "npm install",
        projectDir,
        undefined,
        300000
      );

      if (npmInstall.exitCode !== 0) {
        console.log("Warning: npm install had issues:", npmInstall.result);
      } else {
        console.log("✓ Dependencies installed");
      }

      console.log("\n9. Starting development server in background...");

      await sandbox.process.executeCommand(
        `nohup npm run dev > dev-server.log 2>&1 &`,
        projectDir,
        { PORT: "3000" }
      );

      console.log("✓ Server started in background");

      console.log("Waiting for server to start...");
      await new Promise((resolve) => setTimeout(resolve, 8000));

      const checkServer = await sandbox.process.executeCommand(
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'failed'",
        projectDir
      );

      if (checkServer.result?.trim() === '200') {
        console.log("✓ Server is running!");
      } else {
        console.log("⚠️  Server might still be starting...");
        console.log("You can check logs with: cat dev-server.log");
      }
    }

    console.log("\n10. Getting preview URL...");
    const preview = await sandbox.getPreviewLink(3000);

    console.log("\n✨ SUCCESS! Website generated!");
    console.log("\n📊 SUMMARY:");
    console.log("===========");
    console.log(`Sandbox ID: ${sandboxId}`);
    console.log(`Project Directory: ${projectDir}`);
    console.log(`Preview URL: ${preview.url}`);
    if (preview.token) {
      console.log(`Access Token: ${preview.token}`);
    }

    console.log("\n🌐 VISIT YOUR WEBSITE:");
    console.log(preview.url);

    return {
      success: true,
      sandboxId: sandboxId,
      projectDir: projectDir,
      previewUrl: preview.url,
    };
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);

    if (sandbox) {
      console.log(`\nSandbox ID: ${sandboxId}`);
      console.log("The sandbox is still running for debugging.");
    }

    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  let sandboxId: string | undefined;
  let prompt: string | undefined;

  if (args.length > 0) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(args[0])) {
      sandboxId = args[0];
      prompt = args.slice(1).join(" ");
    } else {
      prompt = args.join(" ");
    }
  }

  if (!prompt) {
    prompt =
      "Create a modern blog website with markdown support and a dark theme. Include a home page, blog listing page, and individual blog post pages.";
  }

  console.log("📝 Configuration:");
  console.log(
    `- Sandbox: ${sandboxId ? `Using existing ${sandboxId}` : "Creating new"}`
  );
  console.log(`- Prompt: ${prompt}`);
  console.log();

  try {
    await generateWebsiteInDaytona(sandboxId, prompt);
  } catch (error) {
    console.error("Failed to generate website:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  console.log("\n\n👋 Exiting... The sandbox will continue running.");
  process.exit(0);
});

main();