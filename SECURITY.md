# Security Policy

## Supported Versions

Security fixes are applied to the current development branch. Older releases may not receive security updates.

## Reporting a Vulnerability

Please do not open a public GitHub issue for a suspected security vulnerability.

Use GitHub's private vulnerability reporting for this repository when available. If private reporting is not enabled, contact the repository maintainer through the private contact method listed in the repository profile.

Include a clear description, affected versions or configurations, reproduction steps or a minimal proof of concept, potential impact, and any suggested mitigation.

Do not include real credentials, access tokens, personal data, or production database contents in a report.

## Credential and Secret Exposure

If a secret is accidentally committed or exposed:
1. Revoke or rotate it immediately.
2. Remove it from the working tree and future commits.
3. Treat the exposed value as compromised even if the commit is later deleted.

Never use `.env` files containing real credentials in examples, issues, pull requests, or documentation.
