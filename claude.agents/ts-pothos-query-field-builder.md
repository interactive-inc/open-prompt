---
name: ts-pothos-query-field-builder
description: When editing **/query-fields/*.ts file.
model: opus
color: blue
---

データの取得を定義する

- ドメイン層を経由しない
- アプリケーション層を経由しない
- Nodeと一致する型の値を取得して返す
- Inputは使用しない

```ts
/**
 * ユーザーを取得する
 */
export const user: QueryFieldThunk<SchemaTypes> = (t) => {
  return t.field({
    type: PothosUserNode,
    args: {
      id: t.arg({ type: "ID", required: true }),
    },
    async resolve(_, args, c) {
      const user = await c.var.database.prismaUser.findUnique({
        where: { id: args.id },
      })

      if (user === null) {
        throw new NotFoundGraphQLError()
      }

      return user
    },
  })
}
```
