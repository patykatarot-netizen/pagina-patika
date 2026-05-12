# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| implementing a change, preparing commits, splitting PRs, planning chained/stacked PRs | work-unit-commits | `/home/anto/.config/opencode/skills/work-unit-commits/SKILL.md` |
| drafting/posting feedback, review comments, maintainer replies, Slack messages, GitHub comments | comment-writer | `/home/anto/.config/opencode/skills/comment-writer/SKILL.md` |
| writing guides, READMEs, RFCs, onboarding docs, architecture docs, review-facing documentation | cognitive-doc-design | `/home/anto/.config/opencode/skills/cognitive-doc-design/SKILL.md` |
| PR exceeding 400 changed lines, planning chained PRs, stacked PRs, reviewable slices | chained-pr | `/home/anto/.config/opencode/skills/chained-pr/SKILL.md` |
| creating a GitHub issue, reporting a bug, requesting a feature | issue-creation | `/home/anto/.config/opencode/skills/issue-creation/SKILL.md` |
| creating a pull request, opening a PR, preparing changes for review | branch-pr | `/home/anto/.config/opencode/skills/branch-pr/SKILL.md` |
| user asks to create a new skill, add agent instructions, document patterns for AI | skill-creator | `/home/anto/.config/opencode/skills/skill-creator/SKILL.md` |
| writing Go tests, using teatest, adding test coverage | go-testing | `/home/anto/.config/opencode/skills/go-testing/SKILL.md` |
| user says "judgment day", "judgment-day", "review adversarial", "dual review" | judgment-day | `/home/anto/.config/opencode/skills/judgment-day/SKILL.md` |
| making a significant technical choice, comparing alternatives, choosing between libraries/frameworks/patterns, detecting a decision point | adr | `/home/anto/.config/opencode/skills/adr/SKILL.md` |
| build web components, pages, artifacts, posters, applications, websites, landing pages, dashboards, React components, HTML/CSS layouts, styling/beautifying any web UI | frontend-design | `/home/anto/proyectos-programacion/pagina-patika/.agents/skills/frontend-design/SKILL.md` |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### work-unit-commits
- Commit by work unit (deliverable behavior/fix/docs), NOT by file type (models/services/tests)
- Tests belong in the same commit as the behavior they verify
- Docs belong with the feature/workflow they explain
- Each commit must be reviewable independently: clear purpose, repo still makes sense after only this commit
- If SDD forecasts >400 lines, group commits into chained PR slices before implementing
- Use Conventional Commits format: `feat(auth): add token validation domain model and tests`

### comment-writer
- Start with the actionable point — do NOT recap the whole PR before feedback
- Be warm and direct, like a thoughtful teammate, not a corporate bot
- Keep it short: 1-3 paragraphs or a tight bullet list
- Explain WHY when asking for a change (technical reason)
- Avoid pile-ons — comment on the highest-value issue only
- Match thread language; in Spanish use Rioplatense voseo: `podés`, `tenés`, `fijate`
- No em dashes — use commas, periods, or parentheses instead

### cognitive-doc-design
- Lead with the answer — put decision/action/outcome first, context after
- Progressive disclosure: happy path first, then details/edge cases/references
- Chunk related info into small sections; keep flat lists short
- Signpost with headings, labels, callouts, summaries
- Prefer tables/checklists/examples over prose that must be remembered
- Design docs so reviewers can verify intent without reconstructing the whole story

### chained-pr
- MUST split when PR exceeds 400 changed lines unless it has `size:exception`
- Design each PR for ≤60-minute human review
- Every chained PR MUST state: where it starts, ends, what came before, what comes next
- Every chained PR MUST be independently understandable and verifiable
- One deliverable work unit per PR — no mixing unrelated refactors/features/tests/docs
- Include a dependency diagram marking the current PR
- Honor SDD delivery_strategy: ask-on-risk, auto-chain, single-pr, or exception-ok

### issue-creation
- Blank issues disabled — MUST use a template (bug report or feature request)
- Every issue gets `status:needs-review` automatically on creation
- A maintainer MUST add `status:approved` before any PR can be opened
- Search existing issues for duplicates first
- Pre-flight checkboxes: no duplicate + understands approval workflow

### branch-pr
- Every PR MUST link an approved issue (must have `status:approved` label)
- Every PR MUST have exactly one `type:*` label
- Branch naming: `type/description` — lowercase, only `a-z0-9._-` in description
- Branches: `feat/`, `fix/`, `chore/`, `docs/`, `style/`, `refactor/`, `perf/`, `test/`, `build/`, `ci/`, `revert/`
- PR body MUST include "Closes #N" referencing the approved issue
- Run shellcheck on modified shell scripts
- Automated checks must pass before merge

### skill-creator
- Create a skill when: pattern is used repeatedly, project conventions differ, complex workflows need steps, decision trees needed
- Do NOT create for: existing docs, trivial patterns, one-off tasks
- Structure: `skills/{name}/SKILL.md` + optional `assets/` + `references/`
- SKILL.md must have frontmatter: name, description with Trigger:, license, metadata
- Description format: "One-line description. Trigger: When the AI should load this skill"
- Include Critical Rules section with tables for patterns with actionable rules
- Keep rules concise, focused on behavior, not purpose/motivation

### go-testing
- Use table-driven tests for multiple test cases (standard Go pattern)
- Test Bubbletea Model state transitions directly via `Model.Update()`
- Use Charmbracelet's teatest for TUI integration testing
- Use Golden Files for HTML/text output that rarely changes — update with `-update` flag
- Prefer `go-cmp` for diffing complex structs over `reflect.DeepEqual`
- Test programs with `exec.Command` and check stdout/stderr exit codes
- Use `t.TempDir()` for test files, `t.Helper()` for test helpers, `t.Cleanup()` for teardown

### judgment-day
- Launch TWO blind judge sub-agents in parallel (delegate, async) — NEVER sequential
- Neither judge knows about the other — no cross-contamination
- Synthetic verdict table: Confirmed (both), Suspect A/B (one), Contradiction (disagree)
- WARNING classification: real (causes bug in realistic scenario → fix required) vs theoretical (contrived scenario → report as INFO, do not fix)
- After Fix Agent completes, re-judge both in parallel
- After 2 fix iterations with remaining issues → ask user to continue or escalate
- Round 1: present verdict, only fix after user confirms
- Round 2+: only re-judge for confirmed CRITICALs; fix real WARNINGs inline without re-judge

### adr
- **Decision Filter** — antes de sugerir ADR, verificar: (1) ¿2+ opciones viables? (2) ¿pros/contras distintos? (3) ¿alguien fuera de esta charla se beneficia? Si alguna es NO, no sugerir
- Create ADR when choosing between libraries, architectural patterns, tools, or rejecting alternatives — NOT for trivial impl details or SDD-covered decisions
- **ADR vs Nota Rápida**: ADR completa (archivo + Engram) solo cuando hay 2+ opciones, afecta a otro dev, tradeoff real, o modifica cómo se construye el proyecto. Si no, solo nota en Engram
- Use /decide workflow: define problem → list options with tradeoffs → make decision → save to docs/adr/ and Engram
- Y-statement format: "In the context of {situation}, facing {problem}, we decided for {option} to achieve {quality}, accepting {downside}"
- ADR file: docs/adr/{NNNN}-{slug}.md with sections: Context, Options Considered, Decision, Consequences
- Lifecycle: proposed → accepted → deprecated/superseded
- **ADR Review**: en cada session_close o al modificar código vinculado a una ADR, verificar si la decisión sigue vigente. deprecated si ya no aplica, superseded si fue reemplazada (linkear la nueva)
- Save to Engram with topic_key "adr/{project}/{slug}", type "decision", capture_prompt false
- ADR is for lightweight single decisions (5-10 min); SDD is for full feature cycles (hours/days)
- Superseded ADRs MUST link to their replacement
- **Commits**: incluir `ref: ADR-NNNN` en commits que implementan una decisión documentada

### frontend-design
- Commit to a BOLD aesthetic direction before coding (minimal, maximalist, retro-futuristic, luxury, brutalist, etc.)
- Avoid generic AI aesthetics: no Inter/Roboto/Arial, no purple-gradient-on-white clichés, no cookie-cutter layouts
- Typography: distinctive display + refined body font pairings; unexpected choices elevate the design
- Color: cohesive theme with dominant colors + sharp accents; use CSS variables for consistency
- Motion: CSS-only for HTML; Motion library for React; prioritize high-impact orchestrated reveals over scattered micro-interactions
- Spatial composition: asymmetry, overlap, diagonal flow, grid-breaking, or generous negative space / controlled density
- Backgrounds: create atmosphere with gradient meshes, noise textures, layered transparencies, dramatic shadows, grain overlays
- Match implementation complexity to aesthetic vision — maximalist needs elaborate animations, minimalist needs precision and restraint

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | `/home/anto/.config/opencode/AGENTS.md` | Global Gentle AI persona rules — orchestrator-level only |
