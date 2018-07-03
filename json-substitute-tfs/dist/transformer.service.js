"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("vsts-task-lib/task");
const jsonSubstitutionUtility = require("./extern/jsonvariablesubstitutionutility.js");
class TransformerService {
    constructor() {
    }
    fileTransformations(jsonFilePath, envVars) {
        if (jsonFilePath.length != 0) {
            //jsonSubstitutionUtility.jsonVariableSubstitution(folderPath, JSONFiles, envVars);
            jsonSubstitutionUtility.jsonVariableSubstitution(jsonFilePath, envVars);
            console.log(tl.loc('JSONvariablesubstitutionappliedsuccessfully'));
        }
    }
}
exports.TransformerService = TransformerService;
//# sourceMappingURL=transformer.service.js.map