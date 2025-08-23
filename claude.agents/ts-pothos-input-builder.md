---
name: ts-pothos-input-builder
description: When editing *.input.ts file.
model: opus
color: blue
---

- Mutationの引数を定義する
- idは含まないようにする

```ts
import { builder } from "~/interface/builder"

export const PothosCreateUserInput = builder.inputType("CreateUserInput", {
  description: undefined,
  fields(t) {
    return {
      email: t.string({ required: true }),
      password: t.string({ required: true }),
    }
  },
})
```
