import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AcademyUser_Key {
  id: UUIDString;
  __typename?: 'AcademyUser_Key';
}

export interface AddNewCourseData {
  course_insert: Course_Key;
}

export interface AddNewCourseVariables {
  courseCode: string;
  courseName: string;
  description?: string | null;
  startDate?: DateString | null;
  endDate?: DateString | null;
  maxCapacity?: number | null;
}

export interface CourseAssignment_Key {
  instructorId: UUIDString;
  courseId: UUIDString;
  __typename?: 'CourseAssignment_Key';
}

export interface Course_Key {
  id: UUIDString;
  __typename?: 'Course_Key';
}

export interface EnrollStudentInCourseData {
  enrollment_insert: Enrollment_Key;
}

export interface EnrollStudentInCourseVariables {
  studentId: UUIDString;
  courseId: UUIDString;
  enrollmentDate: DateString;
  status: string;
}

export interface Enrollment_Key {
  studentId: UUIDString;
  courseId: UUIDString;
  __typename?: 'Enrollment_Key';
}

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

export interface GetCoursesForStudentVariables {
  studentId: UUIDString;
}

export interface Instructor_Key {
  id: UUIDString;
  __typename?: 'Instructor_Key';
}

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

export interface Student_Key {
  id: UUIDString;
  __typename?: 'Student_Key';
}

interface AddNewCourseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddNewCourseVariables): MutationRef<AddNewCourseData, AddNewCourseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddNewCourseVariables): MutationRef<AddNewCourseData, AddNewCourseVariables>;
  operationName: string;
}
export const addNewCourseRef: AddNewCourseRef;

export function addNewCourse(vars: AddNewCourseVariables): MutationPromise<AddNewCourseData, AddNewCourseVariables>;
export function addNewCourse(dc: DataConnect, vars: AddNewCourseVariables): MutationPromise<AddNewCourseData, AddNewCourseVariables>;

interface GetCoursesForStudentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCoursesForStudentVariables): QueryRef<GetCoursesForStudentData, GetCoursesForStudentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCoursesForStudentVariables): QueryRef<GetCoursesForStudentData, GetCoursesForStudentVariables>;
  operationName: string;
}
export const getCoursesForStudentRef: GetCoursesForStudentRef;

export function getCoursesForStudent(vars: GetCoursesForStudentVariables): QueryPromise<GetCoursesForStudentData, GetCoursesForStudentVariables>;
export function getCoursesForStudent(dc: DataConnect, vars: GetCoursesForStudentVariables): QueryPromise<GetCoursesForStudentData, GetCoursesForStudentVariables>;

interface EnrollStudentInCourseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: EnrollStudentInCourseVariables): MutationRef<EnrollStudentInCourseData, EnrollStudentInCourseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: EnrollStudentInCourseVariables): MutationRef<EnrollStudentInCourseData, EnrollStudentInCourseVariables>;
  operationName: string;
}
export const enrollStudentInCourseRef: EnrollStudentInCourseRef;

export function enrollStudentInCourse(vars: EnrollStudentInCourseVariables): MutationPromise<EnrollStudentInCourseData, EnrollStudentInCourseVariables>;
export function enrollStudentInCourse(dc: DataConnect, vars: EnrollStudentInCourseVariables): MutationPromise<EnrollStudentInCourseData, EnrollStudentInCourseVariables>;

interface ListAllCoursesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllCoursesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllCoursesData, undefined>;
  operationName: string;
}
export const listAllCoursesRef: ListAllCoursesRef;

export function listAllCourses(): QueryPromise<ListAllCoursesData, undefined>;
export function listAllCourses(dc: DataConnect): QueryPromise<ListAllCoursesData, undefined>;

