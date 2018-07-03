import tl = require('vsts-task-lib/task');
import jsonSubstitutionUtility = require('./extern/jsonvariablesubstitutionutility.js');
import { VariableInfo } from "vsts-task-lib/task";

export class TransformerService{
    constructor() {
        
    }

    fileTransformations(jsonFilePath: string, envVars: VariableInfo[] | undefined) {
        if(jsonFilePath.length != 0) {
            //jsonSubstitutionUtility.jsonVariableSubstitution(folderPath, JSONFiles, envVars);
            jsonSubstitutionUtility.jsonVariableSubstitution(jsonFilePath, envVars);
            console.log(tl.loc('JSONvariablesubstitutionappliedsuccessfully'));
        }
    }
}