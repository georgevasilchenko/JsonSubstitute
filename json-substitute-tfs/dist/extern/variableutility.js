"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("vsts-task-lib");
function isPredefinedVariable(variable) {
    var predefinedVarPrefix = ['agent.', 'azure_http_user_agent', 'build.', 'common.', 'release.', 'system', 'tf_'];
    for (let varPrefix of predefinedVarPrefix) {
        if (variable.toLowerCase().startsWith(varPrefix)) {
            return true;
        }
    }
    return false;
}
exports.isPredefinedVariable = isPredefinedVariable;
function isEmpty(object) {
    if (object == null || object == "")
        return true;
    return false;
}
exports.isEmpty = isEmpty;
function isObject(object) {
    if (object == null || object == "" || typeof (object) != 'object') {
        return false;
    }
    return true;
}
exports.isObject = isObject;
function getVariableMap() {
    var variableMap = {};
    var taskVariables = tl.getVariables();
    for (var taskVariable of taskVariables) {
        if (!isPredefinedVariable(taskVariable.name)) {
            variableMap[taskVariable.name] = taskVariable.value;
        }
    }
    return variableMap;
}
exports.getVariableMap = getVariableMap;
//# sourceMappingURL=variableutility.js.map