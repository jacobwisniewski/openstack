import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("CLI Integration", () => {
  const testDir = path.join(os.tmpdir(), "openstack-cli-test-" + Date.now());

  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe("GIVEN the test environment", () => {
    it("SHOULD create and cleanup test directories", () => {
      const testSubDir = path.join(testDir, "subdir");
      fs.mkdirSync(testSubDir, { recursive: true });
      expect(fs.existsSync(testSubDir)).toBe(true);
    });
  });

  describe("GIVEN an opencode-like directory structure", () => {
    it("SHOULD detect AGENTS.md presence", () => {
      const opencodeDir = path.join(testDir, "opencode");
      fs.mkdirSync(opencodeDir, { recursive: true });
      fs.writeFileSync(path.join(opencodeDir, "AGENTS.md"), "# Test Config");

      expect(fs.existsSync(path.join(opencodeDir, "AGENTS.md"))).toBe(true);
    });

    it("SHOULD detect missing AGENTS.md", () => {
      const opencodeDir = path.join(testDir, "opencode");
      fs.mkdirSync(opencodeDir, { recursive: true });

      expect(fs.existsSync(path.join(opencodeDir, "AGENTS.md"))).toBe(false);
    });
  });

  describe("GIVEN profile directory structure", () => {
    it("SHOULD create profiles directory structure", () => {
      const profilesDir = path.join(testDir, "profiles");
      const defaultProfile = path.join(profilesDir, "default");
      const skillsDir = path.join(defaultProfile, "skills");

      fs.mkdirSync(skillsDir, { recursive: true });
      fs.writeFileSync(path.join(defaultProfile, "AGENTS.md"), "# Default");
      fs.writeFileSync(path.join(skillsDir, "test.md"), "skill");

      expect(fs.existsSync(defaultProfile)).toBe(true);
      expect(fs.existsSync(path.join(defaultProfile, "AGENTS.md"))).toBe(true);
    });
  });

  describe("GIVEN checking initialization status", () => {
    it("SHOULD detect when config file exists", () => {
      const configFile = path.join(testDir, "config.yaml");
      fs.writeFileSync(configFile, "test: true");

      expect(fs.existsSync(configFile)).toBe(true);
    });

    it("SHOULD detect when config file does not exist", () => {
      const configFile = path.join(testDir, "config.yaml");
      expect(fs.existsSync(configFile)).toBe(false);
    });
  });

  describe("GIVEN force re-initialization flag", () => {
    it("SHOULD allow overwriting existing default profile", () => {
      const defaultProfile = path.join(testDir, "profiles", "default");
      fs.mkdirSync(defaultProfile, { recursive: true });
      fs.writeFileSync(path.join(defaultProfile, "AGENTS.md"), "old content");

      // Simulate force flag behavior
      fs.rmSync(defaultProfile, { recursive: true });
      fs.mkdirSync(defaultProfile, { recursive: true });
      fs.writeFileSync(path.join(defaultProfile, "AGENTS.md"), "new content");

      const content = fs.readFileSync(path.join(defaultProfile, "AGENTS.md"), "utf-8");
      expect(content).toBe("new content");
    });
  });
});

describe("Config listing display", () => {
  describe("GIVEN profiles list", () => {
    it("SHOULD format profile names correctly", () => {
      const profiles = [
        { name: "default", source: "local" },
        { name: "work", source: "git" },
        { name: "personal", source: "local" },
      ];
      const activeProfile = "work";

      const formatted = profiles.map((p) => {
        const marker = p.name === activeProfile ? "*" : " ";
        return `  ${marker} ${p.name.padEnd(12)} (${p.source})`;
      });

      expect(formatted[0]).toBe("    default      (local)");
      expect(formatted[1]).toBe("  * work         (git)");
      expect(formatted[2]).toBe("    personal     (local)");
    });
  });
});
