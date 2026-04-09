---
"@jacobwisniewski/openstack": minor
---

Add `--force` flag to `use` command for converting existing configs

When `openstack use <profile>` is run on a system where `~/.config/opencode` is a regular directory (not a symlink), the command now fails with a clear error suggesting `--force`. This keeps the CLI non-interactive and agent-ready.

- Added `--force` flag to `use` command to auto-convert existing directories
- Fails fast with helpful error when conversion is needed
- Auto-creates 'default' profile from existing config during conversion