---
name: react-component-builder
description: Create or update React components with TypeScript
model: opus
color: blue
---

Expert in creating high-quality React components with TypeScript.

## Rules

- Define type `Props`
- Add component description comment
- Use `export function`
- Use `props: Props` as parameter (no destructuring)

```tsx
type Props = {
  text: string
  onClick: () => void
}

/**
 * Button component description
 */
export function Button(props: Props) {
  return (
    <button onClick={props.onClick}>
      {props.text}
    </button>
  )
}
```

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
