# Copilot Instructions for BLEKKSPRUT

## Repository Philosophy

BLEKKSPRUT is not a typical repository. It embraces:
- **Concentric truths** over linear logic
- **Protocols with personality** over rigid standards
- **Joy-sensitive material** and creative documentation
- **Ethics with teeth** (see ETHICS.md)

## Core Principles

### Ethics & Responsible Use
Always comply with `ETHICS.md`:
- **Non-targeting & benevolence**: No monitoring, profiling, or attempts to "catch" people
- **Consent-driven**: Participation is voluntary and opt-in
- **Data minimization**: Avoid PII, sensitive traits, and secrets entirely
- **Conservative posture**: Prefer non-action over risky or ambiguous action
- **No scraping**: Never scrape gated/paid content or bypass DRM/rate limits

### Security
- Never commit secrets; use platform secrets where needed
- Keep logs generic and short-lived
- No hostnames, secrets, or sensitive details in logs

## Code Style

### Documentation
- Embrace creative, poetic documentation that still conveys meaning
- Use personality and metaphor when appropriate
- Keep technical accuracy while adding warmth
- Example: The repository README uses metaphors like "tentacles" and "ink gently"

### Naming Conventions
- Use clear, descriptive names that may include creative flair
- Prefer kebab-case for file names (e.g., `cla-mark.yml`)
- Use lowercase with underscores for input parameters (e.g., `cover_org_members`)

### Comments
- Keep comments meaningful and concise
- Use emojis sparingly but intentionally (e.g., 📎 for warnings, 🕯️ for guidance)
- Avoid over-commenting obvious code

## GitHub Actions & Workflows

### Reusable Workflows
- Place reusable workflows in `.github/workflows/`
- Use `workflow_call` for reusable actions
- Provide clear input descriptions with sensible defaults
- Example structure from `cla-mark.yml`:
  ```yaml
  on:
    workflow_call:
      inputs:
        input_name:
          description: "Clear description"
          required: false
          default: "sensible_default"
          type: string
  ```

### Permissions
- Use minimal required permissions
- Explicitly declare permissions in jobs:
  ```yaml
  permissions:
    contents: read
    issues: write
    pull-requests: write
  ```

### GitHub Script Actions
- Use `actions/github-script@v7` for complex logic
- Include informative logging with `core.info()`
- Use `core.summary` for workflow run summaries
- Handle errors gracefully with try-catch blocks

## CLA Workflows

This repository provides CLA (Contributor License Agreement) marking workflows:
- Main workflow: `cla.yml` (caller)
- Reusable workflow: `cla-mark.yml` (implementation)
- Labels: "CLA: covered" and "CLA: review"
- Supports allowlisting users and treating org members/collaborators as covered

## File Structure

```
.github/
  workflows/          # Reusable GitHub Actions workflows
  PULL_REQUEST_TEMPLATE.md
  copilot-instructions.md (this file)
examples/             # Example projects and mockups
workflows/            # Workflow configuration examples
ETHICS.md            # Ethics and responsible use policy
LICENSE              # MPL-2.0 license
LISANCE.txt          # Joy-sensitive licensing document
README.md            # Creative repository introduction
cla.yml              # CLA workflow configuration
```

## Pull Request Guidelines

Use the PR template which includes:
- Summary of changes
- Ethics & Safety checklist (compliance with ETHICS.md)
- Security checklist (no secrets, safe logging)
- Optional notes for risks, follow-ups, or screenshots

## Testing & Validation

- Test workflows locally when possible using `act` or similar tools
- For web-based examples (like mirc-ui-mock), test by opening in browser
- No networking or storage for offline-first examples
- Keep test data free of secrets, hostnames, or personal data

## License

Code is licensed under MPL-2.0. See LICENSE file for details.
Also review LISANCE.txt for the joy-sensitive licensing perspective.

## Special Notes

- Read ETHICS.md first (or last, or just feel it)
- LISANCE.txt should be read from bottom to top
- Respect the tentacles
- Don't be mean
- Merge only when the stars align

---

*BLEKKSPRUT does not exist to be cloned. It exists to be experienced.*

> Ink gently. Push bravely. Code with personality.
