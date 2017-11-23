# Change Log
##### 1.2.1
- Array items have full filtering range through the `$mathElem` operator
- Change log added
---
### 1.2.0
- Oprerator selection changed to a shorter format: `name: { EQ: "John" }`
  -  Old format deprecated
---
---
##### 1.1.1
-  Fix omition of zeros in update `$set` fields
---
### 1.1.0
- Converts non-null `_id` field to nullable in insert type
- Resolver dependencies now extracted from the GraphQL type definition
- Query and update callbacks combined in `getUpdateResolver`
---
---
##### 1.0.9
- Add Enum support
- getUpdateResolver: make query callBack redaundent
---
##### 1.0.8
- Common code file created
- Arguments validators added
- Non numberic type filtered from update `$inc`
  - If there are no valid fields, a fictive fieldis added
- Nested objects added to sort
  - If there are no fields, a fictive field is added