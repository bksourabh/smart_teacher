import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { SoulConfig } from "./types";

const CONFIG_PATH = path.join(os.homedir(), ".soulai.json");

const DEFAULT_CONFIG: SoulConfig = {
  backendUrl: "http://localhost:8000",
};

export function loadConfig(): SoulConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // Fall through to default
  }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: SoulConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}
