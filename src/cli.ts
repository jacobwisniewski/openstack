#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { program } from "commander";
import { init, list, install, use, type Paths, type FileSystem } from "./commands";

const PACKAGE_JSON_PATH = path.join(__dirname, "..", "package.json");
const PACKAGE_VERSION = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf-8")).version;

function createPaths(): Paths {
  const homeDir = os.homedir();
  return {
    openstackDir: path.join(homeDir, ".config", "openstack"),
    opencodeDir: path.join(homeDir, ".config", "opencode"),
    configFile: path.join(homeDir, ".config", "openstack", "config.yaml"),
    profilesDir: path.join(homeDir, ".config", "openstack", "profiles"),
  };
}

const fileSystem: FileSystem = {
  existsSync: fs.existsSync,
  mkdirSync: fs.mkdirSync,
  readFileSync: fs.readFileSync,
  writeFileSync: fs.writeFileSync,
  copyFileSync: fs.copyFileSync,
  readdirSync: fs.readdirSync,
  rmSync: fs.rmSync,
};

function handleError(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

program
  .name("openstack")
  .description("Simple profile management for OpenCode configurations")
  .version(PACKAGE_VERSION);

program
  .command("init")
  .description("Initialize openstack and backup your current config")
  .option("-f, --force", "Force re-initialization (DANGER: will overwrite default backup)")
  .action((options) => {
    const paths = createPaths();
    const result = init(paths, fileSystem, { force: options.force ?? false }, PACKAGE_VERSION);

    if (!result.success) {
      handleError(result.error);
    }
    console.log(result.message);
  });

program
  .command("install <source>")
  .description("Install a profile from git URL or local path")
  .option("-n, --name <name>", "Custom name for the profile")
  .action((source, options) => {
    const message = install(source, options.name);
    console.log(message);
  });

program
  .command("use <name>")
  .description("Switch to a profile")
  .action((name) => {
    const message = use(name);
    console.log(message);
  });

program
  .command("list")
  .description("List installed profiles")
  .action(() => {
    const paths = createPaths();
    const profiles = list(paths, fileSystem);

    if (profiles === null) {
      handleError(
        "openstack not initialized. Run 'openstack init' first to backup your current config.",
      );
    }

    console.log("Installed profiles:");
    profiles.forEach((p) => {
      const marker = p.isActive ? "*" : " ";
      console.log(`  ${marker} ${p.name.padEnd(12)} (${p.source})`);
    });
  });

program.parse();
