# Backgammon: Doubling Cube — PRD

## Scope

Introduce doubling to the Backgammon engine using a new `propose-double` command and two responses: `accept` and `forfeit`. The cube tops out at 64.

## Definitions

* **stakes**: integer power-of-two multiplier for the game result. Starts at `1`.
* **holdsCube**: who currently controls the right to propose doubles. Values:

  * `-1` → neutral (either player may propose)
  * `0` → player 0 controls
  * `1` → player 1 controls
* **up**: whose action is next (player id `0` or `1`).
* **status**: `"pending" | "double-proposed" | "finished"`.

## Assumptions

* Game starts with `stakes = 1`, `holdsCube = -1`, `status = "pending"`.
* Doubling is allowed only when `status = "pending"`.

## Commands

### 1) `propose-double`

```json
{ "type": "propose-double", "seat": 0 }
```

* **Issuer**: the player in `up` **and** (`holdsCube == -1` or `holdsCube == seat`).
* **Preconditions**:

  * `status == "pending"`
  * `stakes < 64`
* **Effects (atomic)**:

  * `status := "double-proposed"`
  * `up := other(up)` (auto-commit turn)
  * `holdsCube` unchanged

---

### 2) `accept`

```json
{ "type": "accept", "seat": 1 }
```

* **Issuer**: the player currently in `up` (the non-proposer after the auto-commit).
* **Preconditions**:

  * `status == "double-proposed"`
* **Effects (atomic)**:

  * `stakes := stakes * 2`
  * `status := "pending"`
  * `holdsCube := seat` (the accepting player)
  * `up := other(up)` (return turn to the original proposer)

---

### 3) `forfeit`

```json
{ "type": "forfeit", "seat": 1 }
```

* **Issuer**: the player currently in `up` (the non-proposer responding).
* **Preconditions**:

  * `status == "double-proposed"`
* **Effects (atomic)**:

  * `status := "finished"`
  * Winner is the **original proposer**
  * Payout is the current `stakes` (before doubling)

---

## Invariants & Rules

* Only one double can be “open” at a time (`status="double-proposed"` is transient).
* After an `accept`, only the player in `holdsCube` may later `propose-double` (when it’s their turn and status is `"pending"`).
* No `propose-double` if `stakes >= 64`.
* No commands other than `accept`/`forfeit` are valid while `status == "double-proposed"`.

## Errors

Invalid actions must throw plain errors:

* `new Error("Not your turn")`
* `new Error("You do not control the cube")`
* `new Error("Command not allowed in current status")`
* `new Error("Cannot double at stakes of 64 or higher")`

## State Transitions (happy paths)

1. **Propose**
   `(pending, stakes=S, holdsCube ∈ {-1, up})`
   → `{type:"propose-double", seat:up}`
   → `(double-proposed, stakes=S, up=other(up), holdsCube unchanged)`

2. **Accept**
   `(double-proposed, stakes=S)`
   → `{type:"accept", seat:up}`
   → `(pending, stakes=2S, holdsCube=seat, up=other(up))`

3. **Forfeit**
   `(double-proposed, stakes=S)`
   → `{type:"forfeit", seat:up}`
   → `(finished, stakes=S)` with winner = original proposer

## Worked Example

* Start: `stakes=1, holdsCube=-1, status=pending, up=0`
* Player 0: `{type:"propose-double", seat:0}` → `status=double-proposed, up=1`
* Player 1: `{type:"accept", seat:1}` → `stakes=2, holdsCube=1, status=pending, up=0`
* Later, if `up=1` and `holdsCube=1`, Player 1 may propose again.

## Idempotency / Concurrency

* Reject repeated `propose-double` while `status="double-proposed"`.
* Accept/forfeit are mutually exclusive; first valid one wins and transitions the state.
