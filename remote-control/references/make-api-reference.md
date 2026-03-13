# Make.com API Reference

Comprehensive reference for the Make.com REST API. Full documentation at
[developers.make.com](https://developers.make.com/api-documentation).

## Table of Contents

1. [Authentication](#authentication)
2. [Base URLs](#base-urls)
3. [Pagination](#pagination)
4. [Scenarios](#scenarios)
5. [Scenarios > Blueprints](#scenarios--blueprints)
6. [Scenarios > Logs](#scenarios--logs)
7. [Hooks (Webhooks)](#hooks-webhooks)
8. [Hooks > Incomings](#hooks--incomings)
9. [Connections](#connections)
10. [Data Stores](#data-stores)
11. [Data Store Records](#data-store-records)
12. [Data Structures](#data-structures)
13. [Organizations](#organizations)
14. [Teams](#teams)
15. [Users](#users)
16. [Incomplete Executions](#incomplete-executions)
17. [Error Codes](#error-codes)
18. [Scheduling Types](#scheduling-types)
19. [Blueprint Format](#blueprint-format)

---

## Authentication

Every API request requires the `Authorization` header:

```
Authorization: Token YOUR_API_TOKEN
```

To create an API token:
1. Log in to Make.com
2. Go to your profile (bottom-left avatar)
3. Navigate to **API Access** > **API Tokens**
4. Click **Add token**, name it, and select scopes
5. Copy the generated token

### API Scopes

Tokens can be scoped to specific permissions:
- `scenarios:read` / `scenarios:write` — View/manage scenarios
- `connections:read` / `connections:write` — View/manage connections
- `hooks:read` / `hooks:write` — View/manage webhooks
- `datastores:read` / `datastores:write` — View/manage data stores
- `teams:read` — View teams
- `organizations:read` — View organizations

---

## Base URLs

| Region | Base URL |
|--------|----------|
| EU (default) | `https://eu1.make.com/api/v2` |
| US | `https://us1.make.com/api/v2` |
| EU2 | `https://eu2.make.com/api/v2` |

The user's region is visible in their Make.com dashboard URL.

---

## Pagination

List endpoints support pagination via query parameters:

| Parameter | Description |
|-----------|-------------|
| `pg[offset]` | Number of items to skip (default: 0) |
| `pg[limit]` | Number of items to return (default: 10, max: 100) |
| `pg[sortBy]` | Field to sort by |
| `pg[sortDir]` | Sort direction: `asc` or `desc` |

Response includes a `pg` object with `offset`, `limit`, and `total` for computing next pages.

---

## Scenarios

### GET /scenarios
List all scenarios for a team or organization.

**Query parameters:**
- `teamId` (int) — Team ID (required if no `organizationId`)
- `organizationId` (int) — Organization ID (required if no `teamId`)
- `pg[offset]`, `pg[limit]`, `pg[sortBy]`, `pg[sortDir]`
- `isActive` (bool) — Filter by active/inactive status
- `usedPackages` (string) — Filter by app package name

**Response fields per scenario:**
- `id` (int) — Scenario ID
- `name` (string) — Scenario name
- `teamId` (int)
- `isActive` (bool) — Whether the scenario is currently active
- `isPaused` (bool) — Whether the scenario is paused
- `scheduling` (object) — Scheduling configuration
- `createdAt` (datetime)
- `updatedAt` (datetime)
- `lastEdit` (datetime)
- `usedPackages` (array) — List of app packages used

### GET /scenarios/{scenarioId}
Get details of a specific scenario.

### POST /scenarios
Create a new scenario.

**Body:**
- `teamId` (int, required)
- `name` (string, required)
- `blueprint` (string) — JSON string of the blueprint
- `scheduling` (object) — Scheduling config

### PATCH /scenarios/{scenarioId}
Update a scenario.

**Body (all optional):**
- `name` (string)
- `scheduling` (object)
- `isLocked` (bool)

### DELETE /scenarios/{scenarioId}
Delete a scenario. Cannot be undone.

### POST /scenarios/{scenarioId}/run
Run a scenario on demand.

**Body:**
- `responsive` (bool) — `true` waits for result (max 40s), `false` returns immediately
- `data` (object) — Scenario input values (if the scenario has inputs defined)

**Response (when `responsive: true`):**
- `executionId` (string)
- `status` (string) — `success`, `error`, `warning`
- `outputs` (object) — Scenario output values (if defined)

### PATCH /scenarios/{scenarioId}/start
Activate a scenario.

**Body:**
- `scheduling` (object) — e.g. `{"type": "immediately"}`

### PATCH /scenarios/{scenarioId}/stop
Deactivate a scenario. Response includes `isActive: false`.

### POST /scenarios/{scenarioId}/clone
Clone a scenario.

**Body:**
- `name` (string, required) — Name for the clone
- `teamId` (int, required) — Target team ID
- `cloneStates` (bool) — Clone module states (default: false)

---

## Scenarios > Blueprints

### GET /scenarios/{scenarioId}/blueprint
Get the scenario blueprint.

**Query parameters:**
- `draft` (bool) — `true` for draft version, `false` for live
- `blueprintId` (int) — Specific blueprint version ID

**Response:**
- `blueprint` (object) — The blueprint definition containing modules, routes, and settings
- `scheduling` (object)

### PUT /scenarios/{scenarioId}/blueprint
Update a scenario's blueprint.

**Body:**
- `blueprint` (string) — JSON string of the new blueprint
- `scheduling` (object)

---

## Scenarios > Logs

### GET /scenarios/{scenarioId}/logs
Get execution logs for a scenario.

**Query parameters:**
- `pg[offset]`, `pg[limit]`
- `from` (datetime) — Start date filter (ISO 8601)
- `to` (datetime) — End date filter (ISO 8601)
- `status` (string) — Filter: `success`, `warning`, `error`

**Response fields per log entry:**
- `id` (string) — Execution ID
- `status` (string)
- `duration` (int) — Duration in milliseconds
- `operations` (int) — Number of operations consumed
- `transfer` (int) — Data transferred in bytes
- `timestamp` (datetime)

---

## Hooks (Webhooks)

### GET /hooks
List all hooks for a team.

**Query parameters:**
- `teamId` (int, required)
- `pg[offset]`, `pg[limit]`

**Response fields per hook:**
- `id` (int) — Hook ID
- `name` (string)
- `teamId` (int)
- `url` (string) — The webhook URL to send data to
- `enabled` (bool)
- `type` (string) — Hook type
- `scenarioId` (int) — Associated scenario
- `queueCount` (int) — Number of pending items in queue

### GET /hooks/{hookId}
Get details of a specific hook.

### POST /hooks
Create a new hook.

**Body:**
- `name` (string, required)
- `teamId` (int, required)
- `typeName` (string) — e.g. `gateway-webhook`
- `typeKey` (string) — e.g. `gateway-webhook`

### PATCH /hooks/{hookId}
Update a hook.

**Body (all optional):**
- `name` (string)
- `enabled` (bool)

### DELETE /hooks/{hookId}
Delete a hook. Cannot be undone.

### POST /hooks/{hookId}/learn/start
Start learning the data structure from incoming data.

### POST /hooks/{hookId}/learn/stop
Stop learning and save the learned data structure.

---

## Hooks > Incomings

### GET /hooks/{hookId}/incomings
List items in the webhook processing queue.

**Query parameters:**
- `pg[offset]`, `pg[limit]`

### DELETE /hooks/{hookId}/incomings
Clear the webhook queue.

---

## Connections

### GET /connections
List all connections for a team.

**Query parameters:**
- `teamId` (int, required)
- `pg[offset]`, `pg[limit]`
- `type` (string) — Filter by connection type/app

**Response fields per connection:**
- `id` (int)
- `name` (string)
- `accountName` (string)
- `accountType` (string) — App package name
- `teamId` (int)
- `editable` (bool)
- `uid` (int) — Creator user ID
- `metadata` (object)

### GET /connections/{connectionId}
Get details of a specific connection.

### POST /connections/{connectionId}/test
Test/verify a connection. Returns whether the connection is working.

### DELETE /connections/{connectionId}
Delete a connection.

---

## Data Stores

### GET /data-stores
List data stores for a team.

**Query parameters:**
- `teamId` (int, required)
- `pg[offset]`, `pg[limit]`

**Response fields:**
- `id` (int)
- `name` (string)
- `teamId` (int)
- `datastructureId` (int) — Associated data structure
- `records` (int) — Number of records
- `size` (int) — Size in bytes
- `maxSize` (int) — Maximum size in bytes

### GET /data-stores/{dataStoreId}
Get details of a data store.

### POST /data-stores
Create a new data store.

**Body:**
- `name` (string, required)
- `teamId` (int, required)
- `datastructureId` (int) — Data structure to use
- `maxSize` (int) — Maximum size in bytes

### PATCH /data-stores/{dataStoreId}
Update a data store.

### DELETE /data-stores/{dataStoreId}
Delete a data store.

---

## Data Store Records

### GET /data-stores/{dataStoreId}/data
List records in a data store.

**Query parameters:**
- `pg[offset]`, `pg[limit]`

### POST /data-stores/{dataStoreId}/data
Add a record.

**Body:**
- `key` (string, required) — Unique record key
- `data` (object, required) — Record fields

### PUT /data-stores/{dataStoreId}/data/{key}
Update a record by key.

**Body:**
- `data` (object, required) — Updated fields

### DELETE /data-stores/{dataStoreId}/data/{key}
Delete a record by key.

---

## Data Structures

### GET /data-structures
List data structures for a team.

**Query parameters:**
- `teamId` (int, required)

### GET /data-structures/{dataStructureId}
Get details of a data structure.

### POST /data-structures
Create a new data structure.

**Body:**
- `name` (string, required)
- `teamId` (int, required)
- `spec` (array) — Array of field definitions

**Field definition format:**
```json
{
  "name": "fieldName",
  "type": "text",
  "label": "Field Label",
  "required": true
}
```

Supported types: `text`, `number`, `boolean`, `date`, `time`, `timestamp`, `buffer`, `url`, `email`, `array`, `collection`, `select`

---

## Organizations

### GET /organizations
List all organizations the authenticated user belongs to.

**Response fields:**
- `id` (int)
- `name` (string)
- `countryId` (int)
- `timezoneId` (int)

---

## Teams

### GET /teams
List teams for an organization.

**Query parameters:**
- `organizationId` (int, required)

**Response fields:**
- `id` (int)
- `name` (string)
- `organizationId` (int)

---

## Users

### GET /users/me
Get the authenticated user's profile.

**Response:**
- `id` (int)
- `name` (string)
- `email` (string)
- `language` (string)
- `timezone` (string)

---

## Incomplete Executions

### GET /scenarios/{scenarioId}/incomplete-executions
List incomplete (failed) executions for a scenario.

**Query parameters:**
- `pg[offset]`, `pg[limit]`

**Response fields:**
- `id` (string) — Execution ID
- `reason` (string) — Failure reason
- `resolved` (bool) — Whether it has been resolved
- `timestamp` (datetime)

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request — invalid parameters |
| 401 | Unauthorized — invalid or missing API token |
| 403 | Forbidden — insufficient API token scopes |
| 404 | Not found — resource doesn't exist |
| 409 | Conflict — resource already exists |
| 422 | Unprocessable entity — validation error |
| 429 | Too many requests — rate limited (wait and retry) |
| 500 | Internal server error |

---

## Scheduling Types

When configuring scenario scheduling:

| Type | Description | Extra Fields |
|------|-------------|--------------|
| `immediately` | Run once immediately | — |
| `indefinitely` | Run on interval | `interval` (seconds, min 60) |
| `once` | Run at a specific time | `date` (ISO 8601) |

Example:
```json
{
  "scheduling": {
    "type": "indefinitely",
    "interval": 900
  }
}
```

---

## Blueprint Format

A blueprint defines the modules and routing of a scenario. Key structure:

```json
{
  "name": "Scenario Name",
  "flow": [
    {
      "id": 1,
      "module": "app:ActionName",
      "version": 1,
      "mapper": {
        "param1": "value1"
      },
      "metadata": {
        "designer": { "x": 0, "y": 0 }
      }
    }
  ],
  "metadata": {
    "version": 1
  }
}
```

Each module in the flow has:
- `id` (int) — Unique module ID within the blueprint
- `module` (string) — Module identifier (e.g., `http:ActionSendData`)
- `version` (int) — Module version
- `mapper` (object) — Module configuration/parameters
- `metadata` (object) — Visual/editor metadata
- `routes` (array) — For router modules, defines parallel paths
