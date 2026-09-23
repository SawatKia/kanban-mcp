# Tool Selection

## Principle
Choose the tool that expresses the agent's intent most directly.

Prefer:
- board context over several unrelated board/list/card reads;
- next-work discovery over manually reconstructing readiness;
- card context over fetching every card-related resource separately;
- workflow operations over manually chaining low-level mutations;
- batch operations when the requested work is genuinely a batch.

Use low-level or advanced query capabilities as an escape hatch when a semantic tool cannot express the required query.

## Avoid
- Calling multiple tools to reconstruct information already available from a context tool.
- Using canonical domain concepts when an agent-oriented operation exists.
- Performing unrelated mutations during a workflow operation.
- Repeating a mutation blindly after an uncertain response.
