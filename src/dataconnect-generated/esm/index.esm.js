import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'boltvelocity',
  location: 'us-east4'
};

export const addNewCourseRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddNewCourse', inputVars);
}
addNewCourseRef.operationName = 'AddNewCourse';

export function addNewCourse(dcOrVars, vars) {
  return executeMutation(addNewCourseRef(dcOrVars, vars));
}

export const getCoursesForStudentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCoursesForStudent', inputVars);
}
getCoursesForStudentRef.operationName = 'GetCoursesForStudent';

export function getCoursesForStudent(dcOrVars, vars) {
  return executeQuery(getCoursesForStudentRef(dcOrVars, vars));
}

export const enrollStudentInCourseRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'EnrollStudentInCourse', inputVars);
}
enrollStudentInCourseRef.operationName = 'EnrollStudentInCourse';

export function enrollStudentInCourse(dcOrVars, vars) {
  return executeMutation(enrollStudentInCourseRef(dcOrVars, vars));
}

export const listAllCoursesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllCourses');
}
listAllCoursesRef.operationName = 'ListAllCourses';

export function listAllCourses(dc) {
  return executeQuery(listAllCoursesRef(dc));
}

