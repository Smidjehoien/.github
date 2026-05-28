# BLEKKSPRUT Workflows

This document describes the optional personality workflows available in BLEKKSPRUT.

## Overview

BLEKKSPRUT includes several optional workflows that add character and helpful automation to your repository. All are disabled by default and can be enabled using repository variables.

## Friendly Tentacle

**File**: `.github/workflows/friendly-tentacle.yml`  
**Enable with**: Set repository variable `ENABLE_FRIENDLY_TENTACLE` to `true`

Responds to greetings in issues and comments with BLEKKSPRUT-style welcome messages.

### What it does

- Detects greetings like "hi", "hello", "hey", "8)", "👋" in issue titles, bodies, or comments
- Responds with one of five randomly selected friendly messages
- Messages maintain the repository's philosophical and creative tone

### Example

When someone opens an issue with "hi ! 8)" in the title, the workflow will respond with:

> Hey there! 8)
>
> You've awakened the friendly tentacle. It waves back, gracefully.
>
> > _In this repository, linear logic bends to concentric truths._

## PR Poetry

**File**: `.github/workflows/pr-poetry.yml`  
**Enable with**: Set repository variable `ENABLE_PR_POETRY` to `true`

Occasionally posts haikus on pull requests based on a configurable probability.

### Configuration

- Default probability: 13% (0.13)
- Override with repository variable `PR_POETRY_P` (e.g., `0.05` for 5%)

### Example haiku

```
Tiny tests whisper,
labels settle into place—
merge when logs are calm.
```

## Astral Clearance

**File**: `.github/workflows/astral-clearance.yml`  
**Enable with**: Set repository variable `ENABLE_ASTRAL` to `true`

Allows members, owners, and collaborators to toggle a "needs_astral_clearance" label via comment commands.

### Usage

In any PR comment, type:
- `/astral on` - Adds the "needs_astral_clearance" label
- `/astral off` - Removes the "needs_astral_clearance" label

### Permissions

Only users with OWNER, MEMBER, or COLLABORATOR association can use this command.

## Library Cat

**File**: `.github/workflows/library-cat.yml`  
**Enable with**: Set repository variable `ENABLE_LIBRARY_CAT` to `true`

Checks for WIP, fixup, or squash markers in PR titles and commits.

### What it checks

- PR title for: `WIP` (as a whole word), `fixup!`, or `squash!`
- Commit messages for the same markers
- Reports findings in the workflow summary
- Fails the workflow if markers are found (but continues on error)

## CLA Marker (Active by default)

**File**: `.github/workflows/cla-mark.yml` (reusable)  
**Called by**: `.github/workflows/cla.yml`

This is not optional - it's the core CLA marking workflow that labels pull requests based on contributor status.

See `cla.yml` in the repository root for configuration options.

---

## Enabling Workflows

To enable any optional workflow:

1. Go to your repository **Settings** → **Secrets and variables** → **Actions** → **Variables**
2. Click **New repository variable**
3. Add the variable name (e.g., `ENABLE_FRIENDLY_TENTACLE`)
4. Set the value to `true`
5. Click **Add variable**

---

*Remember: These workflows have personality. They glow faintly when no one is looking.*

> Ink gently. Automate with grace.
