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
  symlinkSync: typeof fs.symlinkSync;
  unlinkSync: typeof fs.unlinkSync;
  lstatSync: typeof fs.lstatSync;
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

export interface UseOptions {
  name: string;
}

export interface UseResult {
  success: true;
  message: string;
}

export interface UseError {
  success: false;
  error: string;
}

export type UseOutput = UseResult | UseError;

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

export function use(
  paths: Paths,
  fs: FileSystem,
  options: UseOptions,
): UseOutput {
  const config = loadConfig(paths, fs);
  if (!config) {
    return { success: false, error: "Failed to load config" };
  }

  const profile = config.profiles.find((p) => p.name === options.name);
  if (!profile) {
    return {
      success: false,
      error: `Profile "${options.name}" not found. Run "openstack list" to see available profiles.`,
    };
  }

  const profileDir = path.join(paths.profilesDir, options.name);
  if (!fs.existsSync(profileDir)) {
    return {
      success: false,
      error: `Profile "${options.name}" directory not found at ${profileDir}`,
    };
  }

  // Remove existing symlinks in opencode dir
  if (fs.existsSync(paths.opencodeDir)) {
    const entries = fs.readdirSync(paths.opencodeDir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(paths.opencodeDir, entry.name);
      try {
        const stats = fs.lstatSync(entryPath);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(entryPath);
        }
      } catch {
        // Ignore errors for non-symlinks
      }
    }
  } else {
    fs.mkdirSync(paths.opencodeDir, { recursive: true });
  }

  // Create new symlinks
  const entries = fs.readdirSync(profileDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(profileDir, entry.name);
    const destPath = path.join(paths.opencodeDir, entry.name);
    fs.symlinkSync(srcPath, destPath);
  }

  // Update config
  config.active_profile = options.name;
  saveConfig(paths, fs, config);

  return {
    success: true,
    message: `Switched to profile "${options.name}"`,
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

export function install(_source: string, _name?: string): string {
  return "Not yet implemented";
}
