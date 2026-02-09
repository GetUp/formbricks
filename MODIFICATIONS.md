# Modifications to Formbricks

This document tracks all modifications made to the original Formbricks codebase for GetUp's deployment.

**Base Version:** Formbricks 4.6.1 (tag: `4.6.1`)
**Fork Repository:** https://github.com/GetUp/formbricks

**Notice:** This document satisfies AGPLv3 §5(a) requirement for modification disclosure.

---

## 2026-02-09 (Upgrade to 4.6.1)

### Upstream Upgrade: 4.5.0 -> 4.6.1
**Modified by:** GetUp Engineering Team

**Changes:**
- Created upstream reference branch `upstream-4.6.1` from upstream tag `4.6.1`
- Created GetUp release branch `release/4.6.1-getup` from `upstream-4.6.1`
- Reapplied all existing GetUp customisations from the `4.5.0` release line
- `apps/web/modules/survey/link/components/survey-client-wrapper.tsx` - merged upstream additions (`CustomScriptsInjector`, RTL logo direction handling) with GetUp's `DISABLE_FORMBRICKS_BRANDING` behaviour

**Reapplied Commit Provenance (from `upstream-4.5.0..release/4.5.0-getup`):**
- `c9f720a71` feat: update branding assets and metadata for GetUp
- `26b15e460` feat: add custom legal footer for GetUp
- `6b0641135` feat: add environment variable to disable Formbricks branding
- `2cc019dae` docs: document modifications for AGPLv3 compliance
- `c17e73443` ci: customise GitHub workflows for GetUp deployment
- `9806a6235` fix: sticky navigation buttons in surveys for long questions
- `da2e82f8d` refactor: conditionally render branding container only when needed
- `ae079b0a3` docs: update MODIFICATIONS.md for 4.5.0-gu-v1 release
- `f7b1d456d` fix: sticky navigation buttons for 4.5.0

**Compatibility Notes:**
- `DISABLE_FORMBRICKS_BRANDING` behaviour remains intact for both link survey wrapper and inline survey branding visibility
- Turbo build cache dependency for `DISABLE_FORMBRICKS_BRANDING` remains configured in `turbo.json`

**Reason:** Upgrade GetUp fork to upstream Formbricks `4.6.1` while preserving all existing GetUp-specific behaviour and AGPL compliance customisations

---

## 2025-10-29

### Branding Assets and Metadata
**Modified by:** GetUp Engineering Team

**Files:**
- `apps/web/public/favicon.ico`
- `apps/web/public/favicon/*` (all favicon variants)
- `apps/web/app/layout.tsx`

**Changes:**
- Replaced all Formbricks favicon assets with GetUp branding
- Updated application metadata (title, description) to "GetUp" and "GetUp's Survey Suite"

**Reason:** Rebrand application for GetUp organisational deployment

---

### Custom Legal Footer
**Modified by:** GetUp Engineering Team

**Files:**
- `apps/web/modules/survey/link/components/custom-legal-footer.tsx` (new file)
- `apps/web/modules/survey/link/components/legal-footer.tsx`

**Changes:**
- Created custom legal footer component with GetUp-specific content
- Modified original legal footer to conditionally render custom footer
- Custom footer includes:
  - Modal dialog with "Legal" button
  - Privacy policy link (configurable via `PRIVACY_URL`, defaults to GetUp's policy)
  - Source code repository link (https://github.com/GetUp/formbricks)
  - AGPLv3 licence notice
  - Attribution to Formbricks GmbH

**Reason:**
- Provide customisation point for legal footer content
- Comply with AGPLv3 Section 13 requirement for prominent source code access
- Align legal information with GetUp's privacy policy

---

### Environment Variable for Branding Control
**Modified by:** GetUp Engineering Team

**Files:**
- `apps/web/lib/env.ts`
- `apps/web/lib/constants.ts`
- `apps/web/modules/survey/link/components/survey-renderer.tsx`
- `apps/web/modules/survey/link/components/survey-client-wrapper.tsx`
- `apps/web/modules/survey/link/components/pin-screen.tsx`
- `.env.example`
- `turbo.json`

**Changes:**
- Added `DISABLE_FORMBRICKS_BRANDING` environment variable (default: not set)
- Implemented prop-drilling pattern to pass branding flag from server components to client components
- Modified `isBrandingEnabled` logic to respect `DISABLE_FORMBRICKS_BRANDING` when true
- Added environment variable to Turbo pipeline configuration
- Updated `.env.example` with documentation

**Usage:**
```bash
# Disable Formbricks branding in surveys
DISABLE_FORMBRICKS_BRANDING=1
```

**Reason:** Provide configuration-based control over survey branding without modifying database values

---

## 2025-10-30

### Docker Build System Changes
**Modified by:** GetUp Engineering Team

**Files:**
- `.github/actions/build-and-push-docker/action.yml` (lines 271-290)
- `.github/workflows/build-and-push-ecr.yml` (line 90)

**Changes:**
- Replaced `depot/build-push-action@636daae76684e38c301daa0c5eca1c095b24e780` (v1.14.0) with `docker/build-push-action@ca052bb54ab0790a636c9b5f226502c73d547a25` (v5.4.0)
- Removed Depot-specific parameters: `project: tw0fqmsx3c` and `token: ${{ env.DEPOT_PROJECT_TOKEN }}`
- Changed platforms from `linux/amd64,linux/arm64` to `linux/amd64` only
- Removed `DEPOT_PROJECT_TOKEN` from environment variables in both files

**Reason:** GetUp infrastructure uses standard Docker builds instead of Depot service. Simplified to single platform (amd64) for GetUp's deployment targets. Reduces external dependencies and costs while maintaining full ECR deployment compatibility.

---

### GitHub Workflows Trigger Changes
**Modified by:** GetUp Engineering Team

**Files:**
- `.github/workflows/chromatic.yml` (lines 3-8)
- `.github/workflows/sonarqube.yml` (lines 2-10)
- `.github/workflows/translation-check.yml` (lines 6-23)

**Changes:**

**chromatic.yml:**
- Commented out automatic `push` trigger for `main` branch
- Kept `workflow_dispatch` for manual execution
- Added comment: "GetUp: Commented out automatic push trigger - run manually only"

**sonarqube.yml:**
- Commented out automatic `push` trigger for `main` branch
- Kept `workflow_dispatch`, `pull_request`, and `merge_group` triggers active
- Added comment: "GetUp: Commented out automatic push trigger - runs on PR only"

**translation-check.yml:**
- Added `workflow_dispatch` trigger for manual execution
- Commented out automatic `push` trigger for `main` branch with path filters
- Kept `pull_request` trigger with path filters
- Added comment: "GetUp: Commented out automatic push trigger - run manually or on PR only"

**Reason:** Provide manual control over workflow execution and reduce unnecessary automatic runs on every push to main. All workflows remain functional via manual dispatch and PR validation workflows continue to run automatically. This aligns with GetUp's deployment strategy of controlled, manual deployments.

**Impact:** No automatic workflows run on push to main (chromatic, sonarqube, translation-check). PR validation workflows (test, lint, e2e) remain unchanged and continue to run automatically on pull requests.

---

## 2025-10-31

### Conditional Branding Container Rendering
**Modified by:** GetUp Engineering Team

**Files:**
- `packages/surveys/src/components/general/survey.tsx`

**Changes:**
- Refactored branding/recaptcha container to only render when either is enabled
- Renders minimal spacer div when neither branding nor recaptcha is enabled
- Reduces visual noise when branding is disabled

**Reason:** When `DISABLE_FORMBRICKS_BRANDING=1` is set, the empty branding container was still visible. This change removes it entirely when not needed.

---

### Sticky Navigation Buttons Fix
**Modified by:** GetUp Engineering Team

**Files:**
- `packages/surveys/src/styles/global.css`

**Changes:**
- Added CSS rule to make survey navigation buttons sticky at bottom of screen
- Targets the button container pattern used across all question components
- Uses `position: sticky` with `bottom: 0` and appropriate z-index
- Background matches survey background colour for clean transition

**Reason:** Improves user experience for surveys with long question content, ensuring navigation buttons remain accessible without scrolling

---

## 2026-01-07 (Upgrade to 4.5.0)

### Upstream Upgrade: 4.1.0 → 4.5.0
**Modified by:** GetUp Engineering Team

**Changes:**
- Rebased all GetUp customisations onto upstream Formbricks 4.5.0
- This upgrade addresses the Next.js middleware vulnerability (CVE-2025-29927)
- Resolved conflicts from upstream refactoring (component structure changes)

**Files Updated for Upstream Compatibility:**
- `apps/web/modules/survey/link/components/survey-client-wrapper.tsx` - Added `DISABLE_FORMBRICKS_BRANDING` prop (upstream restructured `link-survey.tsx` into this component)
- `apps/web/modules/survey/link/components/survey-renderer.tsx` - Updated prop passing for new component structure
- `apps/web/modules/survey/link/components/pin-screen.tsx` - Updated prop passing for new component structure
- `packages/surveys/src/components/general/survey.tsx` - Merged conditional branding container logic with upstream changes

**Reason:** Security update to patch Next.js vulnerability and maintain compatibility with latest upstream features

---

## 2026-01-14

### Sticky Navigation Buttons Fix (Updated for 4.5.0)
**Modified by:** GetUp Engineering Team

**Files:**
- `packages/surveys/src/components/general/block-conditional.tsx`
- `packages/surveys/src/components/wrappers/scrollable-container.tsx`
- `packages/surveys/src/styles/global.css`

**Changes:**

`block-conditional.tsx`:
- Modified button container to always apply sticky positioning (previously only applied when `fullSizeCards` was true)
- Changed conditional `fullSizeCards ? "bg-survey-bg sticky bottom-0" : ""` to always apply `"bg-survey-bg sticky bottom-0 z-30 pt-2 mt-2"`
- Added `z-30` to ensure buttons appear above survey content/options
- Added `pt-2 mt-2` for visual separation from content above
- Added comment marking this as a GetUp customisation for easier identification during upstream merges

`scrollable-container.tsx`:
- Removed bottom gradient overlay (`from-survey-bg ... to-transparent`) which conflicted with sticky buttons
- Increased scroll-to-bottom chevron button z-index from `z-20` to `z-40` so it appears above sticky buttons

`global.css`:
- Removed obsolete CSS rule from 2025-10-31 that targeted `fb-` prefixed classes (no longer works in 4.5.0 due to Tailwind prefix removal and component restructuring)

**Note:** This replaces the original 2025-10-31 CSS-based fix which no longer worked after the 4.5.0 upgrade. The component-level fix is more robust and easier to maintain during upstream syncs.

**Reason:** Improves user experience for surveys with long question content, ensuring navigation buttons remain accessible without scrolling

---

**Related Documentation:**
- `docs/FORK_MAINTENANCE.md` - Upstream sync procedures
- `docs/VERSIONING.md` - Version management strategy
- `docs/DEPLOYMENT.md` - Deployment workflow documentation
- `docs/GETUP_FORK_SUMMARY.md` - Fork overview and action plan

## Licence Compliance

This fork maintains the AGPLv3 licence of the original Formbricks project. The `/packages/ee` directory contains Enterprise Edition code under a separate proprietary licence and remains unchanged.

All modifications documented in this file comply with AGPLv3 licence terms.

**AGPLv3 §13 Network Use Compliance:**
Users interacting with this software over a network can access the complete source code at the repository above. The custom legal footer (added in modifications above) provides a prominent link to the source code on all survey pages.

**Deployed Service:** https://survey.getup.org.au/

**Original Project:** Formbricks by Formbricks GmbH
**Original Repository:** https://github.com/formbricks/formbricks
**Licence:** AGPLv3 (excluding `/packages/ee`)

---
