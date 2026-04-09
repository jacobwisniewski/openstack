import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as YAML from "yaml";
import { validateConfig, type ValidatedOpenStackConfig } from "./validation";

const PACKAGE_JSON_PATH = path.join(__dirname, "..", "package.json");
export const PACKAGE_VERSION = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf-8")).version;

export const OPENSTACK_DIR = path.join(os.homedir(), ".config", "openstack");
export const OPENCODE_DIR = path.join(os.homedir(), ".config", "opencode");
export const CONFIG_FILE = path.join(OPENSTACK_DIR, "config.yaml");
export const PROFILES_DIR = path.join(OPENSTACK_DIR, "profiles");

export interface OpenStackConfig {
  version: string;
  active_profile: string;
  profiles: ProfileEntry[];
}

export interface ProfileEntry {
  name: string;
  source: string;
  installed_at: string;
}

export function error(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

export function isInitialized(): boolean {
  return fs.existsSync(CONFIG_FILE);
}

export function requireInit(): void {
  if (!isInitialized()) {
    error("openstack not initialized. Run 'openstack init' first to backup your current config.");
  }
}

export function loadConfig(): ValidatedOpenStackConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    error("Config file not found. Run 'openstack init' first.");
  }
  const content = fs.readFileSync(CONFIG_FILE, "utf-8");
  const rawConfig = YAML.parse(content);

  const validationResult = validateConfig(rawConfig);
  if (validationResult.isErr()) {
    error(`Invalid config: ${validationResult.error}`);
  }
  return validationResult.value;
}

export function saveConfig(config: OpenStackConfig): void {
  const content = `version: "${config.version}"
active_profile: "${config.active_profile}"
profiles:
${config.profiles
  .map(
    (p) =>
      `  - name: "${p.name}"\n    source: "${p.source}"\n    installed_at: "${p.installed_at}"`,
  )
  .join("\n")}
`;
  fs.writeFileSync(CONFIG_FILE, content);
}

export function copyDir(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Init command logic
export interface InitOptions {
  force: boolean;
}

export function init(options: InitOptions): void {
  // Check if opencode exists
  if (!fs.existsSync(path.join(OPENCODE_DIR, "AGENTS.md"))) {
    error("OpenCode config not found. Make sure opencode is installed and configured.");
  }

  // Check if already initialized
  if (isInitialized() && !options.force) {
    error(
      "Already initialized. Use --force to re-initialize (DANGER: will overwrite default backup).",
    );
  }

  if (options.force) {
    console.log("Warning: Force re-initialization will overwrite default backup...");
  }

  // Create directories
  if (!fs.existsSync(OPENSTACK_DIR)) {
    fs.mkdirSync(OPENSTACK_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR, { recursive: true });
  }

  // Backup current config to profiles/default/
  const defaultProfileDir = path.join(PROFILES_DIR, "default");

  if (fs.existsSync(defaultProfileDir) && options.force) {
    console.log("Removing existing default profile...");
    fs.rmSync(defaultProfileDir, { recursive: true });
  }

  console.log("Backing up current config to profiles/default/...");
  copyDir(OPENCODE_DIR, defaultProfileDir);

  // Verify backup
  if (!fs.existsSync(path.join(defaultProfileDir, "AGENTS.md"))) {
    error("Backup failed: AGENTS.md not found in backup.");
  }

  // Create config
  const config: OpenStackConfig = {
    version: PACKAGE_VERSION,
    active_profile: "default",
    profiles: [
      {
        name: "default",
        source: "local",
        installed_at: new Date().toISOString(),
      },
    ],
  };

  saveConfig(config);

  console.log("✓ openstack initialized successfully!");
  console.log("  Current config backed up to: ~/.config/openstack/profiles/default/");
  console.log("  Active profile: default");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Install a profile: openstack install <git-url>");
  console.log("  2. Switch profiles: openstack use <profile-name>");
}

// List command logic
export interface ProfileListItem {
  name: string;
  source: string;
  isActive: boolean;
}

export function list(): ProfileListItem[] {
  requireInit();
  const config = loadConfig();

  return config.profiles.map((p) => ({
    name: p.name,
    source: p.source,
    isActive: p.name === config.active_profile,
  }));
}

// Install command (placeholder)
export function install(source: string, _name?: string): void {
  requireInit();
  console.log(`Installing from: ${source}`);
  console.log("Not yet implemented");
}

// Use command (placeholder)
export function use(name: string): void {
  requireInit();
  console.log(`Switching to profile: ${name}`);
  console.log("Not yet implemented");
}
