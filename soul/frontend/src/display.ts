import chalk from "chalk";
import { ChatResponse, LearningResponse } from "./types";

const SEPARATOR = chalk.gray("━".repeat(40));

export function displayResponse(res: ChatResponse): void {
  console.log();
  console.log(SEPARATOR);
  console.log(chalk.bold("  Soul AI Response"));
  console.log(SEPARATOR);
  console.log();

  // Manas
  const valenceStr =
    res.manas.valence >= 0
      ? chalk.green(`+${res.manas.valence.toFixed(2)}`)
      : chalk.red(res.manas.valence.toFixed(2));
  console.log(
    chalk.magentaBright.bold("[Mind (Manas)]") +
      `  confidence: ${chalk.yellow(res.manas.confidence.toFixed(2))}` +
      `  valence: ${valenceStr}`
  );
  console.log(chalk.magenta(res.manas.response));
  console.log();

  // Buddhi
  console.log(
    chalk.cyanBright.bold("[Intellect (Buddhi)]") +
      `  confidence: ${chalk.yellow(res.buddhi.confidence.toFixed(2))}`
  );
  console.log(chalk.cyan(res.buddhi.response));
  if (res.buddhi.reasoning_chain.length > 0) {
    console.log(
      chalk.gray("  Reasoning: " + res.buddhi.reasoning_chain.join(" → "))
    );
  }
  console.log();

  // Sanskaras
  console.log(
    chalk.greenBright.bold("[Habits (Sanskaras)]") +
      `  confidence: ${chalk.yellow(res.sanskaras.confidence.toFixed(2))}`
  );
  if (res.sanskaras.activated_habits.length > 0) {
    const habitsStr = res.sanskaras.activated_habits
      .map((h) => `${h.name} (w:${h.weight.toFixed(1)})`)
      .join(", ");
    console.log(chalk.gray(`  Activated: ${habitsStr}`));
  }
  console.log(chalk.green(res.sanskaras.response));
  console.log();

  // Synthesis
  const weightsStr = Object.entries(res.synthesis.weights)
    .map(([k, v]) => `${k}=${(v * 100).toFixed(0)}%`)
    .join(" ");
  console.log(
    chalk.yellowBright.bold("[Soul (Synthesized)]") +
      `  weights: ${chalk.gray(weightsStr)}`
  );
  console.log(chalk.white.bold(res.synthesis.response));

  console.log();
  console.log(
    SEPARATOR +
      chalk.gray(` ${res.elapsed_ms}ms `) +
      SEPARATOR
  );
  console.log();
}

export function displayError(message: string): void {
  console.log(chalk.red(`\nError: ${message}\n`));
}

export function displayInfo(message: string): void {
  console.log(chalk.blue(`\n${message}\n`));
}

export function displayTrainerNeeded(res: ChatResponse): void {
  console.log();
  console.log(SEPARATOR);
  console.log(chalk.yellowBright.bold("  Soul needs trainer guidance"));
  console.log(SEPARATOR);
  console.log();

  if (res.trainer_needed) {
    console.log(chalk.yellow(`  Question: ${res.trainer_needed.trigger_summary}`));
    console.log(chalk.gray(`  Context: "${res.trainer_needed.question_context}"`));
    console.log(chalk.gray(`  Learning ID: ${res.trainer_needed.learning_id}`));
  }

  console.log();
  console.log(
    chalk.yellowBright(
      "  Use the trainer mode to provide guidance: npm start -- train"
    )
  );
  console.log();
  console.log(
    SEPARATOR +
      chalk.gray(` ${res.elapsed_ms}ms `) +
      SEPARATOR
  );
  console.log();
}

export function displayLearning(l: LearningResponse): void {
  const statusColor =
    l.status === "active" ? chalk.green : l.status === "pending" ? chalk.yellow : chalk.gray;
  console.log(
    `  ${chalk.bold(`#${l.id}`)} ${statusColor(`[${l.status}]`)} ${l.trigger_summary}`
  );
  if (l.guidance) {
    console.log(chalk.gray(`    Guidance: ${l.guidance}`));
  }
  if (l.application_note) {
    console.log(chalk.gray(`    Note: ${l.application_note}`));
  }
  console.log(
    chalk.gray(
      `    Keywords: ${l.keywords} | Modules: ${l.modules_informed} | Boost: ${l.confidence_boost} | Applied: ${l.times_applied}x`
    )
  );
}
