param(
    [string]$jsonFilePath,
    [bool]$isDebugMode
)

#########################################################################################
# Download and load Newtonsoft.Json Nuget Package                                       #
#########################################################################################

# Prepare package provider
Write-Host "Installing package provider..."
Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force
Write-Host "Importing package provider..."
Import-PackageProvider -Name NuGet -RequiredVersion 2.8.5.201

# Check package
Write-Host "Checking package if installed..."
try {
    Get-Package -Name Newtonsoft.Json -ErrorAction Stop
    Write-Host "Found package"
}
Catch [System.Exception] {
    if($_.Exception.Message -like "*No package found*")
    {
        Write-Host "No package found, new package will be installed"
        
        Set-PackageSource nuget.org -NewLocation https://www.nuget.org/api/v2 -Trusted

        Write-Host "Searching package..."
        Find-Package -Name Newtonsoft.Json

        Write-Host "Installing package..."
        Install-Package -Name Newtonsoft.Json `
                        -Force `
                        -Scope CurrentUser `
                        -ProviderName NuGet
    }
}

Write-Host "Get Package:"
$package = Get-Package -Name Newtonsoft.Json | Where-Object {$_.ProviderName -eq "NuGet"}
$dllPath =[System.IO.Path]::Combine([System.IO.Path]::GetFullPath([System.IO.Path]::Combine($package.Source, "..\")),"lib\net45\Newtonsoft.Json.dll")

#########################################################################################
# JSON Transform                                                                        #
#########################################################################################

$assemblies = 
(
    $dllPath,
    "System.ObjectModel", 
    "System.Runtime", 
    "System.Dynamic.Runtime"
)

if($isDebugMode){
    $jsonFilePath = ".\appsettings.json"
    $vars = @(
        [Collections.DictionaryEntry]@{Key = "APPSETTINGS_JWTSECRET"; Value = "########"},
        [Collections.DictionaryEntry]@{Key = "APPSETTINGS_EMAILSETTINGS_SENDGRIDAPIKEY"; Value = "########"}
    );
}else{
    $vars = Get-ChildItem Env:
}

$source = @"
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json.Linq;

public class JsonService
{
    public static JObject Run(string path, DictionaryEntry[] envVariables)
    {
        Console.WriteLine("Running c# code");

        var jsonString = ReadJson(path);
        var jsonObject = JObject.Parse(jsonString);

        SetValuesRecursively(jsonObject, string.Empty, envVariables);
        return jsonObject;
    }

    public static string ReadJson(string path)
    {
       using (var fileStream = File.OpenRead(path))
       using (var reader = new StreamReader(fileStream))
       {
          return reader.ReadToEnd();
       }
    }

    public static void SetValuesRecursively(JObject jsonObject, string path, DictionaryEntry[] envVariables)
    {
        if (!jsonObject.HasValues)
        {
            Console.WriteLine("JSON is invalid");
            return;
        }

        foreach (var prop in jsonObject)
        {
            var addedPath = '_' + prop.Key;
            path = path.Length == 0 ? prop.Key : path + addedPath;

            switch (prop.Value.Type)
            {
               case JTokenType.Array:
                  throw new NotImplementedException("Arrays are not supported");

               case JTokenType.Object:
                  SetValuesRecursively((JObject)prop.Value, path, envVariables);
                  break;

               default:
                  foreach (var envVariable in envVariables)
                  {
                     var envVarName = envVariable.Key.ToString();
                     
                     if (path.ToUpperInvariant() == envVarName)
                     {
                        prop.Value.Replace(JToken.FromObject(envVariable.Value));
                        Console.WriteLine("Replaced: {0}", envVarName);
                     }
                  }
                  break;
            }

            path = path.Substring(0, path.Length < addedPath.Length ? 0 : path.Length - addedPath.Length);
        }
    }
}
"@

Add-Type -ReferencedAssemblies $assemblies `
         -TypeDefinition $source `
         -Language CSharp
Write-host "Loaded assemblies and types"

$jObject = [JsonService]::Run($jsonFilePath, $vars)

# write back to json file
Set-Content -Path $jsonFilePath -Value $jObject.ToString()
Write-Host "Saved json file" -ForegroundColor Green

#########################################################################################
# Cleanup                                                                               #
#########################################################################################

Uninstall-Package -Name Newtonsoft.Json `
                  -ProviderName NuGet `
                  -Force
Write-Host "Uninstalled package"
Write-Host "End"