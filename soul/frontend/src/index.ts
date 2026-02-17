import { Command } from "commander";
import { loadConfig, saveConfig } from "./config";
import { ApiClient } from "./api-client";
import { startRepl } from "./cli";

const program = new Command();

program
  .name("soul-ai")
  .description("CLI frontend for Soul AI")
  .version("0.1.0");

program
  .command("chat")
  .description("Start interactive chat session")
  .option("-u, --url <url>", "Backend URL")
  .action(async (opts) => {
    const config = loadConfig();
    if (opts.url) {
      config.backendUrl = opts.url;
      saveConfig(config);
    }
    const client = new ApiClient(config.backendUrl);
    await startRepl(client);
  });

program
  .command("config")
  .description("Set backend URL")
  .argument("<url>", "Backend URL (e.g. http://localhost:8000)")
  .action((url) => {
    const config = loadConfig();
    config.backendUrl = url;
    saveConfig(config);
    console.log(`Backend URL set to: ${url}`);
  });

// Default to chat if no command given
program.action(async () => {
  const config = loadConfig();
  const client = new ApiClient(config.backendUrl);
  await startRepl(client);
});

program.parse();
