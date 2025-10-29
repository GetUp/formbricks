# Modifications to Formbricks

This document tracks all modifications made to the original Formbricks codebase for GetUp's deployment.

**Base Version:** Formbricks upstream commit `056e572a313f02368a30530c9ba8e735c813cd69` (2025-10-28)
**Fork Repository:** https://github.com/GetUp/formbricks

**Notice:** This document satisfies AGPLv3 §5(a) requirement for modification disclosure.

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
- `apps/web/modules/survey/link/components/link-survey.tsx`
- `apps/web/modules/survey/link/components/pin-screen.tsx`
- `.env.example`
- `turbo.json`

**Changes:**
- Added `DISABLE_FORMBRICKS_BRANDING` environment variable (default: not set)
- Implemented prop-drilling pattern to pass branding flag from server components to client components
- Added environment variable to Turbo pipeline configuration
- Updated `.env.example` with documentation

**Usage:**
```bash
# Disable Formbricks branding in surveys
DISABLE_FORMBRICKS_BRANDING=1
```

**Reason:** Provide configuration-based control over survey branding without modifying database values

---

## Licence Compliance

This fork maintains the AGPLv3 licence of the original Formbricks project. The `/packages/ee` directory contains Enterprise Edition code under a separate proprietary licence and remains unchanged.

All modifications documented in this file comply with AGPLv3 licence terms.

**AGPLv3 §13 Network Use Compliance:**
Users interacting with this software over a network can access the complete source code at the repository above. The custom legal footer (added in modifications above) provides a prominent link to the source code on all survey pages.

**Deployed Service:** https://survey.getup.org.au/

**Original Project:** Formbricks by Formbricks GmbH
**Original Repository:** https://github.com/formbricks/formbricks
**Licence:** AGPLv3 (excluding `/packages/ee`)
