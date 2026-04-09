# openstack Development Plan

## Overview

openstack is a CLI tool for managing OpenCode configurations through profiles. It provides simple symlink-based profile switching with per-profile isolation.

## Goals

- **Simple**: Just symlink management, no magic
- **Non-parasitic**: No auto-running code, no template generation
- **Easy try/remove**: Install someone's config, try it, go back easily
- **Clean**: Per-profile skill directories, no overwrites

## Architecture

### Directory Structure

```
~/.config/openstack/
├── config.yaml              # openstack settings
└── profiles/
    ├── default/             # Backup of original config (auto-created)
    │   ├── AGENTS.md
    │   └── skills/
    └── <profile-name>/      # One per installed profile
        ├── AGENTS.md        # Required
        ├── skills/          # Per-profile skills
        ├── opencode.json    # Optional
        └── README.md        # Optional documentation

~/.config/opencode/          # Actual opencode files (symlinked)
├── AGENTS.md -> ~/.config/openstack/profiles/<active>/AGENTS.md
├── skills -> ~/.config/openstack/profiles/<active>/skills/
└── opencode.json -> ~/.config/openstack/profiles/<active>/opencode.json
```

### Config Schema

**config.yaml** (openstack's own config):
```yaml
version: "0.1.0"
active_profile: "default"
profiles:
  - name: "default"
    source: "local"
    installed_at: "2025-01-09T10:00:00Z"
  - name: "jacob"
    source: "https://github.com/jacobwisniewski/opencode-config"
    installed_at: "2025-01-09T11:00:00Z"
```

## CLI Commands

### v0.1 Commands

#### `openstack init`
- **Purpose**: Initialize openstack, backup current config
- **Actions**:
  1. Check if already initialized
  2. Create `~/.config/openstack/` directory structure
  3. Backup current `~/.config/opencode/` to `profiles/default/`
  4. Create `config.yaml` with "default" as active
- **Errors**: Fail if opencode config doesn't exist

#### `openstack install <source>`
- **Purpose**: Install a profile from git URL
- **Arguments**:
  - `<source>`: Git URL (https://github.com/user/repo) or local path
  - Optional: `--name <name>` to override directory name
- **Actions**:
  1. **Check initialized**: Fail if `~/.config/openstack/` doesn't exist (require `init` first)
  2. Clone git repo to `profiles/<name>/`
  3. Validate basic structure (AGENTS.md exists)
  4. Add to config.yaml
- **Errors**: 
  - Fail if not initialized ("Run openstack init first")
  - Fail if AGENTS.md missing
  - Fail if name exists

#### `openstack use <name>`
- **Purpose**: Switch to a profile
- **Actions**:
  1. **Check initialized**: Fail if `~/.config/openstack/` doesn't exist (require `init` first)
  2. Validate profile exists
  3. Remove existing symlinks in `~/.config/opencode/`
  4. Create new symlinks pointing to `profiles/<name>/`
  5. Validate opencode.json against schema (optional, warn on failure)
  6. Update config.yaml active_profile
- **Errors**: 
  - Fail if not initialized ("Run openstack init first")
  - Fail if profile doesn't exist
  - Fail if symlinks can't be created

#### `openstack list`
- **Purpose**: Show installed profiles
- **Actions**:
  1. **Check initialized**: Fail if `~/.config/openstack/` doesn't exist (require `init` first)
- **Output**:
  ```
  * default    (local)     [current]
    jacob      (git:github.com/jacobwisniewski/opencode-config)
    minimal    (git:github.com/someone/minimal-opencode)
  ```

#### `openstack help [command]`
- **Purpose**: Show help

## Implementation Details

### Profile Structure Requirements

**Required**:
- `AGENTS.md` - OpenCode agents file

**Optional**:
- `skills/` - Directory with SKILL.md files
- `opencode.json` - OpenCode configuration
- `README.md` - Human documentation

**Ignored**:
- `.git/` - Git metadata
- `node_modules/` - Dependencies
- Hidden files (.*)

### Validation Strategy

**v0.1**: Minimal validation
- Check AGENTS.md exists
- Check opencode.json is valid JSON
- Optional: Fetch and validate against `https://opencode.ai/config.json` (warn, don't block)

**Future**: 
- Full JSON Schema validation
- SKILL.md frontmatter parsing
- AGENTS.md structure validation

### Safety: Initialization Required

**All commands require `openstack init` first.** This prevents accidental loss of current config.

**Protection mechanism**:
- `install`, `use`, `list` check for `~/.config/openstack/config.yaml`
- If missing, fail with: "Error: openstack not initialized. Run 'openstack init' first to backup your current config."
- This ensures `profiles/default/` backup exists before any modifications

**Recovery if someone skips init**:
- Their original config remains untouched in `~/.config/opencode/`
- They just need to run `openstack init` to create the backup
- Then all commands work normally

### Error Handling

**Principle**: Fail fast, loud errors

**Error cases**:
- Not initialized (run `init` first)
- Opencode not installed/configured
- Profile doesn't exist
- Git clone fails
- Symlink creation fails
- Invalid opencode.json (fatal if strict, warn if loose)

**Error format**:
```
Error: <clear message>
Context: <what was happening>
Suggestion: <how to fix>
```

### Symlink Strategy

**On `use <name>`**:
```bash
# Remove existing
rm ~/.config/opencode/AGENTS.md
rm -rf ~/.config/opencode/skills
rm ~/.config/opencode/opencode.json  # if exists

# Create new
ln -s ~/.config/openstack/profiles/<name>/AGENTS.md ~/.config/opencode/AGENTS.md
ln -s ~/.config/openstack/profiles/<name>/skills ~/.config/opencode/skills
# Only if opencode.json exists in profile
ln -s ~/.config/openstack/profiles/<name>/opencode.json ~/.config/opencode/opencode.json
```

### Backup Strategy

**Initial backup** (`init`):
- Copy current `~/.config/opencode/` to `profiles/default/`
- Not a symlink - actual copy for safety

**No automatic backups**:
- User responsible for `git commit` in their config repo
- `default` profile is their safety net

## Development Phases

### Phase 1: Core (v0.1)
- [ ] Project setup (TypeScript, build, test)
- [ ] `init` command
- [ ] `install` command (git)
- [ ] `use` command
- [ ] `list` command
- [ ] `help` command
- [ ] Basic error handling
- [ ] README + docs

### Phase 2: Polish (v0.2)
- [ ] Local path install (`install ~/my-config`)
- [ ] `remove` command
- [ ] `update` command (git pull)
- [ ] Better error messages
- [ ] Validation toggle (`--no-validate`)

### Phase 3: Features (v0.3)
- [ ] Version pinning (`install <url>@v1.2.0`)
- [ ] Profile search/discovery
- [ ] Import/export profiles
- [ ] Shell completions

## Technical Decisions

### Language
- **Node.js + TypeScript**: Familiar, easy distribution via npm
- **Compiled to dist/**: Clean output

### Dependencies
- **commander**: CLI argument parsing
- **node:fs**, **node:path**: File operations
- **node:child_process**: Git commands

### No External Validation Libraries
- Use native `JSON.parse` for JSON validation
- Fetch schema with native `fetch` for runtime validation
- Keep dependencies minimal

### Git Integration
- Use system `git` command (don't bundle libgit2)
- Simple `git clone --depth 1 <url> <path>`

## Security Considerations

- Never execute code from profiles
- Never auto-run commands from AGENTS.md
- Profiles are just files, no special privileges
- User explicitly chooses to `use` a profile

## Future Considerations

### Multi-tool Support
- Keep door open for Claude Code, Codex CLI support
- Abstract "profile" concept from OpenCode specifics
- Tool-specific adapters

### Package Managers
- Homebrew formula (eventually)
- AUR package (community)

### IDE Integration
- VS Code extension for profile switching
- TUI mode for interactive profile management

## Success Metrics

- Can install and use a profile in < 30 seconds
- Can switch back to default in < 5 seconds
- Zero "magic" - everything visible in `~/.config/openstack/`
- Works reliably without internet after initial install

## Open Questions

1. Should we support nested profiles (profile inherits from another)?
2. Should we support partial profiles (only override specific files)?
3. How to handle profile dependencies (profile A requires skill B)?
4. Should we support encrypted profiles (for configs with secrets)?

## References

- OpenCode Config Schema: https://opencode.ai/config.json
- OpenCode Docs: https://opencode.ai/docs
- Similar tools: gstack (complex), dotbot (different problem)
