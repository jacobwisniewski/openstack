---
"@jacobwisniewski/openstack": minor
---

Improve profile naming to include source scope

Profile names now include the owner/organization prefix from the git source URL:
- `git@github.com:user/repo.git` → `user-repo`
- `https://github.com/org/team/repo` → `team-repo`

This makes it easier to identify whose config you're using when multiple profiles are installed.