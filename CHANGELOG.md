# Change Log
##### 1.6.1
- Expose the types cache
---
### 1.6.0
- Add overwrite flag for nested objects in update args under `set`. Allows for overwriting of entire object instead of just the specified fields. Update validation adjusted to accomadate new flag.
- More tests
---
##### 1.5.1
- Bug fix, non-null validation should only apply on upserts or list items
---
### 1.5.0
- Add server-side validation for update args instead of preserving non-nullability from the origin type. 
If a field is non-nullable it must be set in either the update operators (e.g. `setOnInsert`, `set`, `inc`, etc...)
- Tests! (Limited coverage)
---
##### 1.4.4
- Bug fix
---
##### 1.4.3
- Fix yet another bug in resolve dependencies projection
---
##### 1.4.2
- Fix a bug in array mutation 
---
##### 1.4.1
- Fix a bug in resolve dependencies projection
---
### 1.4.0
- Add Support for FragmentSpread in projection
---
##### 1.3.5
- Fix a bug in parsing a scalar array filter
---
##### 1.3.4
- Fix a bug where a malformed sort param is produced when sorting by nested fields
---
##### 1.3.3
- Add regex operator
---
##### 1.3.2
- Can get different output type from resolver and omit projection
---
##### 1.3.1
- Fix type declarations in package
---
### 1.3.0
- Renamed package and repository
- TypeScript!
- Log warn and error callbacks
---
##### 1.2.3
- Fix projection bug
---
##### 1.2.2
- Projection now supports multiple of same field without alias
---
##### 1.2.1
- Array items have full filtering range through the `$elemMatch` operator
- Change log added
---
### 1.2.0
- Oprerator selection changed to a shorter format: `name: { EQ: "John" }`
  -  Old format deprecated
---
##### 1.1.1
-  Fix omition of zeros in update `$set` fields
---
### 1.1.0
- Changes non-null field of name `_id` to nullable in insert type
- Resolver dependencies now extracted from the GraphQL type definition
- Query and update callbacks combined in `getUpdateResolver`
---
##### 1.0.9
- Add Enum support
- getUpdateResolver: make query callBack redaundent
---
##### 1.0.8
- Fix of bugs in 1.0.7
---
##### 1.0.7
- Common code file created
- Arguments validators added
- Non numberic type filtered from update `$inc`
  - If there are no valid fields, a fictive fieldis added
- Nested objects added to sort
  - If there are no valid fields, a fictive field is added
---
##### 1.0.6
- Package license set to MIT 
- Base fields of `getGraphQLUpdateArgs` are now non-null