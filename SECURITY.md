# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately via
[GitHub Security Advisories](https://github.com/e14s/bulk-data-client/security/advisories/new)
for this repository, or by email to **security@e14s.com**. Do not open a
public issue for a suspected vulnerability.

You can expect an acknowledgment within 2 business days.

## Triage targets

Confirmed findings are triaged and remediated within the following targets
(Element SDLC Standards §7.4):

| Severity | Target |
| -------- | ------ |
| Critical | 7 days |
| High     | 30 days |
| Medium   | 90 days |
| Low      | Next regular release |

A finding rated medium or higher blocks a production release unless a
documented exception is approved.

## Supported versions

Only the latest release on `main` is supported with security updates.

## Scanning

Every pull request runs secrets scanning (Gitleaks), static analysis
(CodeQL), and dependency/license scanning (npm audit + license allowlist +
CycloneDX SBOM). Dependabot monitors dependencies continuously.

## Accepted findings (SDLC §11 exceptions)

Current documented exceptions are recorded in `.gitleaksignore` (historical,
expired, or public sandbox credentials in git history) and in the issue
tracker for dependency findings that cannot yet be remediated (e.g. advisories
whose fixes require a newer Node.js runtime than the project supports).
