import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as YAML from "yaml";
import {
  validConfigYaml,
  configWithMultipleProfilesYaml,
  emptyProfilesConfigYaml,
  createTestDir,
  setupTestDir,
  cleanupTestDir,
  writeConfigFile,
  readConfigFile,
} from "./fixtures";

describe("Config file operations", () => {
  let testDir: string;
  let configFile: string;

  beforeEach(() => {
    testDir = createTestDir("openstack-config-test");
    configFile = path.join(testDir, "config.yaml");
    setupTestDir(testDir);
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  describe("GIVEN a valid config file", () => {
    it("SHOULD parse with YAML library", () => {
      writeConfigFile(configFile, validConfigYaml);
      const content = readConfigFile(configFile);
      const parsed = YAML.parse(content);

      expect(parsed.version).toBe("0.1.0");
      expect(parsed.active_profile).toBe("default");
      expect(parsed.profiles).toHaveLength(1);
      expect(parsed.profiles[0].name).toBe("default");
    });
  });

  describe("GIVEN a config with multiple profiles", () => {
    it("SHOULD parse all profiles correctly", () => {
      writeConfigFile(configFile, configWithMultipleProfilesYaml);
      const content = readConfigFile(configFile);
      const parsed = YAML.parse(content);

      expect(parsed.profiles).toHaveLength(2);
      expect(parsed.profiles[1].name).toBe("work");
    });
  });

  describe("GIVEN an empty profiles list", () => {
    it("SHOULD parse successfully", () => {
      writeConfigFile(configFile, emptyProfilesConfigYaml);
      const content = readConfigFile(configFile);
      const parsed = YAML.parse(content);

      expect(parsed.profiles).toHaveLength(0);
    });
  });

  describe("GIVEN a non-existent config file", () => {
    it("SHOULD throw when reading", () => {
      const nonExistentFile = path.join(testDir, "non-existent.yaml");
      expect(() => readConfigFile(nonExistentFile)).toThrow();
    });
  });
});

describe("Directory operations", () => {
  let testDir: string;
  let profilesDir: string;
  let defaultProfileDir: string;

  beforeEach(() => {
    testDir = createTestDir("openstack-dir-test");
    profilesDir = path.join(testDir, "profiles");
    defaultProfileDir = path.join(profilesDir, "default");
    setupTestDir(testDir);
  });

  afterEach(() => {
    cleanupTestDir(testDir);
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
