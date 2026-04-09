# Changelog

## 0.2.0

### Minor Changes

- 5c81917: Add `--force` flag to `use` command for converting existing configs

  When `openstack use <profile>` is run on a system where `~/.config/opencode` is a regular directory (not a symlink), the command now fails with a clear error suggesting `--force`. This keeps the CLI non-interactive and agent-ready.

  - Added `--force` flag to `use` command to auto-convert existing directories
  - Fails fast with helpful error when conversion is needed
  - Auto-creates 'default' profile from existing config during conversion

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-01-09

### Added

- Initial release
- `init` command to initialize openstack
- `install` command to install profiles from git
- `use` command to switch profiles
- `list` command to show installed profiles
- `help` command for documentation
- Basic error handling and validation

### Features

- Symlink-based profile switching
- Per-profile skill directories
- Runtime opencode.json schema validation
- Fail-fast error handling
