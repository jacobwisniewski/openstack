import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  copyDir,
  isInitialized,
  loadConfig,
  saveConfig,
  init,
  list,
  type Paths,
  type FileSystem,
  type OpenStackConfig,
} from "../commands";

function createRealFileSystem(): FileSystem {
  return {
    existsSync: fs.existsSync,
    mkdirSync: fs.mkdirSync,
    readFileSync: fs.readFileSync,
    writeFileSync: fs.writeFileSync,
    copyFileSync: fs.copyFileSync,
    readdirSync: fs.readdirSync,
    rmSync: fs.rmSync,
  };
}

function createTestPaths(testDir: string): Paths {
  return {
    openstackDir: path.join(testDir, ".config", "openstack"),
    opencodeDir: path.join(testDir, ".config", "opencode"),
    configFile: path.join(testDir, ".config", "openstack", "config.yaml"),
    profilesDir: path.join(testDir, ".config", "openstack", "profiles"),
  };
}

describe("isInitialized", () => {
  let testDir: string;
  let paths: Paths;
  let fileSystem: FileSystem;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `openstack-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    paths = createTestPaths(testDir);
    fileSystem = createRealFileSystem();
  });

  describe("GIVEN no config file exists", () => {
    it("SHOULD return false", () => {
      const result = isInitialized(paths, fileSystem);
      expect(result).toBe(false);
    });
  });

  describe("GIVEN config file exists", () => {
    it("SHOULD return true", () => {
      fs.mkdirSync(paths.openstackDir, { recursive: true });
      fs.writeFileSync(paths.configFile, "test: true");

      const result = isInitialized(paths, fileSystem);
      expect(result).toBe(true);
    });
  });
});

describe("saveConfig and loadConfig", () => {
  let testDir: string;
  let paths: Paths;
  let fileSystem: FileSystem;
  let testConfig: OpenStackConfig;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `openstack-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    paths = createTestPaths(testDir);
    fileSystem = createRealFileSystem();

    testConfig = {
      version: "0.1.0",
      active_profile: "default",
      profiles: [
        {
          name: "default",
          source: "local",
          installed_at: "2025-01-09T10:00:00Z",
        },
      ],
    };
  });

  describe("GIVEN a valid config", () => {
    it("SHOULD save and load successfully", () => {
      fs.mkdirSync(paths.openstackDir, { recursive: true });

      saveConfig(paths, fileSystem, testConfig);
      const loaded = loadConfig(paths, fileSystem);

      expect(loaded).toEqual(testConfig);
    });
  });

  describe("GIVEN config with multiple profiles", () => {
    it("SHOULD save and load all profiles", () => {
      const multiProfileConfig: OpenStackConfig = {
        version: "0.1.0",
        active_profile: "work",
        profiles: [
          {
            name: "default",
            source: "local",
            installed_at: "2025-01-09T10:00:00Z",
          },
          {
            name: "work",
            source: "https://github.com/user/repo",
            installed_at: "2025-01-09T11:00:00Z",
          },
        ],
      };

      fs.mkdirSync(paths.openstackDir, { recursive: true });

      saveConfig(paths, fileSystem, multiProfileConfig);
      const loaded = loadConfig(paths, fileSystem);

      expect(loaded).toEqual(multiProfileConfig);
    });
  });

  describe("GIVEN no config file", () => {
    it("SHOULD return null", () => {
      const loaded = loadConfig(paths, fileSystem);
      expect(loaded).toBeNull();
    });
  });
});

describe("copyDir", () => {
  let testDir: string;
  let fileSystem: FileSystem;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `openstack-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    fileSystem = createRealFileSystem();
  });

  describe("GIVEN a source directory with files and subdirectories", () => {
    it("SHOULD copy all contents recursively", () => {
      const sourceDir = path.join(testDir, "source");
      const destDir = path.join(testDir, "dest");

      // Create source structure
      fs.mkdirSync(path.join(sourceDir, "skills", "test-skill"), { recursive: true });
      fs.writeFileSync(path.join(sourceDir, "AGENTS.md"), "test content");
      fs.writeFileSync(path.join(sourceDir, "skills", "test-skill", "SKILL.md"), "skill content");

      copyDir(fileSystem, sourceDir, destDir);

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

      copyDir(fileSystem, sourceDir, destDir);

      expect(fs.existsSync(path.join(destDir, "a", "file.txt"))).toBe(true);
      expect(fs.existsSync(path.join(destDir, "a", "b", "file2.txt"))).toBe(true);
      expect(fs.existsSync(path.join(destDir, "a", "b", "c"))).toBe(true);
    });
  });
});

describe("init", () => {
  let testDir: string;
  let paths: Paths;
  let fileSystem: FileSystem;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `openstack-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    paths = createTestPaths(testDir);
    fileSystem = createRealFileSystem();
  });

  describe("GIVEN opencode config exists", () => {
    it("SHOULD create backup in profiles/default", () => {
      // Setup mock opencode config
      fs.mkdirSync(paths.opencodeDir, { recursive: true });
      fs.writeFileSync(path.join(paths.opencodeDir, "AGENTS.md"), "# My Config");

      const result = init(paths, fileSystem, { force: false }, "0.1.0");

      expect(result.success).toBe(true);

      const defaultProfileDir = path.join(paths.profilesDir, "default");
      expect(fs.existsSync(defaultProfileDir)).toBe(true);
      expect(fs.existsSync(path.join(defaultProfileDir, "AGENTS.md"))).toBe(true);
    });

    it("SHOULD create config.yaml with default profile", () => {
      fs.mkdirSync(paths.opencodeDir, { recursive: true });
      fs.writeFileSync(path.join(paths.opencodeDir, "AGENTS.md"), "# Config");

      const result = init(paths, fileSystem, { force: false }, "0.1.0");

      expect(result.success).toBe(true);
      expect(fs.existsSync(paths.configFile)).toBe(true);

      const config = loadConfig(paths, fileSystem);
      expect(config).not.toBeNull();
      expect(config!.active_profile).toBe("default");
      expect(config!.profiles[0].name).toBe("default");
    });
  });

  describe("GIVEN no opencode config", () => {
    it("SHOULD return error", () => {
      const result = init(paths, fileSystem, { force: false }, "0.1.0");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("OpenCode config not found");
      }
    });
  });

  describe("GIVEN already initialized", () => {
    it("SHOULD return error without force flag", () => {
      // Setup
      fs.mkdirSync(paths.opencodeDir, { recursive: true });
      fs.writeFileSync(path.join(paths.opencodeDir, "AGENTS.md"), "# Config");

      // First init
      init(paths, fileSystem, { force: false }, "0.1.0");

      // Second init without force
      const result = init(paths, fileSystem, { force: false }, "0.1.0");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Already initialized");
      }
    });

    it("SHOULD succeed with force flag", () => {
      // Setup
      fs.mkdirSync(paths.opencodeDir, { recursive: true });
      fs.writeFileSync(path.join(paths.opencodeDir, "AGENTS.md"), "# Config");

      // First init
      init(paths, fileSystem, { force: false }, "0.1.0");

      // Modify and re-init with force
      fs.writeFileSync(path.join(paths.opencodeDir, "AGENTS.md"), "# Updated Config");
      const result = init(paths, fileSystem, { force: true }, "0.1.0");

      expect(result.success).toBe(true);

      const defaultProfileDir = path.join(paths.profilesDir, "default");
      const content = fs.readFileSync(path.join(defaultProfileDir, "AGENTS.md"), "utf-8");
      expect(content).toBe("# Updated Config");
    });
  });
});

describe("list", () => {
  let testDir: string;
  let paths: Paths;
  let fileSystem: FileSystem;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `openstack-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    paths = createTestPaths(testDir);
    fileSystem = createRealFileSystem();
  });

  describe("GIVEN not initialized", () => {
    it("SHOULD return null", () => {
      const result = list(paths, fileSystem);
      expect(result).toBeNull();
    });
  });

  describe("GIVEN initialized with multiple profiles", () => {
    it("SHOULD return all profiles with active marker", () => {
      // Setup
      fs.mkdirSync(paths.opencodeDir, { recursive: true });
      fs.writeFileSync(path.join(paths.opencodeDir, "AGENTS.md"), "# Config");

      init(paths, fileSystem, { force: false }, "0.1.0");

      // Add another profile manually
      const config = loadConfig(paths, fileSystem)!;
      config.profiles.push({
        name: "work",
        source: "https://github.com/user/repo",
        installed_at: "2025-01-09T11:00:00Z",
      });
      saveConfig(paths, fileSystem, config);

      const profiles = list(paths, fileSystem);

      expect(profiles).toEqual([
        { name: "default", source: "local", isActive: true },
        { name: "work", source: "https://github.com/user/repo", isActive: false },
      ]);
    });
  });
});
