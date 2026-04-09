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

export interface GitRunner {
  clone: (url: string, dest: string) => void;
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

export interface InstallOptions {
  name?: string;
}

export interface InstallResult {
  success: true;
  message: string;
}

export interface InstallError {
  success: false;
  error: string;
}

export type InstallOutput = InstallResult | InstallError;

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

export function extractProfileName(url: string, customName?: string): string {
  if (customName) {
    return customName;
  }

  // Extract from URL like https://github.com/user/repo.git or https://github.com/user/repo
  const match = url.match(/\/([^/]+?)(?:\.git)?$/);
  if (match) {
    return match[1];
  }

  throw new Error("Could not extract profile name from URL");
}

export function init(
  paths: Paths,
  fs: FileSystem,
  options: InitOptions,
  packageVersion: string,
): InitOutput {
  if (!fs.existsSync(path.join(paths.opencodeDir, "AGENTS.md"))) {
    return { success: false, error: "OpenCode config not found" };
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

  if (!fs.existsSync(path.join(defaultProfileDir, "AGENTS.md"))) {
    return { success: false, error: "Backup failed: AGENTS.md not found in backup." };
  }

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

export function install(
  paths: Paths,
  fs: FileSystem,
  git: GitRunner,
  source: string,
  options: InstallOptions,
): InstallOutput {
  const profileName = extractProfileName(source, options.name);
  const profileDir = path.join(paths.profilesDir, profileName);

  if (fs.existsSync(profileDir)) {
    return {
      success: false,
      error: `Profile "${profileName}" already exists. Remove it first or use a different name.`,
    };
  }

  try {
    git.clone(source, profileDir);
  } catch {
    return {
      success: false,
      error: `Failed to clone from ${source}`,
    };
  }

  if (!fs.existsSync(path.join(profileDir, "AGENTS.md"))) {
    fs.rmSync(profileDir, { recursive: true });
    return {
      success: false,
      error: `Profile "${profileName}" is invalid: no AGENTS.md found`,
    };
  }

  const config = loadConfig(paths, fs);
  if (!config) {
    fs.rmSync(profileDir, { recursive: true });
    return {
      success: false,
      error: "Failed to load config",
    };
  }

  config.profiles.push({
    name: profileName,
    source,
    installed_at: new Date().toISOString(),
  });

  saveConfig(paths, fs, config);

  return {
    success: true,
    message: `Profile "${profileName}" installed successfully!\nUse "openstack use ${profileName}" to activate it.`,
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

export function use(_name: string): string {
  return "Not yet implemented";
}
