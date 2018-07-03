import tl = require('vsts-task-lib/task');
import path = require('path');
import fs = require('fs');
import varUtility = require ('./variableutility.js');
import fileEncoding = require('./fileencoding.js');
import utility = require('./utility.js');
import { VariableInfo } from "vsts-task-lib/task";

export function createEnvTree(envVariables: any) {
    // __proto__ is marked as null, so that custom object can be assgined.
    // This replacement do not affect the JSON object, as no inbuilt JSON function is referenced.
    var envVarTree = {
        value: null,
        isEnd: false,
        child: {
            '__proto__': null
        }
    };
    for(let envVariable of envVariables) {
        var envVarTreeIterator: any = envVarTree;
        if(varUtility.isPredefinedVariable(envVariable.name)) {
            continue;
        } 
        var envVariableNameArray = (envVariable.name).split('.');
        
        for(let variableName of envVariableNameArray) {
            if(envVarTreeIterator.child[variableName] === undefined || typeof envVarTreeIterator.child[variableName] === 'function') {
                envVarTreeIterator.child[variableName] = {
                    value: null,
                    isEnd: false,
                    child: {}
                };
            }
            envVarTreeIterator = envVarTreeIterator.child[variableName];
        }
        envVarTreeIterator.isEnd = true;
        envVarTreeIterator.value = envVariable.value;
    }
    return envVarTree;
}

function checkEnvTreePath(jsonObjectKey: any, index: any, jsonObjectKeyLength: any, envVarTree: any): any {
    if(index == jsonObjectKeyLength) {
        return envVarTree;
    }
    if(envVarTree.child[ jsonObjectKey[index] ] === undefined || typeof envVarTree.child[ jsonObjectKey[index] ] === 'function') {
        return undefined;
   }
    return checkEnvTreePath(jsonObjectKey, index + 1, jsonObjectKeyLength, envVarTree.child[ jsonObjectKey[index] ]);
}

export function substituteJsonVariable(jsonObject: any, envObject: any) {
    for(var jsonChild in jsonObject) {
        var jsonChildArray = jsonChild.split('.');
        var resultNode = checkEnvTreePath(jsonChildArray, 0, jsonChildArray.length, envObject);
        if(resultNode != undefined) {
            if(resultNode.isEnd && (jsonObject[jsonChild] == null || typeof jsonObject[jsonChild] !== "object")) {
                tl.debug('substituting value on key: ' + jsonChild);
                jsonObject[jsonChild] = resultNode.value;
            }
            else {
                substituteJsonVariable(jsonObject[jsonChild], resultNode);
            }
        }
    }
}

export function stripJsonComments(content: any) {
    if (!content || (content.indexOf("//") < 0 && content.indexOf("/*") < 0)) {
        return content;
    }

    var currentChar;
    var nextChar;
    var insideQuotes = false;
    var contentWithoutComments = '';
    var insideComment = 0;
    var singlelineComment = 1;
    var multilineComment = 2;

    for (var i = 0; i < content.length; i++) {
        currentChar = content[i];
        nextChar = i + 1 < content.length ? content[i + 1] : "";

        if (insideComment) {
            var update = false;
            if (insideComment == singlelineComment && (currentChar + nextChar === '\r\n' || currentChar === '\n')) {
                i--;
                insideComment = 0;
                continue;
            }

            if (insideComment == multilineComment && currentChar + nextChar === '*/') {
                i++;
                insideComment = 0;
                continue;
            }

        } else {
            if (insideQuotes && currentChar == "\\") {
                contentWithoutComments += currentChar + nextChar;
                i++; // Skipping checks for next char if escaped
                continue;
            }
            else {
                if (currentChar == '"') {
                    insideQuotes = !insideQuotes;
                }

                if (!insideQuotes) {
                    if (currentChar + nextChar === '//') {
                        insideComment = singlelineComment;
                        i++;
                    }

                    if (currentChar + nextChar === '/*') {
                        insideComment = multilineComment;
                        i++;
                    }
                }
            }
        }

        if (!insideComment) {
            contentWithoutComments += content[i];
        }
    }

    return contentWithoutComments;
}

export function jsonVariableSubstitution(jsonFilePath: string, envVar: VariableInfo[] | undefined) {
    var envVarObject = envVar === undefined 
    ? createEnvTree(tl.getVariables()) 
    : createEnvTree(envVar);

    //var matchFiles = utility.findfiles(path.join(absolutePath, jsonSubFile));
    var matchFiles = utility.findfiles(jsonFilePath);
    if(matchFiles.length === 0) {
        throw new Error(tl.loc('NOJSONfilematchedwithspecificpattern', jsonFilePath));
    }
    for(let file of matchFiles) {
        var fileBuffer: Buffer = fs.readFileSync(file);
        var fileEncodeType = fileEncoding.detectFileEncoding(file, fileBuffer);
        var fileContent: string = fileBuffer.toString(<string>fileEncodeType[0]);
        if(fileEncodeType[1]) {
            fileContent = fileContent.slice(1);
        }
        try {
            fileContent = stripJsonComments(fileContent);
            var jsonObject = JSON.parse(fileContent);
        }
        catch(exception) {
            throw Error(tl.loc('JSONParseError', file, exception));
        }
        tl.debug('Applying JSON variable substitution for ' + file);
        substituteJsonVariable(jsonObject, envVarObject);
        tl.writeFile(file, (fileEncodeType[1] ? '\uFEFF' : '') + JSON.stringify(jsonObject, null, 4), <string>fileEncodeType[0]);
    }

    // for(let jsonSubFile of jsonSubFiles) {
    //     tl.debug('JSON variable substitution for ' + jsonSubFile);
        
    // }
}