"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("colors");
const commander_1 = require("commander");
const path_1 = require("path");
const node_jose_1 = __importDefault(require("node-jose"));
const prompt_sync_1 = __importDefault(require("prompt-sync"));
const utils_1 = require("./lib/utils");
const BulkDataClient_1 = __importDefault(require("./lib/BulkDataClient"));
const cli_1 = __importDefault(require("./reporters/cli"));
const text_1 = __importDefault(require("./reporters/text"));
const loggers_1 = require("./loggers");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const bootstrap_1 = require("./bootstrap");
const reporters = {
    cli: cli_1.default,
    text: text_1.default
};
const APP = new commander_1.Command();
APP.name("node .");
APP.version("2.0.0");
// Bulk Data Server base URL
APP.option("-f, --fhir-url [url]", "FHIR server base URL. Must be set either as parameter or in the configuration file.");
APP.option('-F, --_outputFormat [string]', `The output format you expect.`);
APP.option("-s, --_since [date]", "Only include resources modified after this date");
APP.option('-t, --_type [list]', "Zero or more resource types to download. If omitted downloads everything.");
APP.option('-e, --_elements [list]', 'Zero or more FHIR elements to include in the downloaded resources');
APP.option('-p, --patient [list]', 'Zero or more patient IDs to be included. Implies --post');
APP.option('-i, --includeAssociatedData [list]', 'String of comma delimited values. When provided, server with support for the parameter and requested values SHALL return a pre-defined set of metadata associated with the request.');
APP.option('-q, --_typeFilter [string]', 'Experimental _typeFilter parameter passed as is to the server');
APP.option('--global', 'Global (system-level) export');
APP.option('--post', 'Use POST kick-off requests');
APP.option('-g, --group [id]', 'Group ID - only include resources that belong to this group. Ignored if --global is set');
APP.option('--lenient', 'Sets a "Prefer: handling=lenient" request header to tell the server to ignore unsupported parameters');
APP.option('-d, --destination [destination]', 'Download destination. See config/defaults.js for examples');
APP.option("--config <path>", 'Relative path to config file.');
APP.option("--reporter [cli|text]", 'Reporter to use to render the output. "cli" renders fancy progress bars and tables. "text" is better for log files. Defaults to "cli".');
APP.option("-c, --custom [opt=val...]", "Custom parameters to be passed to the kick-off endpoint.");
APP.option("--status [url]", "Status endpoint of already started export.");
APP.action(async (args) => {
    const { config, ...params } = args;
    const defaultsPath = (0, path_1.resolve)(__dirname, "../config/defaults.js");
    const base = require(defaultsPath);
    const options = { ...base };
    if (config) {
        const configPath = (0, path_1.resolve)(__dirname, "..", config);
        const cfg = require(configPath);
        Object.assign(options, cfg);
    }
    Object.assign(options, params);
    //S3 Bucket Creation --------------------------------------------------------
    if (options.destination && options.destination.startsWith("s3://")) {
        console.log("S3 destination detected. Initializing S3 bucket...");
        if (options.awsAccessKeyId && options.awsSecretAccessKey && options.awsRegion) {
            aws_sdk_1.default.config.update({
                accessKeyId: options.awsAccessKeyId,
                secretAccessKey: options.awsSecretAccessKey,
                sessionToken: options.awsSessionToken,
                region: options.awsRegion
            });
            const s3 = new aws_sdk_1.default.S3();
            // Initialize bucket
            const bucketStatus = await (0, bootstrap_1.initBucket)(s3);
            if (!bucketStatus?.success) {
                console.error("Error initializing bucket:");
                return;
            }
        }
        else {
            console.log("AWS credentials or region not provided. Skipping S3 bucket initialization.");
            return;
        }
    }
    if (!options.fhirUrl) {
        console.log("A 'fhirUrl' is required as configuration option, or as '-f' or " +
            "'--fhir-url' parameter!".red);
        return APP.help();
    }
    // Verify fhirUrl ----------------------------------------------------------
    if (!options.fhirUrl) {
        console.log("A 'fhirUrl' is required as configuration option, or as '-f' or " +
            "'--fhir-url' parameter!".red);
        return APP.help();
    }
    options.fhirUrl = options.fhirUrl.replace(/\/*$/, "/");
    // Verify tokenUrl ---------------------------------------------------------
    if (!options.tokenUrl) {
        try {
            options.tokenUrl = await (0, utils_1.detectTokenUrl)(options.fhirUrl);
        }
        catch {
            console.log("Failed to auto-detect 'tokenUrl'! " +
                "Please set it in the config file".red);
            return;
        }
    }
    // Verify privateKey -------------------------------------------------------
    if (options.tokenUrl !== "none") {
        if (!options.privateKey) {
            console.log("A 'privateKey' option must be set in the config file!".red);
            return;
        }
        try {
            options.privateKey = await node_jose_1.default.JWK.asKey(options.privateKey, "json");
        }
        catch {
            console.log("Invalid 'privateKey' option in the config file!".red);
            return;
        }
    }
    // Verify Access Token -------------------------------------------------------
    if (options.authUrl !== "none") {
        if (!options.clientId) {
            console.log("A 'clientId' option must be set in the config file!".red);
            return;
        }
        else if (!options.clientSecrets) {
            console.log("A 'clientSecrets' option must be set in the config file!".red);
            return;
        }
    }
    options.log = {
        enabled: true,
        ...(options.log || {})
    };
    const client = new BulkDataClient_1.default(options);
    const reporter = reporters[options.reporter](client);
    if (options.log.enabled) {
        const logger = (0, loggers_1.createLogger)(options.destination, options.log);
        const startTime = Date.now();
        let totalOutputFileCount = 0;
        let totalDeletedFileCount = 0;
        let totalErrorFileCount = 0;
        let totalManifests = 0;
        // kickoff -------------------------------------------------------------
        client.on("kickOffEnd", ({ requestParameters, capabilityStatement, response, responseHeaders }) => {
            logger.log("info", {
                eventId: "kickoff",
                eventDetail: {
                    exportUrl: response.requestUrl,
                    errorCode: response.statusCode >= 400 ? response.statusCode : null,
                    errorBody: response.statusCode >= 400 ? response.body : null,
                    softwareName: capabilityStatement.software?.name || null,
                    softwareVersion: capabilityStatement.software?.version || null,
                    softwareReleaseDate: capabilityStatement.software?.releaseDate || null,
                    fhirVersion: capabilityStatement.fhirVersion || null,
                    requestParameters,
                    responseHeaders,
                    logVersion: "2"
                }
            });
        });
        // status_progress -----------------------------------------------------
        if (options.log.logStatusProgress) {
            client.on("exportProgress", e => {
                if (!e.virtual) { // skip the artificially triggered 100% event
                    logger.log("info", {
                        eventId: "status_progress",
                        eventDetail: {
                            body: e.body,
                            xProgress: e.xProgressHeader,
                            retryAfter: e.retryAfterHeader
                        }
                    });
                }
            });
        }
        // status_error --------------------------------------------------------
        client.on("exportError", eventDetail => {
            logger.log("error", {
                eventId: "status_error",
                eventDetail
            });
        });
        // status_page_complete ------------------------------------------------
        client.on("exportPage", manifest => {
            totalOutputFileCount += manifest.output.length;
            totalDeletedFileCount += manifest.deleted?.length || 0;
            totalErrorFileCount += manifest.error.length;
            totalManifests += 1;
            logger.log("info", {
                eventId: "status_page_complete",
                eventDetail: {
                    transactionTime: manifest.transactionTime,
                    outputFileCount: manifest.output.length,
                    deletedFileCount: manifest.deleted?.length || 0,
                    errorFileCount: manifest.error.length
                }
            });
        });
        // manifest_complete ---------------------------------------------------
        client.on("manifestComplete", transactionTime => {
            logger.log("info", {
                eventId: "manifest_complete",
                eventDetail: {
                    transactionTime,
                    totalOutputFileCount,
                    totalDeletedFileCount,
                    totalErrorFileCount,
                    totalManifests
                }
            });
        });
        // status_complete -----------------------------------------------------
        client.on("exportComplete", manifest => {
            logger.log("info", {
                eventId: "status_complete",
                eventDetail: {
                    transactionTime: manifest.transactionTime
                }
            });
        });
        // download_request ----------------------------------------------------
        client.on("downloadStart", eventDetail => {
            logger.log("info", { eventId: "download_request", eventDetail });
        });
        // download_complete ---------------------------------------------------
        client.on("downloadComplete", eventDetail => {
            logger.log("info", { eventId: "download_complete", eventDetail });
        });
        // download_error ------------------------------------------------------
        client.on("downloadError", eventDetail => {
            logger.log("info", { eventId: "download_error", eventDetail });
        });
        // export_complete -----------------------------------------------------
        client.on("allDownloadsComplete", downloads => {
            const eventDetail = {
                files: 0,
                resources: 0,
                bytes: 0,
                attachments: 0,
                duration: Date.now() - startTime
            };
            downloads.forEach(d => {
                eventDetail.files += 1;
                eventDetail.resources += d.resources;
                eventDetail.bytes += d.uncompressedBytes;
                eventDetail.attachments += d.attachments;
            });
            logger.log("info", { eventId: "export_complete", eventDetail });
        });
    }
    process.on("SIGINT", () => {
        console.log("\nExport canceled.".magenta.bold);
        reporter.detach();
        client.abort();
        process.exit(0);
    });
    process.on("uncaughtException", e => (0, utils_1.exit)(e));
    client.on("error", error => {
        console.error(error);
        process.exit(1);
    });
    await client.run(options.status)
        .then(() => {
        if (options.reporter === "cli") {
            const answer = (0, prompt_sync_1.default)()("Do you want to signal the server that this export can be removed? [Y/n]".cyan);
            if (!answer || answer.toLowerCase() === 'y') {
                client.cancelExport(client.statusEndpoint).then(() => console.log("\nThe server was asked to remove this export!".green.bold));
            }
        }
    })
        .catch(error => {
        if (options.log.enabled) {
            const logger = (0, loggers_1.createLogger)(options.destination, options.log);
            logger.once("close", () => setTimeout(() => (0, utils_1.exit)(error), 1000));
            logger.error("info", {
                eventId: "client_error",
                eventDetail: {
                    error: error.stack
                }
            });
            logger.close();
        }
        else {
            (0, utils_1.exit)(error);
        }
    });
});
async function main() {
    await APP.parseAsync(process.argv);
}
main();
