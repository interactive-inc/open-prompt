---
description: Fix bugs in the codebase
---

# Fix bugs

Fix all errors by calling appropriate Subagents to modify files. Repeat command execution until all problems are resolved.

- TypeScript Errors: `bun tsgo --noEmit`
- Biome Errors: `bun biome check . --fix --unsafe`
- Bun Test Errors: `bun test`

## Fix Any Types

Find and replace `as any` type assertions with proper TypeScript types.

### Steps

1. Search codebase for `as any` usage
2. Analyze context and determine correct type
3. Replace with specific type annotations
4. Verify with `bun tsgo --noEmit`

### Common Patterns

- Event handlers: `as React.MouseEvent<HTMLButtonElement>`
- API responses: Define interface or use existing types
- Third-party libraries: Import proper types or create type declarations
- DOM elements: Use specific HTMLElement types
