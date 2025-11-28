# Copilot Instructions for BLEKKSPRUT

## Repository Overview

BLEKKSPRUT is a small configuration repository (~15 files) providing:
- **Reusable CLA (Contributor License Agreement) workflows** for GitHub Actions
- **Example configurations** for consuming those workflows
- **A static HTML/CSS/JS UI mockup** (no backend, no build step)

**Languages/Technologies**: YAML (GitHub Actions workflows), JavaScript, HTML, CSS  
**License**: MPL-2.0  
**No build tools**: This repo has no package.json, no bundlers, no compiled assets.

---

## Build, Test & Validation Commands

**This repository has no build step.** There is no `npm install`, `npm run build`, or compilation required.

### Validating YAML Workflow Files

Always validate YAML syntax before committing workflow changes:
```bash
# Check YAML syntax (note: some line-length warnings are expected)
yamllint .github/workflows/*.yml

# The repo has existing line-length issues; focus on syntax errors, not warnings
```

### Validating JavaScript

For JavaScript files in `examples/mirc-ui-mock/`:
```bash
node --check examples/mirc-ui-mock/app.js
```

### Testing HTML/CSS/JS Examples

Open `examples/mirc-ui-mock/index.html` directly in a browser. The mock is:
- Fully offline (no networking, no storage)
- State lives only in memory until page reload
- Lock icon is decorative only (no actual encryption)

### Validating GitHub Actions Workflows

Workflows cannot be tested locally without external tools. They run on:
- `pull_request_target` events in GitHub
- The reusable workflow `.github/workflows/cla-mark.yml` is called by `.github/workflows/cla.yml`

---

## Project Layout

```
.github/
├── workflows/
│   ├── cla-mark.yml           # Reusable CLA workflow (implementation)
│   └── cla.yml                # Active workflow that calls cla-mark.yml
├── PULL_REQUEST_TEMPLATE.md   # PR template with ethics/security checklists
└── copilot-instructions.md    # This file

examples/
└── mirc-ui-mock/              # Static mIRC-style chat UI mock
    ├── index.html             # Entry point - open in browser
    ├── app.js                 # UI logic (vanilla JS, no dependencies)
    ├── styles.css             # Styling with light/dark theme support
    └── README.md              # Usage instructions for the mock

workflows/
└── cla.ylm                    # Example workflow caller (intentional .ylm typo)

Root files:
├── cla.yml                    # Another example CLA workflow caller
├── ETHICS.md                  # Ethics policy (MUST comply with this)
├── LICENSE                    # MPL-2.0 license text
├── LISANCE.txt                # Creative licensing document
└── README.md                  # Repository introduction
```

---

## Key Workflow: CLA Marker

The main functionality is the CLA workflow in `.github/workflows/cla-mark.yml`:

**Inputs** (all optional with defaults):
- `label_covered`: Label for CLA-covered PRs (default: "CLA: covered")
- `label_review`: Label for PRs needing review (default: "CLA: review")
- `allowlist_users`: Comma/space-separated usernames always covered
- `cover_org_members`: Treat org members/owners as covered (default: true)
- `cover_collaborators`: Treat collaborators as covered (default: false)
- `create_missing_labels`: Auto-create labels if missing (default: false)

**Required permissions**:
```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
```

---

## Code Style Requirements

### YAML Workflows
- Use `workflow_call` for reusable workflows
- Explicitly declare minimal permissions in each job
- Use `actions/github-script@v7` for complex logic
- Include `core.info()` logging and `core.summary` output

### JavaScript
- Use vanilla JS (no frameworks, no npm dependencies)
- Include `/* SPDX-License-Identifier: MPL-2.0 */` header
- Use descriptive variable names

### Naming Conventions
- File names: kebab-case (e.g., `cla-mark.yml`)
- YAML inputs: lowercase with underscores (e.g., `cover_org_members`)

---

## Ethics & Security (REQUIRED)

Always comply with `ETHICS.md`:
- **No PII** or sensitive trait inference
- **No scraping** of gated/paid content or DRM bypass
- **Never commit secrets**; use platform secrets
- **Keep logs generic**; no hostnames or personal data
- Prefer non-action over risky/ambiguous action

---

## PR Checklist

Before submitting changes, verify:
1. [ ] YAML files pass syntax validation
2. [ ] JavaScript files pass `node --check`
3. [ ] Changes comply with ETHICS.md
4. [ ] No secrets, hostnames, or PII in code or logs
5. [ ] PR template checklist is completed

---

## Trust These Instructions

These instructions are verified and accurate. Only search the codebase if:
- Information here appears incomplete or incorrect
- You need implementation details not covered above

> Ink gently. Push bravely. Code with personality.
