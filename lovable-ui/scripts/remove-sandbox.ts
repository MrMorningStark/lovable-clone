import { Daytona } from "@daytonaio/sdk";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function removeSandbox(sandboxId: string) {
  console.log(`🔥 Deleting sandbox: ${sandboxId}`);

  if (!process.env.DAYTONA_API_KEY) {
    console.error("ERROR: DAYTONA_API_KEY must be set");
    process.exit(1);
  }

  const daytona = new Daytona({
    apiKey: process.env.DAYTONA_API_KEY,
  });

  try {
    await daytona.delete(sandboxId);
    console.log(`✓ Sandbox ${sandboxId} deleted`);
  } catch (error: any) {
    console.error(`❌ ERROR: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error("Usage: tsx scripts/remove-sandbox.ts <sandbox-id>");
    process.exit(1);
  }

  const sandboxId = args[0];
  await removeSandbox(sandboxId);
}

main();
