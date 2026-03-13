---
name: remote-control
description: |
  Remotely control Make.com automation scenarios via the Make API. Use this skill
  whenever the user wants to manage, run, monitor, or debug Make.com scenarios,
  webhooks, connections, data stores, or execution logs. Also use when the user
  mentions "Make.com API", "Make scenario", "Make webhook", "run my scenario",
  "check my automations", "Make.com executions", or any task involving programmatic
  control of Make.com resources. Trigger even if the user just says "remote control"
  or "control my Make scenarios".
---

# Remote Control — Make.com Automation via API

Control Make.com scenarios, webhooks, data stores, and more through the Make REST API.

## Prerequisites

Before making any API calls, ensure you have:

1. **API Token** — The user must provide their Make.com API token. Store it in an environment variable: `MAKE_API_TOKEN`
2. **Base URL** — Depends on the user's Make.com region:
   - US: `https://us1.make.com/api/v2`
   - EU: `https://eu1.make.com/api/v2`
   - EU2: `https://eu2.make.com/api/v2`
   - Default to `https://eu1.make.com/api/v2` if unspecified. Ask the user which region they use.
3. **Team ID or Organization ID** — Required for listing resources. Ask the user if not known.

## Authentication

All requests use the `Authorization` header:

```
Authorization: Token {MAKE_API_TOKEN}
```

## Core Operations

### 1. List Scenarios

Retrieve all scenarios for a team.

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/scenarios?teamId=$TEAM_ID" | jq
```

Query parameters:
- `teamId` (required if no `organizationId`)
- `pg[offset]` — pagination offset
- `pg[limit]` — items per page (default 10, max 100)
- `pg[sortBy]` — sort field
- `pg[sortDir]` — `asc` or `desc`

### 2. Get Scenario Details

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID" | jq
```

### 3. Run a Scenario

Execute a scenario on demand. The scenario must be active.

```bash
# Synchronous (waits for result, max 40s)
curl -s -X POST -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"responsive": true}' \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID/run" | jq

# Asynchronous (returns executionId immediately)
curl -s -X POST -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"responsive": false}' \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID/run" | jq
```

If the scenario has **scenario inputs**, include them in the body:

```json
{
  "responsive": true,
  "data": {
    "inputName": "inputValue"
  }
}
```

### 4. Activate (Start) a Scenario

```bash
curl -s -X PATCH -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scheduling": {"type": "immediately"}}' \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID/start" | jq
```

### 5. Deactivate (Stop) a Scenario

```bash
curl -s -X PATCH -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID/stop" | jq
```

### 6. Create a Scenario

```bash
curl -s -X POST -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": '$TEAM_ID',
    "name": "My New Scenario",
    "blueprint": "{...}"
  }' \
  "$MAKE_BASE_URL/scenarios" | jq
```

### 7. Clone a Scenario

```bash
curl -s -X POST -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Cloned Scenario", "teamId": '$TEAM_ID'}' \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID/clone" | jq
```

### 8. Delete a Scenario

```bash
curl -s -X DELETE -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID" | jq
```

IMPORTANT: Always confirm with the user before deleting a scenario.

### 9. Update a Scenario

```bash
curl -s -X PATCH -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "scheduling": {"type": "indefinitely", "interval": 900}}' \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID" | jq
```

## Scenario Logs & Executions

### List Scenario Execution Logs

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID/logs?pg[limit]=10" | jq
```

### Get Incomplete Executions

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID/incomplete-executions" | jq
```

## Blueprints

### Get Scenario Blueprint

```bash
# Live blueprint
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID/blueprint" | jq

# Draft blueprint
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID/blueprint?draft=true" | jq
```

### Update Scenario Blueprint

```bash
curl -s -X PUT -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blueprint": "{...}", "scheduling": {"type": "indefinitely", "interval": 900}}' \
  "$MAKE_BASE_URL/scenarios/$SCENARIO_ID/blueprint" | jq
```

## Webhooks (Hooks)

### List Hooks

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/hooks?teamId=$TEAM_ID" | jq
```

### Get Hook Details

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/hooks/$HOOK_ID" | jq
```

### Create a Hook

```bash
curl -s -X POST -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook",
    "teamId": '$TEAM_ID',
    "typeName": "gateway-webhook",
    "typeKey": "gateway-webhook"
  }' \
  "$MAKE_BASE_URL/hooks" | jq
```

### Enable / Disable a Hook

```bash
# Enable
curl -s -X PATCH -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' \
  "$MAKE_BASE_URL/hooks/$HOOK_ID" | jq

# Disable
curl -s -X PATCH -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}' \
  "$MAKE_BASE_URL/hooks/$HOOK_ID" | jq
```

### View Webhook Queue (Incomings)

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/hooks/$HOOK_ID/incomings" | jq
```

### Delete a Hook

```bash
curl -s -X DELETE -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/hooks/$HOOK_ID" | jq
```

IMPORTANT: Always confirm with the user before deleting a hook.

## Connections

### List Connections

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/connections?teamId=$TEAM_ID" | jq
```

### Get Connection Details

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/connections/$CONNECTION_ID" | jq
```

### Verify a Connection

```bash
curl -s -X POST -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/connections/$CONNECTION_ID/test" | jq
```

## Data Stores

### List Data Stores

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/data-stores?teamId=$TEAM_ID" | jq
```

### Get Data Store Records

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/data-stores/$DATA_STORE_ID/data" | jq
```

### Add a Record

```bash
curl -s -X POST -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key": "my-key", "data": {"field1": "value1"}}' \
  "$MAKE_BASE_URL/data-stores/$DATA_STORE_ID/data" | jq
```

### Update a Record

```bash
curl -s -X PUT -H "Authorization: Token $MAKE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": {"field1": "updated-value"}}' \
  "$MAKE_BASE_URL/data-stores/$DATA_STORE_ID/data/$RECORD_KEY" | jq
```

### Delete a Record

```bash
curl -s -X DELETE -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/data-stores/$DATA_STORE_ID/data/$RECORD_KEY" | jq
```

## Organizations & Teams

### List Organizations

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/organizations" | jq
```

### List Teams

```bash
curl -s -H "Authorization: Token $MAKE_API_TOKEN" \
  "$MAKE_BASE_URL/teams?organizationId=$ORG_ID" | jq
```

## Workflow Guidelines

When the user asks to work with Make.com, follow this workflow:

1. **Check for credentials** — Verify `MAKE_API_TOKEN` is set. If not, ask the user to provide it.
2. **Determine region** — Ask the user which Make.com region they use (US, EU, EU2) to set the base URL.
3. **Identify team/org** — If not known, list organizations and teams to find the right IDs.
4. **Execute the operation** — Use the appropriate API endpoint from the sections above.
5. **Parse and present results** — Use `jq` to format JSON output. Summarize results clearly.
6. **Handle errors** — If a request fails:
   - `401` — Token is invalid or expired. Ask user to check their API token.
   - `403` — Insufficient permissions. The user's API scope may not cover this action.
   - `404` — Resource not found. Verify the ID is correct.
   - `422` — Validation error. Check the request body.
   - `429` — Rate limited. Wait and retry.

## Safety Rules

- NEVER delete scenarios, hooks, or data store records without explicit user confirmation.
- NEVER modify a scenario blueprint without showing the user what will change.
- ALWAYS prefer `responsive: true` when running scenarios so the user sees the result.
- When listing resources, start with a small `pg[limit]` (10-20) to avoid overwhelming output.
- Treat the API token as sensitive — never log it or include it in output.

## Common Tasks — Quick Reference

| Task | Method | Endpoint |
|------|--------|----------|
| List scenarios | GET | `/scenarios?teamId={id}` |
| Get scenario | GET | `/scenarios/{id}` |
| Run scenario | POST | `/scenarios/{id}/run` |
| Start scenario | PATCH | `/scenarios/{id}/start` |
| Stop scenario | PATCH | `/scenarios/{id}/stop` |
| Clone scenario | POST | `/scenarios/{id}/clone` |
| Delete scenario | DELETE | `/scenarios/{id}` |
| Get blueprint | GET | `/scenarios/{id}/blueprint` |
| List hooks | GET | `/hooks?teamId={id}` |
| Get hook | GET | `/hooks/{id}` |
| List connections | GET | `/connections?teamId={id}` |
| Test connection | POST | `/connections/{id}/test` |
| List data stores | GET | `/data-stores?teamId={id}` |
| Get records | GET | `/data-stores/{id}/data` |
| View logs | GET | `/scenarios/{id}/logs` |
| List teams | GET | `/teams?organizationId={id}` |
| List orgs | GET | `/organizations` |
