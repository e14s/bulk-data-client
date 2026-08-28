# Contributing

This repository follows the Element Software Development Lifecycle (SDLC)
Standards Policy. This document is the working summary of that policy for this
project. Where the two disagree, the policy wins.

## Workflow

1. **Start from an issue.** All work — features, defects, dependency updates —
   is captured as a GitHub issue with acceptance criteria before code is
   written (SDLC §4.1). Security-relevant work is labeled accordingly.
2. **Branch.** Create a feature branch from `main`. Never commit directly to
   `main`; it is a protected branch.
3. **Build.** Follow the secure coding standards (SDLC §6, OWASP ASVS 4.0 L2
   baseline). Write unit tests alongside code. Never commit credentials, keys,
   tokens, or connection strings — secrets live in GitHub Actions secrets or
   the platform's secrets manager. Reference the issue in your commits.
4. **Open a PR against `main`.** Every PR must reference its issue
   (e.g. `Closes #123`). Automated checks must pass:
   - `CI / build-test` — build, full test suite, coverage floor
   - `Gitleaks / gitleaks` — secrets scan (zero findings)
   - `CodeQL / analyze` — static analysis
   - `Dependency Checks / audit-license-sbom` — npm audit (no high+ in
     production dependencies), license allowlist, SBOM generation
5. **Review.** At least one approving review from someone other than the
   author is required. Review covers correctness, security, test adequacy, and
   policy adherence. All review comments and scan findings rated medium or
   higher are resolved or formally accepted (see Exceptions) before merge.
6. **Merge.** Merges preserve history (no force-push to protected branches).

## Definition of Done

A change is complete when (SDLC Appendix B, trimmed to what applies to this
CLI project):

- [ ] Linked issue's acceptance criteria met and verified
- [ ] PR approved by at least one reviewer other than the author; all comments
      resolved
- [ ] All required CI checks green: build, unit tests, coverage at or above the
      current ratchet floor (target 90% for changed code), CodeQL, Gitleaks,
      dependency and license scan
- [ ] No open medium-or-higher SAST or dependency findings, or an approved
      exception is recorded
- [ ] New dependencies approved by the Tech Lead; SBOM regenerates cleanly
- [ ] No secrets in code, config, docs, or logs
- [ ] Release notes updated for user-visible changes

## Dependencies

New dependencies require Tech Lead approval before use (SDLC §7.2): actively
maintained, permissive license, no known unremediated critical
vulnerabilities, sourced from the official npm registry. Dependabot findings
are triaged within: Critical 7 days, High 30 days, Medium 90 days, Low next
regular release (§7.4).

## Generative AI

AI-assisted or AI-generated code is treated the same as any other code: it
goes through the same PR review, tests, and scans, and the developer who
commits it is responsible for it (SDLC §10).

## Exceptions

Any deviation from policy (releasing with an open medium finding, coverage
below threshold, an unsupported component) requires a written exception in the
issue tracker stating the risk, the compensating control, the owner, and the
expiration date, approved by the Security Lead (SDLC §11).

## Testing

```sh
npm ci
npm run build
npm test
```

The test suite spins up a local mock FHIR server; no network access or real
credentials are required. Production data is never used in tests (SDLC §8) —
fixtures are synthetic.
