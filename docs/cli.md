# CLI Reference

## Installation

```bash
npm install -g @jacobwisniewski/openstack
```

## Commands

### `openstack init`

Initialize openstack and backup your current configuration.

```bash
openstack init
```

**What it does:**
1. Creates `~/.config/openstack/` directory structure
2. Copies current `~/.config/opencode/` to `profiles/default/`
3. Creates initial `config.yaml`

**Errors:**
- Fails if OpenCode is not installed
- Fails if already initialized (use `--force` to override)

### `openstack install <source>`

Install a profile from a git repository or local path.

```bash
# From git
openstack install https://github.com/user/opencode-config

# With custom name
openstack install https://github.com/user/opencode-config --name my-profile

# From local path
openstack install ~/my-configs/opencode-profile
```

**What it does:**
1. Clones/copies source to `profiles/<name>/`
2. Validates structure (checks AGENTS.md exists)
3. Adds to config.yaml

**Errors:**
- Fails if source is not accessible
- Fails if AGENTS.md is missing
- Fails if profile name already exists

### `openstack use <name>`

Switch to a profile.

```bash
openstack use jacob
openstack use default
```

**What it does:**
1. Removes existing symlinks in `~/.config/opencode/`
2. Creates new symlinks to `profiles/<name>/`
3. Updates active profile in config.yaml
4. Validates opencode.json (warns if invalid)

**Errors:**
- Fails if profile doesn't exist
- Fails if can't create symlinks

### `openstack list`

List all installed profiles.

```bash
openstack list
```

**Output:**
```
* default    (local)              [current]
  jacob      (git:github.com/jacobwisniewski/opencode-config)
  minimal    (git:github.com/someone/minimal-opencode)
```

### `openstack help [command]`

Show help for all commands or a specific command.

```bash
openstack help
openstack help install
```

## Global Options

```bash
--version    Show version number
--help       Show help
--verbose    Verbose output
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Profile not found |
| 4 | Git operation failed |
| 5 | Symlink operation failed |
| 6 | Validation failed |
