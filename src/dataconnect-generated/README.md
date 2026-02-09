# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetCoursesForStudent*](#getcoursesforstudent)
  - [*ListAllCourses*](#listallcourses)
- [**Mutations**](#mutations)
  - [*AddNewCourse*](#addnewcourse)
  - [*EnrollStudentInCourse*](#enrollstudentincourse)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetCoursesForStudent
You can execute the `GetCoursesForStudent` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCoursesForStudent(vars: GetCoursesForStudentVariables): QueryPromise<GetCoursesForStudentData, GetCoursesForStudentVariables>;

interface GetCoursesForStudentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCoursesForStudentVariables): QueryRef<GetCoursesForStudentData, GetCoursesForStudentVariables>;
}
export const getCoursesForStudentRef: GetCoursesForStudentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCoursesForStudent(dc: DataConnect, vars: GetCoursesForStudentVariables): QueryPromise<GetCoursesForStudentData, GetCoursesForStudentVariables>;

interface GetCoursesForStudentRef {
  ...
  (dc: DataConnect, vars: GetCoursesForStudentVariables): QueryRef<GetCoursesForStudentData, GetCoursesForStudentVariables>;
}
export const getCoursesForStudentRef: GetCoursesForStudentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCoursesForStudentRef:
```typescript
const name = getCoursesForStudentRef.operationName;
console.log(name);
```

### Variables
The `GetCoursesForStudent` query requires an argument of type `GetCoursesForStudentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCoursesForStudentVariables {
  studentId: UUIDString;
}
```
### Return Type
Recall that executing the `GetCoursesForStudent` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCoursesForStudentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetCoursesForStudentData {
  enrollments: ({
    course: {
      id: UUIDString;
      courseCode: string;
      courseName: string;
      description?: string | null;
      startDate?: DateString | null;
      endDate?: DateString | null;
      maxCapacity?: number | null;
    } & Course_Key;
  })[];
}
```
### Using `GetCoursesForStudent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCoursesForStudent, GetCoursesForStudentVariables } from '@dataconnect/generated';

// The `GetCoursesForStudent` query requires an argument of type `GetCoursesForStudentVariables`:
const getCoursesForStudentVars: GetCoursesForStudentVariables = {
  studentId: ..., 
};

// Call the `getCoursesForStudent()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCoursesForStudent(getCoursesForStudentVars);
// Variables can be defined inline as well.
const { data } = await getCoursesForStudent({ studentId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCoursesForStudent(dataConnect, getCoursesForStudentVars);

console.log(data.enrollments);

// Or, you can use the `Promise` API.
getCoursesForStudent(getCoursesForStudentVars).then((response) => {
  const data = response.data;
  console.log(data.enrollments);
});
```

### Using `GetCoursesForStudent`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCoursesForStudentRef, GetCoursesForStudentVariables } from '@dataconnect/generated';

// The `GetCoursesForStudent` query requires an argument of type `GetCoursesForStudentVariables`:
const getCoursesForStudentVars: GetCoursesForStudentVariables = {
  studentId: ..., 
};

// Call the `getCoursesForStudentRef()` function to get a reference to the query.
const ref = getCoursesForStudentRef(getCoursesForStudentVars);
// Variables can be defined inline as well.
const ref = getCoursesForStudentRef({ studentId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCoursesForStudentRef(dataConnect, getCoursesForStudentVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.enrollments);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.enrollments);
});
```

## ListAllCourses
You can execute the `ListAllCourses` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAllCourses(): QueryPromise<ListAllCoursesData, undefined>;

interface ListAllCoursesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllCoursesData, undefined>;
}
export const listAllCoursesRef: ListAllCoursesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllCourses(dc: DataConnect): QueryPromise<ListAllCoursesData, undefined>;

interface ListAllCoursesRef {
  ...
  (dc: DataConnect): QueryRef<ListAllCoursesData, undefined>;
}
export const listAllCoursesRef: ListAllCoursesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllCoursesRef:
```typescript
const name = listAllCoursesRef.operationName;
console.log(name);
```

### Variables
The `ListAllCourses` query has no variables.
### Return Type
Recall that executing the `ListAllCourses` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllCoursesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAllCoursesData {
  courses: ({
    id: UUIDString;
    courseCode: string;
    courseName: string;
    description?: string | null;
    startDate?: DateString | null;
    endDate?: DateString | null;
    maxCapacity?: number | null;
  } & Course_Key)[];
}
```
### Using `ListAllCourses`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllCourses } from '@dataconnect/generated';


// Call the `listAllCourses()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllCourses();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllCourses(dataConnect);

console.log(data.courses);

// Or, you can use the `Promise` API.
listAllCourses().then((response) => {
  const data = response.data;
  console.log(data.courses);
});
```

### Using `ListAllCourses`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllCoursesRef } from '@dataconnect/generated';


// Call the `listAllCoursesRef()` function to get a reference to the query.
const ref = listAllCoursesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllCoursesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.courses);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.courses);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## AddNewCourse
You can execute the `AddNewCourse` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
addNewCourse(vars: AddNewCourseVariables): MutationPromise<AddNewCourseData, AddNewCourseVariables>;

interface AddNewCourseRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddNewCourseVariables): MutationRef<AddNewCourseData, AddNewCourseVariables>;
}
export const addNewCourseRef: AddNewCourseRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addNewCourse(dc: DataConnect, vars: AddNewCourseVariables): MutationPromise<AddNewCourseData, AddNewCourseVariables>;

interface AddNewCourseRef {
  ...
  (dc: DataConnect, vars: AddNewCourseVariables): MutationRef<AddNewCourseData, AddNewCourseVariables>;
}
export const addNewCourseRef: AddNewCourseRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addNewCourseRef:
```typescript
const name = addNewCourseRef.operationName;
console.log(name);
```

### Variables
The `AddNewCourse` mutation requires an argument of type `AddNewCourseVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddNewCourseVariables {
  courseCode: string;
  courseName: string;
  description?: string | null;
  startDate?: DateString | null;
  endDate?: DateString | null;
  maxCapacity?: number | null;
}
```
### Return Type
Recall that executing the `AddNewCourse` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddNewCourseData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddNewCourseData {
  course_insert: Course_Key;
}
```
### Using `AddNewCourse`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addNewCourse, AddNewCourseVariables } from '@dataconnect/generated';

// The `AddNewCourse` mutation requires an argument of type `AddNewCourseVariables`:
const addNewCourseVars: AddNewCourseVariables = {
  courseCode: ..., 
  courseName: ..., 
  description: ..., // optional
  startDate: ..., // optional
  endDate: ..., // optional
  maxCapacity: ..., // optional
};

// Call the `addNewCourse()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addNewCourse(addNewCourseVars);
// Variables can be defined inline as well.
const { data } = await addNewCourse({ courseCode: ..., courseName: ..., description: ..., startDate: ..., endDate: ..., maxCapacity: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addNewCourse(dataConnect, addNewCourseVars);

console.log(data.course_insert);

// Or, you can use the `Promise` API.
addNewCourse(addNewCourseVars).then((response) => {
  const data = response.data;
  console.log(data.course_insert);
});
```

### Using `AddNewCourse`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addNewCourseRef, AddNewCourseVariables } from '@dataconnect/generated';

// The `AddNewCourse` mutation requires an argument of type `AddNewCourseVariables`:
const addNewCourseVars: AddNewCourseVariables = {
  courseCode: ..., 
  courseName: ..., 
  description: ..., // optional
  startDate: ..., // optional
  endDate: ..., // optional
  maxCapacity: ..., // optional
};

// Call the `addNewCourseRef()` function to get a reference to the mutation.
const ref = addNewCourseRef(addNewCourseVars);
// Variables can be defined inline as well.
const ref = addNewCourseRef({ courseCode: ..., courseName: ..., description: ..., startDate: ..., endDate: ..., maxCapacity: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addNewCourseRef(dataConnect, addNewCourseVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.course_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.course_insert);
});
```

## EnrollStudentInCourse
You can execute the `EnrollStudentInCourse` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
enrollStudentInCourse(vars: EnrollStudentInCourseVariables): MutationPromise<EnrollStudentInCourseData, EnrollStudentInCourseVariables>;

interface EnrollStudentInCourseRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: EnrollStudentInCourseVariables): MutationRef<EnrollStudentInCourseData, EnrollStudentInCourseVariables>;
}
export const enrollStudentInCourseRef: EnrollStudentInCourseRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
enrollStudentInCourse(dc: DataConnect, vars: EnrollStudentInCourseVariables): MutationPromise<EnrollStudentInCourseData, EnrollStudentInCourseVariables>;

interface EnrollStudentInCourseRef {
  ...
  (dc: DataConnect, vars: EnrollStudentInCourseVariables): MutationRef<EnrollStudentInCourseData, EnrollStudentInCourseVariables>;
}
export const enrollStudentInCourseRef: EnrollStudentInCourseRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the enrollStudentInCourseRef:
```typescript
const name = enrollStudentInCourseRef.operationName;
console.log(name);
```

### Variables
The `EnrollStudentInCourse` mutation requires an argument of type `EnrollStudentInCourseVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface EnrollStudentInCourseVariables {
  studentId: UUIDString;
  courseId: UUIDString;
  enrollmentDate: DateString;
  status: string;
}
```
### Return Type
Recall that executing the `EnrollStudentInCourse` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `EnrollStudentInCourseData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface EnrollStudentInCourseData {
  enrollment_insert: Enrollment_Key;
}
```
### Using `EnrollStudentInCourse`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, enrollStudentInCourse, EnrollStudentInCourseVariables } from '@dataconnect/generated';

// The `EnrollStudentInCourse` mutation requires an argument of type `EnrollStudentInCourseVariables`:
const enrollStudentInCourseVars: EnrollStudentInCourseVariables = {
  studentId: ..., 
  courseId: ..., 
  enrollmentDate: ..., 
  status: ..., 
};

// Call the `enrollStudentInCourse()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await enrollStudentInCourse(enrollStudentInCourseVars);
// Variables can be defined inline as well.
const { data } = await enrollStudentInCourse({ studentId: ..., courseId: ..., enrollmentDate: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await enrollStudentInCourse(dataConnect, enrollStudentInCourseVars);

console.log(data.enrollment_insert);

// Or, you can use the `Promise` API.
enrollStudentInCourse(enrollStudentInCourseVars).then((response) => {
  const data = response.data;
  console.log(data.enrollment_insert);
});
```

### Using `EnrollStudentInCourse`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, enrollStudentInCourseRef, EnrollStudentInCourseVariables } from '@dataconnect/generated';

// The `EnrollStudentInCourse` mutation requires an argument of type `EnrollStudentInCourseVariables`:
const enrollStudentInCourseVars: EnrollStudentInCourseVariables = {
  studentId: ..., 
  courseId: ..., 
  enrollmentDate: ..., 
  status: ..., 
};

// Call the `enrollStudentInCourseRef()` function to get a reference to the mutation.
const ref = enrollStudentInCourseRef(enrollStudentInCourseVars);
// Variables can be defined inline as well.
const ref = enrollStudentInCourseRef({ studentId: ..., courseId: ..., enrollmentDate: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = enrollStudentInCourseRef(dataConnect, enrollStudentInCourseVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.enrollment_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.enrollment_insert);
});
```

