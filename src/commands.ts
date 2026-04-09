import * as fs from "fs";
import * as path from "path";
import * as YAML from "yaml";
import { validateConfig, type ValidatedOpenStackConfig } from "./validation";

export interface FileSystem {
  existsSync: typeof fs.existsSync;
  mkdirSync: typeof fs.mkdirSync;
  readFileSync: typeof fs.readFileSync;
  writeFileSync: typeof fs.writeFileSync;
  copyFileSync: typeof fs.copyFileSync;
  readdirSync: typeof fs.readdirSync;
  rmSync: typeof fs.rmSync;
}

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

export interface Paths {
  openstackDir: string;
  opencodeDir: string;
  configFile: string;
  profilesDir: string;
}

export interface InitOptions {
  force: boolean;
}

export interface InitResult {
  success: true;
  message: string;
}

export interface InitError {
  success: false;
  error: string;
}

export type InitOutput = InitResult | InitError;

export function isInitialized(paths: Paths, fs: FileSystem): boolean {
  return fs.existsSync(paths.configFile);
}

export function loadConfig(paths: Paths, fs: FileSystem): ValidatedOpenStackConfig | null {
  if (!fs.existsSync(paths.configFile)) {
    return null;
  }

  const content = fs.readFileSync(paths.configFile, "utf-8");
  const rawConfig = YAML.parse(content);

  const validationResult = validateConfig(rawConfig);
  if (validationResult.isErr()) {
    return null;
  }
  return validationResult.value;
}

export function saveConfig(paths: Paths, fs: FileSystem, config: OpenStackConfig): void {
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
  fs.writeFileSync(paths.configFile, content);
}

export function copyDir(fs: FileSystem, src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(fs, srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function init(
  paths: Paths,
  fs: FileSystem,
  options: InitOptions,
  packageVersion: string,
): InitOutput {
  if (!fs.existsSync(paths.opencodeDir)) {
    return { success: false, error: "OpenCode config directory not found at ~/.config/opencode" };
  }

  if (isInitialized(paths, fs) && !options.force) {
    return {
      success: false,
      error:
        "Already initialized. Use --force to re-initialize (DANGER: will overwrite default backup).",
    };
  }

  if (!fs.existsSync(paths.openstackDir)) {
    fs.mkdirSync(paths.openstackDir, { recursive: true });
  }
  if (!fs.existsSync(paths.profilesDir)) {
    fs.mkdirSync(paths.profilesDir, { recursive: true });
  }

  const defaultProfileDir = path.join(paths.profilesDir, "default");

  if (fs.existsSync(defaultProfileDir) && options.force) {
    fs.rmSync(defaultProfileDir, { recursive: true });
  }

  copyDir(fs, paths.opencodeDir, defaultProfileDir);

  const config: OpenStackConfig = {
    version: packageVersion,
    active_profile: "default",
    profiles: [
      {
        name: "default",
        source: "local",
        installed_at: new Date().toISOString(),
      },
    ],
  };

  saveConfig(paths, fs, config);

  return {
    success: true,
    message:
      "openstack initialized successfully!\n" +
      "  Current config backed up to: ~/.config/openstack/profiles/default/\n" +
      "  Active profile: default\n" +
      "\n" +
      "Next steps:\n" +
      "  1. Install a profile: openstack install <git-url>\n" +
      "  2. Switch profiles: openstack use <profile-name>",
  };
}

export interface ProfileListItem {
  name: string;
  source: string;
  isActive: boolean;
}

export function list(paths: Paths, fs: FileSystem): ProfileListItem[] | null {
  const config = loadConfig(paths, fs);
  if (!config) {
    return null;
  }

  return config.profiles.map((p) => ({
    name: p.name,
    source: p.source,
    isActive: p.name === config.active_profile,
  }));
}

export interface RemoveOptions {
  name: string;
  force?: boolean;
}

export interface RemoveResult {
  success: true;
  message: string;
}

export interface RemoveError {
  success: false;
  error: string;
}

export type RemoveOutput = RemoveResult | RemoveError;

export function remove(
  paths: Paths,
  fs: FileSystem,
  options: RemoveOptions,
): RemoveOutput {
  const config = loadConfig(paths, fs);
  if (!config) {
    return { success: false, error: "Failed to load config" };
  }

  const profileIndex = config.profiles.findIndex((p) => p.name === options.name);
  if (profileIndex === -1) {
    return {
      success: false,
      error: `Profile "${options.name}" not found`,
    };
  }

  // Prevent removing active profile unless forced
  if (config.active_profile === options.name && !options.force) {
    return {
      success: false,
      error: `Cannot remove active profile "${options.name}". Switch to another profile first, or use --force.`,
    };
  }

  const profileDir = path.join(paths.profilesDir, options.name);
  if (fs.existsSync(profileDir)) {
    fs.rmSync(profileDir, { recursive: true });
  }

  // Remove from config
  config.profiles.splice(profileIndex, 1);

  // If we removed the active profile (with force), switch to default
  if (config.active_profile === options.name) {
    config.active_profile = "default";
  }

  saveConfig(paths, fs, config);

  return {
    success: true,
    message: `Profile "${options.name}" removed successfully`,
  };
}

export function install(_source: string, _name?: string): string {
  return "Not yet implemented";
}

export function use(_name: string): string {
  return "Not yet implemented";
}
