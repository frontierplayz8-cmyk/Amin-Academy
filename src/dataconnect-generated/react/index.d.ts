import { AddNewCourseData, AddNewCourseVariables, GetCoursesForStudentData, GetCoursesForStudentVariables, EnrollStudentInCourseData, EnrollStudentInCourseVariables, ListAllCoursesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useAddNewCourse(options?: useDataConnectMutationOptions<AddNewCourseData, FirebaseError, AddNewCourseVariables>): UseDataConnectMutationResult<AddNewCourseData, AddNewCourseVariables>;
export function useAddNewCourse(dc: DataConnect, options?: useDataConnectMutationOptions<AddNewCourseData, FirebaseError, AddNewCourseVariables>): UseDataConnectMutationResult<AddNewCourseData, AddNewCourseVariables>;

export function useGetCoursesForStudent(vars: GetCoursesForStudentVariables, options?: useDataConnectQueryOptions<GetCoursesForStudentData>): UseDataConnectQueryResult<GetCoursesForStudentData, GetCoursesForStudentVariables>;
export function useGetCoursesForStudent(dc: DataConnect, vars: GetCoursesForStudentVariables, options?: useDataConnectQueryOptions<GetCoursesForStudentData>): UseDataConnectQueryResult<GetCoursesForStudentData, GetCoursesForStudentVariables>;

export function useEnrollStudentInCourse(options?: useDataConnectMutationOptions<EnrollStudentInCourseData, FirebaseError, EnrollStudentInCourseVariables>): UseDataConnectMutationResult<EnrollStudentInCourseData, EnrollStudentInCourseVariables>;
export function useEnrollStudentInCourse(dc: DataConnect, options?: useDataConnectMutationOptions<EnrollStudentInCourseData, FirebaseError, EnrollStudentInCourseVariables>): UseDataConnectMutationResult<EnrollStudentInCourseData, EnrollStudentInCourseVariables>;

export function useListAllCourses(options?: useDataConnectQueryOptions<ListAllCoursesData>): UseDataConnectQueryResult<ListAllCoursesData, undefined>;
export function useListAllCourses(dc: DataConnect, options?: useDataConnectQueryOptions<ListAllCoursesData>): UseDataConnectQueryResult<ListAllCoursesData, undefined>;
