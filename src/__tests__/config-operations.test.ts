import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as YAML from "yaml";

describe("Config file operations", () => {
  const testDir = path.join(os.tmpdir(), "openstack-config-test-" + Date.now());
  const configFile = path.join(testDir, "config.yaml");

  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe("GIVEN a valid config file", () => {
    it("SHOULD parse with YAML library", () => {
      const configContent = `version: "0.1.0"
active_profile: "default"
profiles:
  - name: "default"
    source: "local"
    installed_at: "2025-01-09T10:00:00Z"`;

      fs.writeFileSync(configFile, configContent);
      const content = fs.readFileSync(configFile, "utf-8");
      const parsed = YAML.parse(content);

      expect(parsed.version).toBe("0.1.0");
      expect(parsed.active_profile).toBe("default");
      expect(parsed.profiles).toHaveLength(1);
      expect(parsed.profiles[0].name).toBe("default");
    });
  });

  describe("GIVEN a config with multiple profiles", () => {
    it("SHOULD parse all profiles correctly", () => {
      const configContent = `version: "0.1.0"
active_profile: "work"
profiles:
  - name: "default"
    source: "local"
    installed_at: "2025-01-09T10:00:00Z"
  - name: "work"
    source: "https://github.com/user/repo"
    installed_at: "2025-01-09T11:00:00Z"`;

      fs.writeFileSync(configFile, configContent);
      const content = fs.readFileSync(configFile, "utf-8");
      const parsed = YAML.parse(content);

      expect(parsed.profiles).toHaveLength(2);
      expect(parsed.profiles[1].name).toBe("work");
    });
  });

  describe("GIVEN an empty profiles list", () => {
    it("SHOULD parse successfully", () => {
      const configContent = `version: "0.1.0"
active_profile: "default"
profiles: []`;

      fs.writeFileSync(configFile, configContent);
      const content = fs.readFileSync(configFile, "utf-8");
      const parsed = YAML.parse(content);

      expect(parsed.profiles).toHaveLength(0);
    });
  });

  describe("GIVEN a non-existent config file", () => {
    it("SHOULD throw when reading", () => {
      const nonExistentFile = path.join(testDir, "non-existent.yaml");
      expect(() => fs.readFileSync(nonExistentFile, "utf-8")).toThrow();
    });
  });
});

describe("Directory operations", () => {
  const testDir = path.join(os.tmpdir(), "openstack-dir-test-" + Date.now());
  const profilesDir = path.join(testDir, "profiles");
  const defaultProfileDir = path.join(profilesDir, "default");

  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe("GIVEN creating directory structure", () => {
    it("SHOULD create nested directories", () => {
      fs.mkdirSync(defaultProfileDir, { recursive: true });
      expect(fs.existsSync(defaultProfileDir)).toBe(true);
    });
  });

  describe("GIVEN copying directory contents", () => {
    it("SHOULD copy files recursively", () => {
      const sourceDir = path.join(testDir, "source");
      const destDir = path.join(testDir, "dest");

      // Create source structure
      fs.mkdirSync(path.join(sourceDir, "skills", "test-skill"), { recursive: true });
      fs.writeFileSync(path.join(sourceDir, "AGENTS.md"), "test content");
      fs.writeFileSync(path.join(sourceDir, "skills", "test-skill", "SKILL.md"), "skill content");

      // Copy
      fs.mkdirSync(destDir, { recursive: true });
      const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(sourceDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
          fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }

      expect(fs.existsSync(path.join(destDir, "AGENTS.md"))).toBe(true);
      expect(fs.existsSync(path.join(destDir, "skills", "test-skill", "SKILL.md"))).toBe(true);
    });
  });
});
