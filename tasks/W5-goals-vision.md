# Week 5 — Goals & vision boards

## Checklist

- [x] **W5-T1** Goals + goal_tasks API and screens
- [~] **W5-T2** Vision boards + Storage uploads

## W5-T2 breakdown

| ID | Description | Priority | Status | Acceptance |
| --- | --- | --- | --- | --- |
| VB-001 | Validate image_path ownership prefix | P1 | [ ] | Paths must be under `vision-boards/{authId}/` or https allowlist |
| VB-002 | Signed upload URL API (service role) + client upload fallback | P1 | [ ] | POST returns path/token or client uploads via Supabase |
| VB-003 | Mobile image picker + upload + add item | P1 | [ ] | Gallery image appears on board |
| VB-004 | Delete item removes Storage object when possible | P2 | [ ] | Ownership-checked delete |
| VB-005 | Automated tests for path validation | P1 | [ ] | Reject foreign paths |

## Depends on

Week 4 complete
