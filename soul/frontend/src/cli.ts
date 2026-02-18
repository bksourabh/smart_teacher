import * as readline from "readline";
import chalk from "chalk";
import { ApiClient } from "./api-client";
import {
  displayResponse,
  displayError,
  displayInfo,
  displayTrainerNeeded,
} from "./display";

export async function startRepl(client: ApiClient): Promise<void> {
  const healthy = await client.health();
  if (!healthy) {
    displayError(
      "Cannot connect to Soul AI backend. Is it running on the configured URL?"
    );
    process.exit(1);
  }

  displayInfo("Connected to Soul AI backend.");
  console.log(chalk.gray("Commands: /config, /habits, /weights, /quit"));
  console.log(chalk.gray("Type anything else to chat with Soul AI."));
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (): void => {
    rl.question(chalk.whiteBright.bold("You: "), async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        prompt();
        return;
      }

      try {
        if (trimmed === "/quit" || trimmed === "/exit") {
          console.log(chalk.gray("\nNamaste. 🙏\n"));
          rl.close();
          process.exit(0);
        }

        if (trimmed === "/config") {
          const config = await client.getConfig();
          console.log(chalk.blue("\nCurrent configuration:"));
          console.log(JSON.stringify(config, null, 2));
          console.log();
          prompt();
          return;
        }

        if (trimmed === "/habits") {
          const habits = await client.getHabits();
          console.log(chalk.blue(`\n${habits.length} habits loaded:`));
          for (const h of habits) {
            console.log(
              chalk.gray(
                `  [${h.category}] ${h.name} (w:${h.effective_weight.toFixed(1)}, rep:${h.repetition_count})`
              )
            );
          }
          console.log();
          prompt();
          return;
        }

        if (trimmed === "/weights") {
          const config = await client.getConfig();
          console.log(chalk.blue("\nModule weights:"));
          console.log(
            `  Manas (Mind):       ${(config.weight_manas * 100).toFixed(0)}%`
          );
          console.log(
            `  Buddhi (Intellect): ${(config.weight_buddhi * 100).toFixed(0)}%`
          );
          console.log(
            `  Sanskaras (Habits): ${(config.weight_sanskaras * 100).toFixed(0)}%`
          );
          console.log();
          prompt();
          return;
        }

        // Chat
        console.log(chalk.gray("\nThinking..."));
        const response = await client.chat(trimmed);
        if (response.mode === "needs_trainer") {
          displayTrainerNeeded(response);
        } else {
          displayResponse(response);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        displayError(message);
      }

      prompt();
    });
  };

  prompt();
}
