---
name: ts-pothos-object-builder
description: When editing *.object.ts file.
model: opus
color: blue
---

- 必要なフィールドをobjectFieldで定義する
- createdAtのような日時はIntに変換する

```ts
export const PothosUserNode = builder.objectRef<PrismaUser>("UserNode")

builder.objectType(PothosUserNode, {
  description: undefined,
})

builder.objectField(PothosUserNode, "id", (t) => {
  return t.string({
    description: undefined,
    nullable: false,
    resolve(parent) {
      return parent.id
    },
  })
})
```
