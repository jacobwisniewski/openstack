import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Common test data fixtures
export const validProfile = {
  name: "my-profile",
  source: "https://github.com/user/repo",
  installed_at: "2025-01-09T10:00:00Z",
};

export const validProfileLocal = {
  name: "default",
  source: "local",
  installed_at: "2025-01-09T10:00:00Z",
};

export const validConfig = {
  version: "0.1.0",
  active_profile: "default",
  profiles: [validProfileLocal],
};

export const configWithMultipleProfiles = {
  version: "0.1.0",
  active_profile: "work",
  profiles: [
    validProfileLocal,
    {
      name: "work",
      source: "https://github.com/user/repo",
      installed_at: "2025-01-09T11:00:00Z",
    },
  ],
};

export const emptyProfilesConfig = {
  version: "0.1.0",
  active_profile: "default",
  profiles: [],
};

// Invalid fixtures
export const invalidProfileEmptyName = {
  name: "",
  source: "local",
  installed_at: "2025-01-09T10:00:00Z",
};

export const invalidProfileBadDate = {
  name: "test",
  source: "local",
  installed_at: "not-a-datetime",
};

export const invalidProfileMissingFields = {
  name: "test",
};

export const incompleteConfig = {
  version: "0.1.0",
};

export const configWithInvalidProfile = {
  version: "0.1.0",
  active_profile: "default",
  profiles: [invalidProfileEmptyName],
};

// YAML content fixtures
export const validConfigYaml = `version: "0.1.0"
active_profile: "default"
profiles:
  - name: "default"
    source: "local"
    installed_at: "2025-01-09T10:00:00Z"`;

export const configWithMultipleProfilesYaml = `version: "0.1.0"
active_profile: "work"
profiles:
  - name: "default"
    source: "local"
    installed_at: "2025-01-09T10:00:00Z"
  - name: "work"
    source: "https://github.com/user/repo"
    installed_at: "2025-01-09T11:00:00Z"`;

export const emptyProfilesConfigYaml = `version: "0.1.0"
active_profile: "default"
profiles: []`;

// Test directory helpers
export function createTestDir(prefix: string): string {
  return path.join(os.tmpdir(), `${prefix}-${Date.now()}`);
}

export function setupTestDir(testDir: string): void {
  fs.mkdirSync(testDir, { recursive: true });
}

export function cleanupTestDir(testDir: string): void {
  fs.rmSync(testDir, { recursive: true, force: true });
}

// Opencode directory helpers
export function createMockOpencodeDir(baseDir: string, content = "# Test Config"): string {
  const opencodeDir = path.join(baseDir, "opencode");
  fs.mkdirSync(opencodeDir, { recursive: true });
  fs.writeFileSync(path.join(opencodeDir, "AGENTS.md"), content);
  return opencodeDir;
}

export function createMockProfileDir(baseDir: string, profileName: string): string {
  const profileDir = path.join(baseDir, "profiles", profileName);
  const skillsDir = path.join(profileDir, "skills");

  fs.mkdirSync(skillsDir, { recursive: true });
  fs.writeFileSync(path.join(profileDir, "AGENTS.md"), `# ${profileName}`);

  return profileDir;
}

// File operation helpers
export function writeConfigFile(configPath: string, content: string): void {
  fs.writeFileSync(configPath, content);
}

export function readConfigFile(configPath: string): string {
  return fs.readFileSync(configPath, "utf-8");
}

// Profile list helpers
export interface Profile {
  name: string;
  source: string;
}

export function formatProfileList(profiles: Profile[], activeProfile: string): string[] {
  return profiles.map((p) => {
    const marker = p.name === activeProfile ? "*" : " ";
    return `  ${marker} ${p.name.padEnd(12)} (${p.source})`;
  });
}
