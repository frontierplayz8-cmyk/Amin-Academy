const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'boltvelocity',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const addNewCourseRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddNewCourse', inputVars);
}
addNewCourseRef.operationName = 'AddNewCourse';
exports.addNewCourseRef = addNewCourseRef;

exports.addNewCourse = function addNewCourse(dcOrVars, vars) {
  return executeMutation(addNewCourseRef(dcOrVars, vars));
};

const getCoursesForStudentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCoursesForStudent', inputVars);
}
getCoursesForStudentRef.operationName = 'GetCoursesForStudent';
exports.getCoursesForStudentRef = getCoursesForStudentRef;

exports.getCoursesForStudent = function getCoursesForStudent(dcOrVars, vars) {
  return executeQuery(getCoursesForStudentRef(dcOrVars, vars));
};

const enrollStudentInCourseRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'EnrollStudentInCourse', inputVars);
}
enrollStudentInCourseRef.operationName = 'EnrollStudentInCourse';
exports.enrollStudentInCourseRef = enrollStudentInCourseRef;

exports.enrollStudentInCourse = function enrollStudentInCourse(dcOrVars, vars) {
  return executeMutation(enrollStudentInCourseRef(dcOrVars, vars));
};

const listAllCoursesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllCourses');
}
listAllCoursesRef.operationName = 'ListAllCourses';
exports.listAllCoursesRef = listAllCoursesRef;

exports.listAllCourses = function listAllCourses(dc) {
  return executeQuery(listAllCoursesRef(dc));
};
