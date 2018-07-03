"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("vsts-task-lib/task");
const transformer_service_1 = require("./transformer.service");
class Program {
    constructor() {
        this._transformerService = new transformer_service_1.TransformerService();
    }
    main() {
        console.log("JSON Substitute Start");
        //const jsonFilePath = "C:\\users\\georgyv\\Desktop\\appsettings.json";
        const jsonFilePath = tl.getInput('jsonFilePath', true);
        //this._transformerService.fileTransformations(jsonFilePath, this.createVariables());
        this._transformerService.fileTransformations(jsonFilePath, undefined);
        console.log("JSON Substitute End");
    }
    createVariables() {
        return [
            { name: "AppSettings.ConnectionStrings.Default", value: Date.now().toString() + "abc" },
            { name: "AppSettings.MailSettings.Host", value: Date.now().toString() + "def" },
            { name: "SimpleStringArray.0", value: Date.now().toString() + "def" },
            { name: "ObjectArray.0.name", value: Date.now().toString() + "def" },
        ];
    }
}
exports.Program = Program;
const program = new Program();
program.main();
//# sourceMappingURL=main.js.map