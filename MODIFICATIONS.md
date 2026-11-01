# Modifications to Formbricks

This document tracks all modifications made to the original Formbricks codebase for GetUp's deployment.

**Base Version:** Formbricks 4.9.7 (tag: `4.9.7`)
**Fork Repository:** https://github.com/GetUp/formbricks

**Notice:** This document satisfies AGPLv3 §5(a) requirement for modification disclosure.

---

## Release lines

Three tiers. Each branch is exactly what its instance runs; there is no brand switch in code.

| Tier | Branch | Image tag | Instance |
|---|---|---|---|
| Upstream reference | `upstream-<ver>`, from upstream tag `<ver>` | – | – |
| GetUp | `release/<ver>-getup` = `upstream-<ver>` + the GetUp customisation series | `<ver>-gu-vN` | https://survey.getup.org.au |
| SurveysAU | `release/<ver>-surveysau` = `release/<ver>-getup` + the SurveysAU series (first commit "feat: rebrand for SurveysAU"), free to diverge | `<ver>-surveysau-vN` | https://surveysau.com (admin `surveysau.gu.tools`) |

**Routing rule**
- A change both instances want lands on the getup branch; the surveysau branch picks it up at the next re-cut, or sooner by `git cherry-pick -x`.
- A SurveysAU-only change lands on the surveysau branch and never on getup.
- The same fix is never committed on both branches.

**Replay procedure on an upstream upgrade**
1. Getup branch per the playbook in the workspace `CLAUDE.md`: `upstream-<new>` from the upstream tag, `release/<new>-getup` from it, then `git cherry-pick -x` the series `git log --oneline upstream-<old>..release/<old>-getup` oldest to newest (skip MODIFICATIONS.md-only bookkeeping commits; carry this file forward and add a new entry).
2. Re-cut the SurveysAU branch: `git checkout -b release/<new>-surveysau release/<new>-getup`, then `git cherry-pick -x` the series `git log --oneline release/<old>-getup..release/<old>-surveysau`.
3. Each branch keeps its own `MODIFICATIONS.md`; the surveysau one records the getup base commit it was cut from plus its own series.

**Tags:** `<ver>-gu-vN` and `<ver>-surveysau-vN`, independent counters. Both branches build with `build-and-push-ecr.yml` into the same ECR repository (`internal-tools/formbricks-gu`) and differ only by tag.

---

## 2026-10-30 (4.9.7 follow-up fixes)

### Branding switch on inactive and completed survey pages
**Modified by:** GetUp Engineering Team

**Files:**
- `apps/web/modules/survey/link/components/survey-inactive.tsx`
- `apps/web/modules/survey/link/components/survey-completed-message.tsx`

**Changes:**
- Both files are server components and now import `DISABLE_FORMBRICKS_BRANDING` from `@/lib/constants` directly (no prop drilling needed)
- `showBranding = !DISABLE_FORMBRICKS_BRANDING && (!project || project.linkSurveyBranding)` gates the Formbricks footer logo (link to formbricks.com) in both files
- `survey-inactive.tsx`: `showCTA` is additionally gated by `!DISABLE_FORMBRICKS_BRANDING`, so the "Create your own" button linking to formbricks.com is hidden
- Hunks are marked with `GetUp:` comments

**Reason:** `DISABLE_FORMBRICKS_BRANDING=1` was honoured only on the live survey (survey client wrapper, PIN screen, inline branding). Paused, closed, expired, invalid-link and already-answered pages still showed the Formbricks logo, and paused/completed pages the "Create your own" button. This gap predates 4.9.7; it was found in the 4.9.7 review

---

### RDS CA bundle baked into the image
**Modified by:** GetUp Engineering Team

**Files:**
- `apps/web/Dockerfile` (runner stage, before `USER nextjs`)
- `apps/web/scripts/docker/rds-global-bundle.pem` (new file, vendored)

**Changes:**
- Vendored a fresh copy of https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem (fetched 2026-10-30, 114 certificates). It is force-added because `*.pem` is gitignored; the root `.dockerignore` `*.pem` rule matches root-level files only, so the file is in the build context (checked with `moby/patternmatcher`, the matcher BuildKit uses)
- The runner stage copies it from the build context with `COPY --chmod=644` to `/usr/local/share/ca-certificates/global-bundle.pem`, the path `NODE_EXTRA_CA_CERTS` points at
- To refresh: re-download to the same path and rebuild
- 2026-11-01 follow-up: `COPY --chmod=644` also set mode 644 on the directory it created, so Node could not read the bundle ("Permission denied" at start). Added `RUN chmod 755 /usr/local/share/ca-certificates` after the COPY.

**Compatibility Notes:**
- The shared instance ran every fork image from `4.1.0-gu-v1` to `4.6.1-gu-v2` without the bundle: no fork image ever contained the file, and Node logged "Ignoring extra certs" at every start. Only the pre-fork image (`terraform-getup-infra/docker/formbricks/Dockerfile`, wrapping stock `ghcr.io/formbricks/formbricks:4.0.0`) added it at this path. This change restores that behaviour
- `NODE_EXTRA_CA_CERTS` in Terraform is unchanged (same path); no infrastructure change is needed
- Prisma's query engine does not read `NODE_EXTRA_CA_CERTS`, so the database connection still depends on the `sslmode` in `DATABASE_URL`; the bundle affects Node-side TLS only

**Reason:** Make the image match what the ECS task definition already assumes, and stop the start-up warning

---

## 2026-10-30 (Upgrade to 4.9.7)

### Upstream Upgrade: 4.6.1 -> 4.9.7
**Modified by:** GetUp Engineering Team

**Changes:**
- Created upstream reference branch `upstream-4.9.7` from upstream tag `4.9.7`
- Created GetUp release branch `release/4.9.7-getup` from `upstream-4.9.7`
- Reapplied the GetUp customisation series from `release/4.6.1-getup` with `git cherry-pick -x`, oldest to newest
- `apps/web/modules/survey/link/components/legal-footer.tsx` - upstream added a `TERMS_URL` prop and link; merged so the GetUp custom footer still takes precedence. `custom-legal-footer.tsx` now accepts (and ignores) `TERMS_URL` so the `{...props}` spread stays type-exact
- `apps/web/modules/survey/link/components/survey-client-wrapper.tsx` - merged upstream's `TERMS_URL` pass-through with the `DISABLE_FORMBRICKS_BRANDING` gating of `isBrandingEnabled`
- `apps/web/lib/env.ts`, `turbo.json`, `.env.example` - `DISABLE_FORMBRICKS_BRANDING` re-added beside upstream's new `PASSWORD_RESET_TOKEN_LIFETIME_MINUTES` / `DEBUG_SHOW_RESET_LINK` entries
- `.github/workflows/translation-check.yml` - upstream removed the `paths:` filters from the triggers (filtering now happens in-job via `dorny/paths-filter`); the GetUp change is re-expressed as `workflow_dispatch` plus a commented-out `push` trigger without a path list
- `packages/surveys/src/components/general/survey.tsx`, `general/block-conditional.tsx`, `wrappers/scrollable-container.tsx`, `styles/global.css` - applied cleanly; the sticky navigation and conditional branding container hunks are unchanged in intent
- Cherry-picked `.tsx` files were re-formatted with the 4.9.7 toolchain (`prettier-plugin-tailwindcss` 0.7.2) so Tailwind class order matches upstream. The pre-commit hook had formatted the picks with the 4.6.1 `node_modules` (0.6.11), which reorders classes

**Reapplied Commit Provenance (from `upstream-4.6.1..release/4.6.1-getup`):**
- `3aa17303d` feat: update branding assets and metadata for GetUp
- `d825a443c` feat: add custom legal footer for GetUp
- `17da8ab41` feat: add environment variable to disable Formbricks branding
- `2aca97aa5` docs: document modifications for AGPLv3 compliance
- `8d6ffd42e` ci: customise GitHub workflows for GetUp deployment
- `80287b10f` fix: sticky navigation buttons in surveys for long questions
- `0246a7505` refactor: conditionally render branding container only when needed
- `8285e7a04` fix: sticky navigation buttons for 4.5.0
- Not reapplied: `47ddc755d`, `cfd882908`, `b69d8a2ba` (MODIFICATIONS.md-only bookkeeping; this file is carried forward from `release/4.6.1-getup` instead) and `d9d7d41b2` (see below)

**Dropped: OG image route backport (`d9d7d41b2`)**
- The 2026-10-29 backport of upstream PR 7208 (`@vercel/og` -> `next/og` in `apps/web/app/api/v1/client/og/route.tsx`) is not reapplied: upstream `4.9.7` already imports `ImageResponse` from `next/og` (verified with `git grep "next/og" 4.9.7 -- apps/web/app/api/v1/client/og/route.tsx`). The 2026-10-29 entry below is retained as history only

**Compatibility Notes:**
- Upstream added `TERMS_URL` to the link-survey legal footer; the GetUp Legal modal does not display it (it shows privacy, source and licence only). Extend `custom-legal-footer.tsx` before relying on `TERMS_URL`
- `DISABLE_FORMBRICKS_BRANDING` behaviour remains intact for the link survey wrapper, the PIN screen path and inline survey branding visibility; `turbo.json` still declares the variable for build caching. The inactive (paused, closed, expired, invalid link) and already-answered pages did not honour it before or after the upgrade; fixed in the follow-up entry above
- Upstream added 9 Prisma migrations between 4.6.1 and 4.9.7 (6 SQL, 3 TypeScript data migrations; 12 files in total, counted with `git diff --name-only --diff-filter=A 4.6.1 4.9.7 -- packages/database/migration`); none uses features beyond PostgreSQL 14
- RDS CA bundle: neither `apps/web/Dockerfile` nor `.github/actions/build-and-push-docker/action.yml` adds `/usr/local/share/ca-certificates/global-bundle.pem` to the fork image. The only Dockerfile that bakes the bundle in is `terraform-getup-infra/docker/formbricks/Dockerfile`, and it wraps the stock `ghcr.io/formbricks/formbricks:4.0.0` image, not this fork. The production task sets `NODE_EXTRA_CA_CERTS` to that path regardless; Prisma's query engine does not use `NODE_EXTRA_CA_CERTS`, so the database connection relies on the `sslmode` in `DATABASE_URL`. Confirm at runtime before the SurveysAU bring-up; this was not verified against the running container. Superseded: the bundle is now baked in (follow-up entry above)

**Reason:** Move the GetUp fork to the last 4.x upstream tag ahead of the SurveysAU instance build (whose branch is cut from this one), while preserving all GetUp-specific behaviour and AGPL compliance customisations

---

## 2026-10-29 (Upstream backport)

### Backport: OG image route uses next/og (upstream PR 7208)
**Modified by:** GetUp Engineering Team

**Files:**
- `apps/web/app/api/v1/client/og/route.tsx`

**Changes:**
- Changed the `ImageResponse` import from `@vercel/og` to `next/og` (one-line change, identical to upstream)
- The `@vercel/og` dependency in `apps/web/package.json` and the lockfile are left unchanged

**Upstream Provenance:**
- Pull request: https://github.com/formbricks/formbricks/pull/7208 ("fix: replace @vercel/og with next/og")
- Upstream commit: `202958cac22da634b867a82ae28197a3e9606a55` (author Theodór Tómas, merged 2026-02-06)
- Cherry-picked with `git cherry-pick -x`, keeping the upstream author and the "cherry picked from commit" trailer
- First released upstream in Formbricks `4.7.0` (not present in `4.6.1`)

**Compatibility Notes:**
- This backport becomes a no-op when the fork is refreshed to upstream `4.7.0` or later, because the change is already in upstream. Drop it during that refresh rather than reapplying it (done in the 4.9.7 upgrade above; this entry is history only)

**Reason:** The production image `formbricks-gu:4.6.1-gu-v1` throws "Cannot find module .../next/dist/compiled/@vercel/og/index.node.js" and "failed to pipe response" on every `/api/v1/client/og` request, because the Next.js standalone output does not trace the `@vercel/og` native binary. Survey link previews (Open Graph images) are broken as a result

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
