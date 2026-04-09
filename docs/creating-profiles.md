# Creating Profiles

A profile is a git repository containing your OpenCode configuration.

## Structure

```
my-opencode-config/
├── AGENTS.md          # Required - your coding rules
├── skills/            # Optional - per-profile skills
│   ├── my-skill/
│   │   └── SKILL.md
│   └── another-skill/
│       └── SKILL.md
├── opencode.json      # Optional - configuration
└── README.md          # Optional - documentation
```

## Required Files

### AGENTS.md

Your main configuration file with coding rules, conventions, and preferences.

Example:
```markdown
# Global Rules

## Code Style
- TypeScript with strict mode
- camelCase for variables, PascalCase for types
- Functional patterns preferred

## Commands
- Never run npm run dev or npm run build
- Run tests with jest
```

## Optional Files

### skills/

Directory containing OpenCode skills. Each skill is a subdirectory with a `SKILL.md` file.

Example:
```markdown
---
name: my-skill
description: Use when working with my specific workflow
---

# My Skill

Instructions here...
```

### opencode.json

OpenCode configuration file. Use `{env:VAR_NAME}` for secrets.

Example:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5",
  "permission": {
    "bash": "ask",
    "edit": "allow"
  }
}
```

### README.md

Human-readable documentation about your profile.

## Publishing

1. Create a git repository
2. Add your configuration files
3. Push to GitHub
4. Share the URL

Others can install with:
```bash
openstack install https://github.com/yourname/my-opencode-config
```

## Best Practices

- **No secrets**: Never commit API keys. Use `{env:VAR_NAME}` in opencode.json
- **Self-contained**: Each profile should work independently
- **Document**: Add a README explaining what your profile does
- **Test**: Verify it works before sharing

## Example Repositories

- [jacobwisniewski/opencode-config](https://github.com/jacobwisniewski/opencode-config) - Example profile
