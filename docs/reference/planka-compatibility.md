# Planka Compatibility

Planka API compatibility is an infrastructure concern. Agent-facing contracts should remain stable when Planka changes routes or payload shapes.

## Compatibility requirements
- Keep version-specific route handling inside the operation/compatibility boundary.
- Translate Planka responses into stable domain shapes before returning them to agents.
- Add regression tests for every supported Planka version and changed endpoint.
- Do not assume an upstream PR is merged or correct without validation.

## Known upstream context
The repository has tracked upstream reports concerning Planka v2 compatibility, including changes around comments, board memberships, labels, and tasks. The proposed v2 migration must be validated against the actual supported Planka version before becoming a compatibility guarantee.

See the upstream issue/PR references in `plans/agent-oriented-development.md`.
