# graphql-to-mongodb

If you want to give your Nodejs GraphQL service a whole lot of the power of the MongoDb database you have standing behind it with very little hassle, you've come to the right place!

### [Change Log](./CHANGELOG.md)
### [Blog Post](https://blog.solutotlv.com/graphql-to-mongodb-or-how-i-learned-to-stop-worrying-and-love-generated-query-apis/?utm_source=README)

### Functionality galore!

*  ```getGraphQLFilterType``` 
*  ```getGraphQLSortType```
*  ```getGraphQLUpdateType```
*  ```getGraphQLInsertType``` 
*  ```getGraphQLQueryArgs```
*  ```getGraphQLUpdateArgs```
*  ```GraphQLPaginationType```
*  ```getMongoDbFilter```
*  ```getMongoDbProjection```
*  ```getMongoDbUpdate```
*  ```getMongoDbQueryResolver```
*  ```getMongoDbUpdateResolver```
*  ```setLogger```

### But... Lets take a look at the most common use case, ```getMongoDbQueryResolver``` and ```getGraphQLQueryArgs```:

**Given a simple GraphQL type:**
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
**We'll define the peron query in our GraphQL scheme like so:**


```js
person: {
    type: new GraphQLList(PersonType),
    args: getGraphQLQueryArgs(PersonType),
    resolve: getMongoDbQueryResolver(PersonType,
        async (filter, projection, options, obj, args, context) => {
            return await context.db.collection('persons').find(filter, projection, options).toArray();
        })
}
```
You'll notice that integrating the package takes little more than adding some fancy middleware over the resolve function.  The `filter, projection, options` added as the first paraneters of the callback, can be sent directly to the MongoDB find function as shown. The rest of the parameter are the standard recieved from the GraphQL api. 

* Additionally, resolve fields' dependencies should be defined in the GraphQL type like so:
    ```js 
    fullName: {
        type: GraphQLString,
        resolve: (obj, args, { db }) => `${obj.name.firstName} ${obj.name.lastName}`,
        dependencies: ['name'] // or ['name.firstName', 'name.LastName'], whatever tickles your fancy
    }
    ```
    This is needed to ensure that the projection does not omit any neccessary fields. Alternatively, if throughput is of no concern, the projection can be replaced with an empty object.
*  As of `mongodb` package version 3.0, you should implement the resolve callback as:
   ```js
   options.projection = projection;
   return await context.db.collection('persons').find(filter, options).toArray();
   ```

### That's it!

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
age: IntFilter
name: NameObjectFilterType
OR: [PersonFilterType]
AND: [PersonFilterType]
```
\* Filtering is possible over every none resolve field!

**NameObjectFilterType:**
```
firstName: StringFilter
lastName: StringFilter
opr: OprExists
```
`OprExists` enum tyoe can be `EXISTS` or `NOT_EXISTS`, and can be found in nested objects and arrays

**StringFilter:**
```
EQ: String
GT: String
GTE: String
IN: [String]
LT: String
LTE: String
NEQ: String
NIN: [String]
```

**PersonSortType:**
```
age: SortType
```
`SortType` enum can be either `ASC` or `DESC`

**GraphQLPaginationType:**
```
limit: Int
skip: Int
```
#### Example GraphQL Query:

Queries the first 50 persons, oldest first,  over the age of 18, and whose first name is John

```
{
    person (
        filter: {
            age: { GT: 18 },
            name: { 
                firstName: { EQ: "John" } 
            }
        },
        sort: { age: DESC },
        pagination: { limit: 50 }
    ) {
    fullName
    age
}
```
