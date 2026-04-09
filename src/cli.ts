#!/usr/bin/env node
import { program } from "commander";
import { PACKAGE_VERSION, init, install, use, list } from "./commands";

program
  .name("openstack")
  .description("Simple profile management for OpenCode configurations")
  .version(PACKAGE_VERSION);

program
  .command("init")
  .description("Initialize openstack and backup your current config")
  .option("-f, --force", "Force re-initialization (DANGER: will overwrite default backup)")
  .action((options) => {
    init({ force: options.force ?? false });
  });

program
  .command("install <source>")
  .description("Install a profile from git URL or local path")
  .option("-n, --name <name>", "Custom name for the profile")
  .action((source, options) => {
    install(source, options.name);
  });

program
  .command("use <name>")
  .description("Switch to a profile")
  .action((name) => {
    use(name);
  });

program
  .command("list")
  .description("List installed profiles")
  .action(() => {
    const profiles = list();
    console.log("Installed profiles:");
    profiles.forEach((p) => {
      const marker = p.isActive ? "*" : " ";
      console.log(`  ${marker} ${p.name.padEnd(12)} (${p.source})`);
    });
  });

program.parse();
