# graphql-to-mongodb-query

If you want to give your graphql service a whole lot of the power of the MongoDb database you have standing behind it with very little hassle, you've come to the right place!

**Now with an extra 20% non-query funcionality!** (Psst - it's update and insert stuff)

### This package comes with a whole lot of goodies:

*  ```getGraphQLFilterType``` 
*  ```getMongoDbFilter```
*  ```getGraphQLUpdateType```
*  ```getGraphQLInsertType``` 
*  ```getMongoDbUpdate```
*  ```GraphQLPaginationType```
*  ```getGraphQLSortType```
*  ```getMongoDbProjection```
*  ```getMongoDbQueryResolver```
*  ```getGraphQLQueryArgs```
*  ```getMongoDbUpdateResolver```
*  ```getGraphQLUpdateArgs```

#### A look at the most commonly used functionality, ```getMongoDbQueryResolver``` and ```getGraphQLQueryArgs```:

**Given a simple graphql type:**
```js
new GraphQLObjectType({
    name: 'PersonType',
    fields: () => ({
        age: { type: GraphQLInt },
        name: { type: new GraphQLObjectType({
            name: 'NameType',
            fields: () => ({
                firstName: { type: GraphQLString },
                lastName: { type: GraphQLString }
            })
        }),
        fullName: {
            type: GraphQLString,
            resolve: (obj, args, { db }) => `${obj.name.firstName} ${obj.name.lastName}`
        }
    })
})
```
**We'll define the peron query in our graphql scheme like so:**


```js
person: {
    type: new GraphQLList(PersonType),
    args: getGraphQLQueryArgs(PersonType),
    resolve: getMongoDbQueryResolver(PersonType, personTypeResolveDependencies,
        async (filter, projection, options, obj, args, context) => {
            return await context.db.collection('persons').find(filter, projection, options).toArray();
        })
}
```
The `filter`, `projection` and `options` added as the first paraneters of the callback can be sent directly to the mongo find function as shown. The rest of the parameter are recieved from the graphql api. 

* `personTypeResolveDependencies` should state what are the dependencies of fields with a resolve function, i.e: 
    ```js 
    { fullName: ['name'] }
    ```
    OR
    ```js 
    { fullName: ['name.firstName',`name.LastName`] }
    ```
    This is needed to ensure that the projection does not omit any neccessary fields. Alternatively, if comunication volume is of no concern, the projection can be replaced with an empty object

**The following field is added to the schema (copied from graphiQl):**
```
person(
    filter: PersonFilterType
    sort: PersonSortType
    pagination: GraphQLPaginationType
): [PersonType]
```
**PersonFilterType:**
```
age: IntInput
name: NamInputeFilterType
OR: [PersonFilterType]
AND: [PersonFilterType]
```
\* Filtering is possilbe over every none resolve field!

**NamInputeFilterType:**
```
firstName: StringInput
lastName: StringInput
opr: OprExists
```
`OprExists` enum tyoe can be `EXISTS` or `NOT_EXISTS`, and can be found in nested objects and arrays
**StringInput:**
```
opr: Opr!
value: String
values: [String]
```
`Opr` enum type can be any of the following: `EQL`, `GT`, `GTE`, `IN`, `LT`, `LTE`, `NE`, `NIN` (the \`values\` field should be used for `IN` and `NIN`).

**PersonSortType:**
```
age: SortType
```
`SortTyoe` enum can be either `ASC` or `DESC`

\* Presently sorting is available only for root level fields

**GraphQLPaginationType:**
```
limit: Int
skip: Int
```
#### Example graphql Query:
```
{
    person (
        filter: {
            age: { opr: GT, value: 18 },
            name: { 
                firstName: { opr: EQL, value:"John" } 
            }
        },
        sort: { age: DESC }
    ) {
    fullName
    age
}
```
