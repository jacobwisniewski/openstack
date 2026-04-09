# openstack

Simple profile management for OpenCode configurations.

## Quick Start

```bash
npm install -g @jacobwisniewski/openstack

# Initialize openstack (backs up your current config)
openstack init

# Install a profile from git
openstack install https://github.com/user/opencode-config

# Switch to the profile
openstack use user

# List installed profiles
openstack list
```

## What is openstack?

openstack lets you easily switch between different OpenCode configurations. Each profile contains:

- `AGENTS.md` - Your coding rules and preferences
- `skills/` - Per-profile skills directory (isolated per profile)
- `opencode.json` - Optional configuration (modes, MCP servers, etc.)

## Why?

- **Clean separation** - Each profile is self-contained
- **Easy to try** - Install someone's config, try it, switch back
- **Easy to remove** - Just `openstack use default` to go back
- **Simple** - No magic, just symlink management

## Documentation

- [Development Plan](docs/plan.md) - Architecture and implementation details
- [Creating Profiles](docs/creating-profiles.md) - How to make your own profile
- [CLI Reference](docs/cli.md) - Command documentation

## License

MIT
