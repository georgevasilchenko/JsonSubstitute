import tl = require('vsts-task-lib/task');
import path = require('path');
import Q = require('q');
import fs = require('fs');

import DecompressZip = require('decompress-zip');
import archiver = require('archiver');

export async function unzip(zipLocation: any, unzipLocation: any) {
    var defer = Q.defer();
    if(tl.exist(unzipLocation)) {
      tl.rmRF(unzipLocation);
    }
    var unzipper = new DecompressZip(zipLocation);
    tl.debug('extracting ' + zipLocation + ' to ' + unzipLocation);
    unzipper.on('error', function (error: any) {
        defer.reject(error);
    });
    unzipper.on('extract', function (log: any) {
        tl.debug('extracted ' + zipLocation + ' to ' + unzipLocation + ' Successfully');
        defer.resolve(unzipLocation);
    });
    unzipper.extract({
      path: unzipLocation
    });
    return defer.promise;
}

export async function archiveFolder(folderPath: any, targetPath: any, zipName: any) {
    var defer = Q.defer();
    tl.debug('Archiving ' + folderPath + ' to ' + zipName);
    var outputZipPath = path.join(targetPath, zipName);
    var output = fs.createWriteStream(outputZipPath);
    var archive = archiver('zip');
    output.on('close', function () {
        tl.debug('Successfully created archive ' + zipName);
        defer.resolve(outputZipPath);
    });

    output.on('error', function(error) {
        defer.reject(error);
    });

    archive.pipe(output);
    archive.directory(folderPath, '/');
    archive.finalize();

    return defer.promise;
}

/**
 *  Returns array of files present in archived package
 */
export async function getArchivedEntries(archivedPackage: string)  {
    var deferred = Q.defer();
    var unzipper = new DecompressZip(archivedPackage);
    unzipper.on('error', function (error: any) {
        deferred.reject(error);
    });
    unzipper.on('list', function (files: any) {
        var packageComponent = {
            "entries":files
        };
        deferred.resolve(packageComponent); 
    });
    unzipper.list();
    return deferred.promise;
}

