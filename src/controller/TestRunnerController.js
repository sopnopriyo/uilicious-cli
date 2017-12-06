/**
 *TestRunnerController class responds to run command
 *in the command line
 *@author Shahin (shahin@uilicious.com)
 */

// npm Dependencies
const fs = require('fs');
const util = require('util');
const rjson = require("relaxed-json");

// Chalk (color) messages for success/error
const chalk = require('chalk');
const error = chalk.red;
const success = chalk.green;

// Module Dependencies (non-npm)
const CLIUtils = require('../utils/CliUtils');
const ProjectService = require('../service/ProjectService');
const TestService = require('../service/TestService');
const APIUtils = require('../utils/ApiUtils');

class TestRunnerController {


//------------------------------------------------------------------------------
//	Main Function to run test script
//------------------------------------------------------------------------------

    /**
     *Run test script from project
     *@param projectName
     *@param scriptPath
     *@param options
     *@return {Promise.<TResult>}
     */
    static main(projectName, scriptPath, options) {



        if (options.save != null) {
            let copyProjectId;
            let copyTestDirectory;
            return TestService.makeDir(options.save)
                .then(testDirectory => {
                    // Test log functionality
                    copyTestDirectory = testDirectory;
                    let testLog = testDirectory + '/log.txt';
                    const logFile = fs.createWriteStream(testLog, {
                        flags: 'a',
                        defaultEncoding: 'utf8'
                    });
                    const logStdout = process.stdout;
                    CLIUtils.banner();
                    console.log = function() {
                        logFile.write(util.format.apply(null, arguments) + '\n');
                        logStdout.write(util.format.apply(null, arguments) + '\n');
                    };
                    //console.error = console.log;
                    CLIUtils.consoleLogTestDate();

                    console.log("#");
                    console.log("# Uilicious CLI - Test Runner");
                    console.log("# Project Name: " + projectName);
                    console.log("# Test Path : " + scriptPath);
                    console.log("#");
                    return APIUtils.getFullHostURL()})
                .then(response => {
                    console.log("# Log In Successful");
                    console.log("#");
                    return ProjectService.projectID(projectName);
                })
                .then(projectId => {
                    console.log("# Project ID : "+projectId);
                    return TestService.runTest(projectId, scriptPath, options)
                })
                .then(postID => {
                    console.log("# Test run ID: "+postID);
                    console.log("#");
                    console.log("");
                    return TestService.pollForResult(postID)
                })
                .then(response => {
                    console.log("");
                    console.log(TestService.outputTotalTestRunningTime(response.steps));
                    console.log("");
                    console.log(TestService.outputStatus(response.steps));
                    TestService.processErrors(response.steps);
                    console.log("")
                    console.log("Test Info saved in "+copyTestDirectory+"\n");
                })
                .catch(errors => {
                    console.error(error(errors));
                });
        }
        else {
            CLIUtils.banner();
            CLIUtils.consoleLogTestDate();

            console.log("#");
            console.log("# Uilicious CLI - Runner");
            console.log("# Project Name: " + projectName);
            console.log("# Test Path : " + scriptPath);
            console.log("#");
            return APIUtils.getFullHostURL()
                .then(response => {
                    console.log("# Log In Successful");
                    return ProjectService.projectID(projectName);
                })
                .then(projectId => {
                    console.log("# Project ID : "+projectId);
                    return TestService.runTest(projectId, scriptPath, options)
                })
                .then(postID => {
                    console.log("# Test run ID: "+postID);
                    console.log("#");
                    console.log("");
                    return TestService.pollForResult(postID)
                })
                .then(response => {
                    console.log("");
                    console.log(TestService.outputTotalTestRunningTime(response.steps));
                    console.log("");
                    console.log(TestService.outputStatus(response.steps));
                    TestService.processErrors(response.steps);
                })
                .catch(errors => {
                    console.error(error(errors));
                });
        }
    }
}

module.exports = TestRunnerController;
