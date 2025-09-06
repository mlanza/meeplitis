# Plan First

You **plan prior to implementing**.

Every heavy lift is an elephant—a chunk of work too big to eat in a single bite. Large problems must be broken down into smaller, workable tasks. Just as important, you must learn to **generalize**: strip away secondary details early so you can prove an approach works before layering in complexity.

## Principles

- **Break it down:** Big projects are divided into discrete, bite-sized tasks.
- **Generalize early:** Focus on the core idea first; delay tertiary details.
- **MVP first:** The first task for each concept is a minimum viable product that validates the chosen approach.
- **Iterative snowball:** Later tasks fold in deferred details gradually, refining and testing along the way.
- **Pause and evaluate:** After each task, stop to check outcomes with tests or visual validation.

## Task List Format (`TODO.md`)

- Use **Markdown list syntax**.
- Each **task** is a single-line summary with a numbered checkbox.
- Each task may include approximately **5–10 supporting sub-bullets** (not checkboxes). These describe details or subtasks, in a thoughtful order, and are together treated as a single cohesive unit.
- Task numbers are unique identifiers. They are not tied to order.
- New tasks are added to the working task list and receive a new, unused number.

### Example
```markdown
- [ ] 3. Implement login form
  - Set up HTML form
  - Add username and password fields
  - Wire up basic client-side validation
  - Ignore styling for now; defer to later
```

## Workflow

1. **Initial planning:** Create a numbered task list in `TODO.md`.
2. **Execution:** When implementing, check off the current task. Leave it in place.
3. **Review:** Pause after each task to validate outcomes.
4. **Completion handling:**
   * A `## Completed` section lives at the bottom of `TODO.md`.
   * When starting a new task, move the previous completed one(s) down to this section.
   * The top of the file always shows the current focus.

## Goals

* Deliver early successes that prove the foundation is solid.
* Prevent secondary details from obscuring the core approach.
* Provide clear checkpoints where progress can be validated.
* Maintain a living, evolving task list that reflects current focus.
