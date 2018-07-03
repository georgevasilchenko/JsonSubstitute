import tl = require('vsts-task-lib/task');
import { VariableInfo } from "vsts-task-lib/task";
import { TransformerService } from './transformer.service';

export class Program{

    private _transformerService: TransformerService = new TransformerService();

    public main(): void{

        console.log("JSON Substitute Start");
        //const jsonFilePath = "C:\\users\\georgyv\\Desktop\\appsettings.json";
        const jsonFilePath: string = tl.getInput('jsonFilePath', true);
        //this._transformerService.fileTransformations(jsonFilePath, this.createVariables());
        this._transformerService.fileTransformations(jsonFilePath, undefined);
        console.log("JSON Substitute End");
    }

    private createVariables(): VariableInfo[] {
        return [
            <VariableInfo>{name: "AppSettings.ConnectionStrings.Default", value: Date.now().toString() + "abc"},
            <VariableInfo>{name: "AppSettings.MailSettings.Host", value: Date.now().toString() + "def"},
            <VariableInfo>{name: "SimpleStringArray.0", value: Date.now().toString() + "def"},
            <VariableInfo>{name: "ObjectArray.0.name", value: Date.now().toString() + "def"},
        ];
    }
}

const program = new Program();
program.main();