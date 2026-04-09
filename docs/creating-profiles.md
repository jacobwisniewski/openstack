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

## Creating Your Config Repository

If you already have an OpenCode config and want to turn it into a shareable profile:

### Step 1: Initialize Git Repo

```bash
# Navigate to your opencode config
cd ~/.config/opencode

# Initialize git repository
git init

# Create .gitignore for sensitive files
cat > .gitignore << 'EOF'
# Never commit auth tokens or secrets
.env
.env.local
*.key
*.token
EOF

# Add your files
git add AGENTS.md
git add skills/  # if you have custom skills
git add opencode.json  # if you have one
git add README.md  # optional
git add .gitignore

# Commit
git commit -m "Initial opencode config"
```

### Step 2: Create GitHub Repository

```bash
# Create repo on GitHub (using gh CLI)
gh repo create my-opencode-config --private --source=. --push

# Or create on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/my-opencode-config.git
git push -u origin main
```

### Step 3: Clean Up Secrets

Before pushing, verify no secrets in your files:

```bash
# Check for potential secrets
grep -r "api_key\|apikey\|token\|secret" . --include="*.md" --include="*.json" --include="*.yaml"

# If you find any, move them to environment variables
# In opencode.json, use: "apiKey": "{env:MY_API_KEY}"
```

## Publishing

Once your repo is ready:

1. Make repo public (optional but recommended for sharing)
2. Add a README explaining what your profile does
3. Share the URL

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
