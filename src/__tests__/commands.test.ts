import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { copyDir } from "../commands";

describe("copyDir", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `openstack-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe("GIVEN a source directory with files and subdirectories", () => {
    it("SHOULD copy all contents recursively", () => {
      const sourceDir = path.join(testDir, "source");
      const destDir = path.join(testDir, "dest");

      // Create source structure
      fs.mkdirSync(path.join(sourceDir, "skills", "test-skill"), { recursive: true });
      fs.writeFileSync(path.join(sourceDir, "AGENTS.md"), "test content");
      fs.writeFileSync(path.join(sourceDir, "skills", "test-skill", "SKILL.md"), "skill content");

      copyDir(sourceDir, destDir);

      expect(fs.existsSync(path.join(destDir, "AGENTS.md"))).toBe(true);
      expect(fs.readFileSync(path.join(destDir, "AGENTS.md"), "utf-8")).toBe("test content");
      expect(fs.existsSync(path.join(destDir, "skills", "test-skill", "SKILL.md"))).toBe(true);
    });
  });

  describe("GIVEN source directory with nested structure", () => {
    it("SHOULD preserve directory hierarchy", () => {
      const sourceDir = path.join(testDir, "source");
      const destDir = path.join(testDir, "dest");

      fs.mkdirSync(path.join(sourceDir, "a", "b", "c"), { recursive: true });
      fs.writeFileSync(path.join(sourceDir, "a", "file.txt"), "content");
      fs.writeFileSync(path.join(sourceDir, "a", "b", "file2.txt"), "content2");

      copyDir(sourceDir, destDir);

      expect(fs.existsSync(path.join(destDir, "a", "file.txt"))).toBe(true);
      expect(fs.existsSync(path.join(destDir, "a", "b", "file2.txt"))).toBe(true);
      expect(fs.existsSync(path.join(destDir, "a", "b", "c"))).toBe(true);
    });
  });
});
