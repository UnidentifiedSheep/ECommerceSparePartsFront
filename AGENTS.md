# Repository workflow

- Use a pull request for UI changes and other changes that affect application behavior or the experience of users or developers. Leave the PR for review; merge only when the user explicitly asks.
- Commit and push skills, agent instructions, documentation, and similar maintenance directly to `master` when they do not affect application behavior, compatibility, or usability. No PR is needed for these changes.
- If a change mixes application changes with maintenance, use a PR for the combined change.
- Treat dependency, build, deployment, runtime configuration, and API contract changes as application changes when they can affect normal use; do not classify them as safe maintenance merely because they are not visible in the UI.
- Follow any explicit task-specific workflow instruction from the user.
