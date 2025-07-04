---
applyTo: "**/*.{ts,tsx}"
---

# Library - gql.tada

- Use `context7` (shadcn-ui/ui)
- Use shadcn/ui in `@/components/ui`

## Error Handling

Use `onError` to handle errors in mutations.

```ts
const [createPost] = useMutation(Mutation, {
  onError(error) {
    toast.error(error.message)
  },
})
```

Use `try-catch` blocks and check for `Error` instances to handle errors in functions.

```ts
function uploadFile(file: File) {
  try {
    // Your file upload logic here
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message)
    }
  }
}
```

## TailwindCSS

- Use `space-` or `gap-` instead of `pb-`
