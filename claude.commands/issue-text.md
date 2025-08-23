# Issue Builder

Creates GitHub issues by collecting required information and using appropriate templates from `.github/ISSUE_TEMPLATE/*.md`.

## Process

1. Review all available issue templates
2. Select matching template based on issue type
3. Collect required information through questions
4. Pass data to @agent-issue-builder with:
   - Template file path
   - All required information
5. Present created file to user

## Rules

- Keep information minimal and concise
- Optional fields can remain empty
