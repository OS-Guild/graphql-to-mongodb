# graphql-to-mongodb 
[![Build Status](https://travis-ci.org/Soluto/graphql-to-mongodb.svg?branch=master)](https://travis-ci.org/Soluto/graphql-to-mongodb)

If you want to grant your Nodejs GraphQL service a whole lot of the power of the MongoDb database standing behind it with very little hassle, you've come to the right place!

### [Examples](./examples)
### [Change Log](./CHANGELOG.md)
### [Blog Post](https://blog.solutotlv.com/graphql-to-mongodb-or-how-i-learned-to-stop-worrying-and-love-generated-query-apis/?utm_source=README)

### Lets take a look at the most common use case, ```getMongoDbQueryResolver``` and ```getGraphQLQueryArgs```:

**Given a simple GraphQL type:**
```js
new GraphQLObjectType({
    name: 'PersonType',
    fields: () => ({
        age: { type: GraphQLInt },
        name: { type: new GraphQLObjectType({
            name: 'NameType',
            fields: () => ({
                first: { type: GraphQLString },
                last: { type: GraphQLString }
            })
        }),
        fullName: {
            type: GraphQLString,
            resolve: (obj, args, { db }) => `${obj.name.first} ${obj.name.last}`
        }
    })
})
```
#### An example GraphQL query supported by the package:

Queries the first 50 people, oldest first, over the age of 18, and whose first name is John.

```
{
    people (
        filter: {
            age: { GT: 18 },
            name: { 
                first: { EQ: "John" } 
            }
        },
        sort: { age: DESC },
        pagination: { limit: 50 }
    ) {
        fullName
        age
    }
}
```

**To implement, we'll define the people query field in our GraphQL scheme like so:**


```js
people: {
    type: new GraphQLList(PersonType),
    args: getGraphQLQueryArgs(PersonType),
    resolve: getMongoDbQueryResolver(PersonType,
        async (filter, projection, options, obj, args, context) => {
            return await context.db.collection('people').find(filter, projection, options).toArray();
        })
}
```
You'll notice that integrating the package takes little more than adding some fancy middleware over the resolve function.  The `filter, projection, options` added as the first paraneters of the callback, can be sent directly to the MongoDB find function as shown. The rest of the parameter are the standard recieved from the GraphQL api. 

* Additionally, resolve fields' dependencies should be defined in the GraphQL type like so:
    ```js 
    fullName: {
        type: GraphQLString,
        resolve: (obj, args, { db }) => `${obj.name.first} ${obj.name.last}`,
        dependencies: ['name'] // or ['name.first', 'name.Last'], whatever tickles your fancy
    }
    ```
    This is needed to ensure that the projection does not omit any neccessary fields. Alternatively, if throughput is of no concern, the projection can be replaced with an empty object.
*  As of `mongodb` package version 3.0, you should implement the resolve callback as:
   ```js
   return await context.db.collection('people').find(filter, options).toArray();
   ```

### That's it!

**The following field is added to the schema (copied from graphiQl):**
```
people(
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
NOR: [PersonFilterType]
```
\* Filtering is possible over every none resolve field!

**NameObjectFilterType:**
```
first: StringFilter
last: StringFilter
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
NOT: [StringFNotilter]
REGEX: [String]
OPTIONS: String (ignored if not paired with REGEX)
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

### Functionality galore! Also permits update, insert, and extensiable custom fields.
