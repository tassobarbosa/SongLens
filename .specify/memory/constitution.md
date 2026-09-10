<!--
  Sync Impact Report
  ==================
  Version change: N/A → 1.0.0 (initial ratification)
  Modified principles: N/A (initial creation)
  Added sections:
    - Core Principles (6 principles)
    - Technology Stack & Constraints
    - Development Workflow & Quality Gates
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (no changes needed, Constitution Check is dynamic)
    - .specify/templates/spec-template.md ✅ (no changes needed, generic template)
    - .specify/templates/tasks-template.md ✅ (no changes needed, generic template)
    - .specify/templates/checklist-template.md ✅ (no changes needed, generic template)
  Follow-up TODOs: None
-->

# SongLens Constitution

## Core Principles

### I. Readability-First Code (NON-NEGOTIABLE)

All code MUST be written for humans to read first and machines to execute second.
This is the highest-priority code quality principle in the project.

- Every function, component, and module MUST have a clear, single responsibility
  expressed by its name alone — if a name requires a comment to clarify intent,
  rename it
- Variable and function names MUST be descriptive and self-documenting; single-letter
  variables are forbidden outside of trivial loop iterators (`i`, `j`)
- Complex logic MUST be extracted into well-named helper functions rather than
  inlined with explanatory comments
- Files MUST NOT exceed 300 lines; when a file grows beyond this limit, it MUST be
  split into cohesive modules
- Magic numbers and string literals MUST be extracted into named constants
- Nested logic MUST NOT exceed 3 levels of indentation; use early returns, guard
  clauses, or extraction to reduce nesting

**Rationale**: A codebase is read far more often than it is written. Prioritizing
readability reduces onboarding time, review friction, and defect rates.

### II. Library-First

Every feature MUST leverage existing, well-maintained open-source libraries before
considering a custom implementation.

- Before writing any component, utility, or service from scratch, the developer
  MUST search for an existing library that solves the problem
- A custom implementation is permitted ONLY when no suitable library exists, or when
  the available libraries introduce unacceptable bundle size, security risk, or
  licensing incompatibility — this decision MUST be documented in the PR description
- UI components MUST use an established component library (e.g., Radix UI, shadcn/ui,
  or equivalent) rather than hand-rolling interactive widgets like modals, dropdowns,
  or tooltips
- Audio/music-domain features MUST use proven libraries (e.g., Tone.js, tonal) rather
  than raw Web Audio API calls unless the library cannot fulfill the requirement

**Rationale**: Existing libraries carry battle-tested edge-case handling, accessibility
support, and community maintenance. Custom code adds maintenance burden that a small
team cannot sustain.

### III. Type Safety & Clean Code

The codebase MUST maintain strict type safety and zero tolerance for dead code.

- TypeScript strict mode (`"strict": true`) MUST be enabled in `tsconfig.json` with
  no escape hatches (`skipLibCheck` is acceptable for third-party types only)
- The use of `any` is forbidden; `unknown` with type narrowing MUST be used when the
  type is genuinely uncertain
- All function parameters and return types MUST be explicitly typed; inferred types
  are permitted only for local variables where the type is obvious from the
  assignment
- Unused imports, variables, functions, and components MUST be removed before merge;
  the linter MUST enforce `no-unused-vars` and `no-unused-imports` rules
- Dead feature flags, commented-out code blocks, and TODO-only stubs older than one
  sprint MUST be removed or converted into tracked issues
- Shared types MUST live in a dedicated `types/` directory and MUST NOT be duplicated
  across modules

**Rationale**: Type safety catches defects at compile time rather than runtime. Dead
code creates confusion about what is active and increases cognitive load.

### IV. Unit Test Coverage (NON-NEGOTIABLE)

Every feature MUST ship with unit tests. No feature is considered complete without
passing tests.

- Every exported function, hook, and component MUST have at least one unit test
  covering its primary behavior
- Tests MUST follow the Arrange-Act-Assert pattern and test behavior, not
  implementation details
- Mocks and stubs are permitted and encouraged for external dependencies (API calls,
  audio playback, browser APIs) to keep tests fast and deterministic
- Test files MUST be co-located with source files using the `.test.ts` or
  `.test.tsx` naming convention
- All tests MUST pass in CI before a branch can merge; flaky tests MUST be fixed or
  quarantined immediately
- Minimum coverage threshold: 80% line coverage for business logic modules; UI
  components MUST have at least smoke-render tests

**Rationale**: Unit tests are the primary safety net for refactoring and regression
prevention. Mocks isolate the unit under test and keep the suite fast.

### V. Unified Design System

All user-facing UI MUST use a single, shared design language and component library
to ensure visual and behavioral consistency.

- A single component library MUST be chosen and used across the entire application;
  mixing multiple UI frameworks (e.g., Material UI + Chakra) is forbidden
- Shared design tokens (colors, spacing, typography, border radii) MUST be defined
  in a central theme configuration and referenced via the token system — hardcoded
  CSS values are forbidden
- Every interactive element MUST meet WCAG 2.1 AA accessibility standards: keyboard
  navigable, screen-reader announced, sufficient color contrast
- Layout patterns (page shells, card grids, navigation) MUST use shared layout
  components rather than ad-hoc CSS in each page
- Responsive design MUST support mobile-first breakpoints: the app MUST be fully
  usable on screens 320px wide and above

**Rationale**: Musicians practice on phones, tablets, and desktops. A consistent
design system reduces visual bugs, accelerates feature development, and builds user
trust through predictable interaction patterns.

### VI. Progressive Web App Standards

SongLens MUST be built and delivered as a Progressive Web App that works reliably
across devices and network conditions.

- The app MUST include a valid `manifest.json` with icons, theme color, and
  `display: standalone` for installability
- A service worker MUST be registered to cache the app shell and critical assets for
  offline use
- Core practice features (metronome, tuner, saved exercises) MUST function offline
  once initially loaded
- The app MUST score 90+ on Lighthouse PWA audit categories (Performance, Best
  Practices, Accessibility, PWA)
- All network requests MUST handle offline/failure states gracefully with user-visible
  feedback rather than silent failures or uncaught exceptions

**Rationale**: Musicians practice in environments with unreliable connectivity
(rehearsal rooms, transit, outdoor settings). A PWA provides native-like reliability
without app store friction.

## Technology Stack & Constraints

- **Language**: TypeScript (strict mode) for all application code
- **Framework**: React 18+ with functional components and hooks exclusively; class
  components are forbidden
- **Build Tool**: Vite for development and production builds
- **Styling**: CSS Modules or a utility-first CSS framework (e.g., Tailwind CSS);
  global unscoped CSS is forbidden outside of theme reset files
- **State Management**: React Context + `useReducer` for global state; third-party
  state libraries (Zustand, Jotai) are permitted when Context becomes unwieldy —
  Redux is not permitted due to boilerplate overhead
- **Testing**: Vitest as the test runner; React Testing Library for component tests;
  MSW (Mock Service Worker) for API mocking
- **Linting/Formatting**: ESLint with strict TypeScript rules + Prettier; both MUST
  run in CI and locally via pre-commit hooks
- **Audio**: Tone.js or Web Audio API wrapper libraries for sound generation;
  tonal.js for music theory utilities (scales, chords, intervals)
- **PWA Tooling**: Vite PWA plugin (`vite-plugin-pwa`) for service worker generation
  and manifest management
- **Target Browsers**: Latest 2 versions of Chrome, Firefox, Safari, and Edge;
  iOS Safari 15+
- **Bundle Size Budget**: Initial load MUST NOT exceed 200 KB gzipped for the app
  shell (excluding lazy-loaded feature chunks)

## Development Workflow & Quality Gates

- **Branch Strategy**: Feature branches off `main`; merge via pull request only
- **Commit Messages**: Conventional Commits format (`feat:`, `fix:`, `docs:`,
  `test:`, `refactor:`, `chore:`) enforced by commit-lint or equivalent
- **Pre-commit Checks**: Linting, formatting, and type-checking MUST run before
  every commit (via Husky + lint-staged or equivalent)
- **CI Pipeline**: Every pull request MUST pass: type-check (`tsc --noEmit`), lint
  (`eslint`), unit tests (`vitest run`), and build (`vite build`) before merge is
  permitted
- **Code Review**: Every PR MUST be reviewed for constitution compliance: readability,
  type safety, test coverage, library usage justification, and design system
  adherence
- **No Warnings Policy**: The codebase MUST compile and lint with zero warnings;
  warnings MUST be resolved or explicitly suppressed with a justification comment
- **Documentation**: Public APIs, complex hooks, and non-obvious architectural
  decisions MUST be documented with JSDoc comments; a `README.md` at the project
  root MUST explain setup, development, and deployment

## Governance

This constitution is the authoritative reference for all development decisions in
the SongLens project. It supersedes informal conventions, individual preferences,
and prior practices not documented here.

- **Amendments**: Any change to this constitution MUST be proposed as a pull request
  with a rationale. Amendments MUST be reviewed and approved before merge.
  The version number MUST be incremented per semantic versioning:
  MAJOR for principle removals or incompatible redefinitions, MINOR for new
  principles or material expansions, PATCH for clarifications and wording fixes
- **Compliance Review**: Every pull request review MUST include a constitution
  compliance check. Reviewers MUST verify adherence to all six core principles
- **Conflict Resolution**: When a development decision conflicts with a principle,
  the principle takes precedence. Exceptions MUST be documented in the PR with a
  justification and flagged for constitution review
- **Guidance File**: Use `copilot-instructions.md` for runtime development guidance
  that supplements but does not override this constitution

**Version**: 1.0.0 | **Ratified**: 2026-05-31 | **Last Amended**: 2026-05-31
