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
- Reusable workflow: `.github/workflows/cla-mark.yml` (implementation)
- Active workflow caller: `.github/workflows/cla.yml` (uses the reusable workflow)
- Example caller: `cla.yml` (root directory) and `workflows/cla.ylm` (example with typo)
- Labels: "CLA: covered" and "CLA: review"
- Supports allowlisting users and treating org members/collaborators as covered

## File Structure

```
.github/
  workflows/          # Active GitHub Actions workflows (reusable)
  PULL_REQUEST_TEMPLATE.md
  copilot-instructions.md (this file)
examples/             # Example projects and mockups
workflows/            # Example workflow configuration files
ETHICS.md            # Ethics and responsible use policy
LICENSE              # MPL-2.0 license
LISANCE.txt          # Joy-sensitive licensing document
README.md            # Creative repository introduction
cla.yml              # CLA workflow caller configuration
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

## Issue Management & Resolution

### Issue Summary
This repository tracks various types of issues:
- **Setup & Configuration**: Issues related to Copilot instructions, workflow setup, and repository configuration
- **Feature Requests**: Enhancements to workflows, tools, and documentation (marked with ✨)
- **Questions & Discussion**: Open-ended discussions about the repository philosophy and usage

### Checking Issue Status
When working with issues in this repository:
- Use GitHub's issue list to check current open issues
- Look for labels like "CLA: covered" or "CLA: review" for CLA-related items
- Check comments for resolution updates from @charliecreates and other team members
- Issues may be resolved through:
  - Direct code changes in PRs
  - Workflow adjustments
  - Documentation updates
  - Collaborative discussion leading to consensus

### Resolution Patterns
- **Duplicate issues**: Multiple issues may exist for the same topic (e.g., #10 and #29 both about Copilot instructions)
- **Iterative improvements**: Some issues are resolved incrementally through multiple PRs
- **Community-driven**: Resolution often involves input from @CosmicJesterX, @JX, @starla, and the "TEX gang"
- **Creative solutions**: Fixes honor the repository's philosophy of "concentric truths" and "protocols with personality"

### Current Open Issues (as of December 2025)
When reviewing issues:
- **#29** - ✨ Set up Copilot instructions: Active - being addressed in current PR
- **#27** - Hm, any ideas?: Open discussion
- **#19** - hi ! 8): Open discussion with 3 comments
- **#10** - ✨ Set up Copilot instructions: Previously discussed, copilot-instructions.md already exists and is maintained

**Note**: This snapshot represents the state as of December 29, 2025. Issue counts and status should always be verified through GitHub's issue tracker for the most current information.

## Special Notes

- Read ETHICS.md first (or last, or just feel it)
- LISANCE.txt should be read from bottom to top
- Respect the tentacles
- Don't be mean
- Merge only when the stars align

---

*BLEKKSPRUT does not exist to be cloned. It exists to be experienced.*

> Ink gently. Push bravely. Code with personality.
