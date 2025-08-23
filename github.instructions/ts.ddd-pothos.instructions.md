---
applyTo: "**"
---

# TypeScript + DDD + Pothos

## APIにMutationを追加する

データを更新する機能を追加する場合、以下のファイルを読み書きしてください。

- `interface/mutation-fields/*.ts` - GraphQLのMutation
- `interface/inputs/*.input.ts` - GraphQLのMutationのInput
- `interface/objects/*.object.ts` - GraphQLのNode
- `application/*.ts` - ユースケース
- `domain/entities/*.entity.ts` - Entity
- `domain/values/*.value.ts` - Value Objects
- `infrastructure/repositories/*.repository.ts` - リポジトリ
- `infrastructure/adapters/*.adapter.ts` - 外部APIなど
- `interface/schema.ts` - GraphQLのスキーマ

## APIにQueryを追加する

データを取得する機能を追加する場合、以下のファイルを読み書きしてください。

- `interface/query-fields/*.ts` - GraphQLのQuery
- `interface/objects/*.object.ts` - GraphQLのNode
- `interface/schema.ts` - GraphQLのスキーマ
