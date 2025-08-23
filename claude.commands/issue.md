---
name: issue
argument-hint: 要件定義書のID
description: Create issue from requirement specification
---

# Issue Creator

WORKFLOW:
1. Get requirement ID from user
2. Read requirement: `mcp__local__docs-read-requirement`
3. Check templates: LS `.github/ISSUE_TEMPLATE/`
4. Select template based on requirement type
5. Explore codebase: Grep/Read related files
6. Gather template-specific info from user
7. Draft issue using template
8. Confirm with user
9. Create issue: `@docs-issue-builder`

REQUIREMENT_ANALYSIS:
- Read spec with mcp__local__docs-read-requirement
- Identify acceptance criteria
- Check related requirements
- Find implementation gaps

CODE_EXPLORATION:
- Grep for related functionality
- Read existing implementations
- Identify affected files
- Check for conflicts

TEMPLATE_DISCOVERY:
1. LS `.github/ISSUE_TEMPLATE/`
2. Read all *.md files found
3. Extract frontmatter (name, about, labels)
4. Parse template structure (headings, placeholders)
5. Identify required fields from template content

TEMPLATE_MATCHING:
Match requirement type to template:
- Check template name/about field
- Match keywords in requirement
- If no match: Ask user to select
- If no templates: Create minimal issue

DYNAMIC_INFO_GATHERING:
Parse template for required info:
- Find placeholders: `[...]`, `<!-- ... -->`
- Extract section headings
- Identify checkboxes: `- [ ]`
- Ask user for each placeholder found
- Fill template with gathered info + requirement data + code exploration

TEMPLATE_PARSING:
```
For each template file:
1. Read frontmatter → Get metadata
2. Parse markdown → Extract structure
3. Find variables → List required inputs
4. Map requirement → Fill known fields
5. Ask user → Fill remaining fields
```

CONFIRMATION:
Show draft to user:
"Here's the issue draft. Should I proceed?"
[Show formatted issue]

CREATION:
Delegate to @docs-issue-builder with:
- Repository ID
- Issue slug
- Markdown content
- Related product IDs
- Related requirement ID

ERROR_HANDLING:
- No templates found: Create basic issue with requirement + code info
- Template parse error: Fallback to simple format
- Missing requirement: Ask for valid ID
- Unclear spec: Request clarification
- Creation failed: Show error, retry

EXAMPLE_FLOW:
```
User: "Create issue for REQ-123"
1. mcp__local__docs-read-requirement({requirementId: "REQ-123"})
2. LS .github/ISSUE_TEMPLATE/ → Found feature.md, bug.md
3. Read feature.md → Parse structure and placeholders
4. Match requirement → Fits "feature" template
5. Grep related code
6. "Template needs: [User Story], [Priority]. Please provide."
7. Fill template with all gathered info
8. "Confirm this issue: [filled template]"
9. Task({subagent_type: 'docs-issue-builder', prompt: 'Create issue...'})
```

FALLBACK_FORMAT:
If no templates exist:
```
## Summary
[From requirement]

## Requirement ID
[requirement-id]

## Implementation Details
[From code exploration]

## Notes
[User provided context]
```

Always: Read actual templates. Parse dynamically. Fill completely. Confirm before creation.
