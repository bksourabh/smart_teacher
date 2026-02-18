import * as readline from "readline";
import chalk from "chalk";
import { ApiClient } from "./api-client";
import { displayError, displayInfo, displayLearning } from "./display";

export async function startTrainerRepl(client: ApiClient): Promise<void> {
  const healthy = await client.health();
  if (!healthy) {
    displayError(
      "Cannot connect to Soul AI backend. Is it running on the configured URL?"
    );
    process.exit(1);
  }

  displayInfo("Connected to Soul AI — Trainer Mode");
  console.log(chalk.gray("Commands:"));
  console.log(chalk.gray("  /pending              — View questions awaiting guidance"));
  console.log(chalk.gray("  /respond <id>         — Respond to a pending learning"));
  console.log(chalk.gray("  /learnings            — View all active learnings"));
  console.log(chalk.gray("  /teach                — Proactively teach the soul"));
  console.log(chalk.gray("  /enable               — Enable learning mode"));
  console.log(chalk.gray("  /disable              — Disable learning mode"));
  console.log(chalk.gray("  /threshold <value>    — Set confidence threshold"));
  console.log(chalk.gray("  /quit                 — Exit trainer mode"));
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (question: string): Promise<string> =>
    new Promise((resolve) => rl.question(question, resolve));

  const prompt = (): void => {
    rl.question(chalk.yellowBright.bold("Trainer: "), async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        prompt();
        return;
      }

      try {
        if (trimmed === "/quit" || trimmed === "/exit") {
          console.log(chalk.gray("\nNamaste, teacher.\n"));
          rl.close();
          process.exit(0);
        }

        if (trimmed === "/pending") {
          const pending = await client.getPendingLearnings();
          if (pending.length === 0) {
            console.log(chalk.green("\n  No pending questions. The soul is at peace.\n"));
          } else {
            console.log(chalk.yellow(`\n  ${pending.length} question(s) awaiting guidance:\n`));
            for (const l of pending) {
              displayLearning(l);
              console.log();
            }
          }
          prompt();
          return;
        }

        if (trimmed === "/learnings") {
          const learnings = await client.getActiveLearnings();
          if (learnings.length === 0) {
            console.log(chalk.gray("\n  No active learnings yet.\n"));
          } else {
            console.log(chalk.blue(`\n  ${learnings.length} active learning(s):\n`));
            for (const l of learnings) {
              displayLearning(l);
              console.log();
            }
          }
          prompt();
          return;
        }

        if (trimmed.startsWith("/respond")) {
          const parts = trimmed.split(/\s+/);
          const id = parseInt(parts[1], 10);
          if (isNaN(id)) {
            displayError("Usage: /respond <id>");
            prompt();
            return;
          }

          const guidance = await ask(chalk.gray("  Guidance: "));
          const applicationNote = await ask(chalk.gray("  Application note (concise directive): "));
          const modulesStr = await ask(chalk.gray("  Modules (all/manas,buddhi,sanskaras): "));
          const boostStr = await ask(chalk.gray("  Confidence boost (0-1, default 0.5): "));

          const result = await client.respondToLearning(id, {
            guidance: guidance.trim(),
            application_note: applicationNote.trim(),
            modules_informed: modulesStr.trim() || "all",
            confidence_boost: parseFloat(boostStr) || 0.5,
          });

          console.log(chalk.green(`\n  Learning #${result.id} activated!\n`));
          displayLearning(result);
          console.log();
          prompt();
          return;
        }

        if (trimmed === "/teach") {
          const summary = await ask(chalk.gray("  What are you teaching? (trigger summary): "));
          const keywords = await ask(chalk.gray("  Keywords (comma-separated): "));
          const guidance = await ask(chalk.gray("  Guidance: "));
          const note = await ask(chalk.gray("  Application note (concise directive): "));
          const modulesStr = await ask(chalk.gray("  Modules (all/manas,buddhi,sanskaras): "));
          const boostStr = await ask(chalk.gray("  Confidence boost (0-1, default 0.5): "));

          const result = await client.createLearning({
            trigger_summary: summary.trim(),
            keywords: keywords.trim(),
            guidance: guidance.trim(),
            application_note: note.trim(),
            modules_informed: modulesStr.trim() || "all",
            confidence_boost: parseFloat(boostStr) || 0.5,
          });

          console.log(chalk.green(`\n  Learning #${result.id} created and active!\n`));
          displayLearning(result);
          console.log();
          prompt();
          return;
        }

        if (trimmed === "/enable") {
          await client.updateConfig({ learning_mode_enabled: true } as any);
          console.log(chalk.green("\n  Learning mode enabled.\n"));
          prompt();
          return;
        }

        if (trimmed === "/disable") {
          await client.updateConfig({ learning_mode_enabled: false } as any);
          console.log(chalk.yellow("\n  Learning mode disabled.\n"));
          prompt();
          return;
        }

        if (trimmed.startsWith("/threshold")) {
          const parts = trimmed.split(/\s+/);
          const val = parseFloat(parts[1]);
          if (isNaN(val) || val < 0 || val > 1) {
            displayError("Usage: /threshold <0.0-1.0>");
            prompt();
            return;
          }
          await client.updateConfig({ confidence_threshold: val } as any);
          console.log(chalk.green(`\n  Confidence threshold set to ${val}.\n`));
          prompt();
          return;
        }

        console.log(chalk.gray("\n  Unknown command. Type /pending, /teach, /learnings, or /quit.\n"));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        displayError(message);
      }

      prompt();
    });
  };

  prompt();
}
