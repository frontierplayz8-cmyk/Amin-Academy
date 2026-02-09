# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useAddNewCourse, useGetCoursesForStudent, useEnrollStudentInCourse, useListAllCourses } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useAddNewCourse(addNewCourseVars);

const { data, isPending, isSuccess, isError, error } = useGetCoursesForStudent(getCoursesForStudentVars);

const { data, isPending, isSuccess, isError, error } = useEnrollStudentInCourse(enrollStudentInCourseVars);

const { data, isPending, isSuccess, isError, error } = useListAllCourses();

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { addNewCourse, getCoursesForStudent, enrollStudentInCourse, listAllCourses } from '@dataconnect/generated';


// Operation AddNewCourse:  For variables, look at type AddNewCourseVars in ../index.d.ts
const { data } = await AddNewCourse(dataConnect, addNewCourseVars);

// Operation GetCoursesForStudent:  For variables, look at type GetCoursesForStudentVars in ../index.d.ts
const { data } = await GetCoursesForStudent(dataConnect, getCoursesForStudentVars);

// Operation EnrollStudentInCourse:  For variables, look at type EnrollStudentInCourseVars in ../index.d.ts
const { data } = await EnrollStudentInCourse(dataConnect, enrollStudentInCourseVars);

// Operation ListAllCourses: 
const { data } = await ListAllCourses(dataConnect);


```