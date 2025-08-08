/**
 * This file lists all the available options and their descriptions and default
 * values.
 * 
 * USE THIS AS A TEMPLATE FOR CREATING YOU OWN CONFIGURATION FILES THAT ONLY
 * OVERRIDE THE PROPERTIES YOU NEED TO CHANGE. Then use the `--config` parameter
 * in CLI to load your configuration file.
 * 
 * @type {import("..").BulkDataClient.ConfigFileOptions}
 */

 const bucket = process.env.BUCKET_NAME || "fhir-bulk-data";
 

 module.exports = {

    /**
     * FHIR server base URL. Can be overridden by the `-f` or `--fhir-url`
     * CLI parameter.
     */
    fhirUrl: "https://bulk-data.smarthealthit.org/eyJlcnIiOiIiLCJwYWdlIjoxMDAwMCwidGx0IjoxNSwibSI6MSwiZGVsIjowLCJzZWN1cmUiOjB9/fhir",

    /**
     * The Bulk Data server token URL ("none" for open servers)
     */
    tokenUrl: "none",

    /**
     * The BCDA token URL
     */
    authUrl: "none",     
 
    /**
     * The private key (JWK) used to sign authentication tokens. This is not
     * needed for open servers
     */
    privateKey: {},

    /**
     * This is not needed for open servers
     */
    clientId: "",

    /**
     * This is not needed for open servers
     */
    clientSecrets: "",    

    /**
     * The scope to use in the authorization request. If not set, defaults to
     * "system/*.rs"
     */
    scope: "system/*.rs",

    /**
     * The access token lifetime in seconds. Note that the authentication server
     * may ignore or restrict this to its own boundaries
     */
    accessTokenLifetime: 300, // 5 minutes

    /**
     * The default reporter is "cli". That works well in terminal and
     * renders some fancy stuff like progress bars. However, this does not
     * look good when your STDOUT ends up in log files. For example, if
     * you are using this tool as part of some kind of pipeline and want to
     * maintain clean logs, then consider changing this to "text".
     * 
     * Can be overridden from terminal parameter `--reporter`. 
     */
    reporter: "cli",

    /**
     * The value of the `_outputFormat` parameter for Bulk Data kick-off
     * requests. Will be ignored if empty or falsy.
     * 
     * Can be overridden from terminal parameter `-F` or `--_outputFormat`
     */
    _outputFormat: "",

    /**
     * The value of the `_since` parameter for Bulk Data kick-off requests.
     * Can also be partial date like "2002", "2020-03" etc. Can be anything that
     * Moment can parse. Will be ignored if empty or falsy.
     * @see https://momentjs.com/docs/#/parsing/
     * 
     * Can be overridden from terminal parameter `-F` or `--_outputFormat`
     */
    _since: "",

    /**
     * The value of the `_type` parameter for Bulk Data kick-off requests.
     * Will be ignored if empty or falsy.
     * 
     * Can be overridden from terminal parameter `-t` or `--_type`
     */
    _type: "",

    /**
     * The value of the `_elements` parameter for Bulk Data kick-off requests.
     * Will be ignored if empty or falsy.
     * 
     * Can be overridden from terminal parameter `-e` or `--_elements`
     */
    _elements: "",

    /**
     * The value of the `patient` parameter for Bulk Data kick-off requests.
     * Will be ignored if empty or falsy.
     * 
     * Can be overridden from terminal parameter `-p` or `--patient`
     */
    patient: "",

    /**
     * The value of the `includeAssociatedData` parameter for Bulk Data kick-off
     * requests. Will be ignored if empty or falsy.
     * 
     * Can be overridden from terminal parameter `-i` or `--includeAssociatedData`
     */
    includeAssociatedData: "",

    /**
     * The value of the `_typeFilter` parameter for Bulk Data kick-off requests.
     * Will be ignored if empty or falsy.
     * 
     * Can be overridden from terminal parameter `-q` or `--_typeFilter`
     */
    _typeFilter: "",

    /**
     * By default this client will make patient-level exports. If this is set to
     * true, it will make system-level exports instead.
     * 
     * Ignored if `group` is set!
     * 
     * Can be overridden from terminal parameter `--global`
     */
    global: false,

    /**
     * Id of FHIR group to export. If set, the client will make group-level
     * exports.
     * 
     * Can be overridden from terminal parameter `-g` or `--group`
     */
    group: "",

    /**
     * When provided, a server with support for the parameter MAY return a
     * portion of bulk data output files to a client prior to all output files
     * being available and/or MAY distribute bulk data output files among
     * multiple manifests and provide links for clients to page through the
     * manifests.
     */
    allowPartialManifests: false,

    /**
     * When provided, a server with support for the parameter SHALL organize the
     * resources in output files by instances of the specified resource type,
     * including a header for each resource of the type specified in the
     * parameter, followed by the resource and resources in the output that
     * contain references to that resource. When omitted, servers SHALL organize
     * each output file with resources of only single type.
     * 
     * A server unable to structure output by the requested organizeOutputBy
     * resource SHOULD return an error and FHIR OperationOutcome resource. When
     * a Prefer: handling=lenient header is included in the request, the server
     * MAY process the request instead of returning an error.
     */
    organizeOutputBy: "",

    /**
     * If true, adds `handling=lenient` to the `prefer` request header. This may
     * enable a "retry" option after certain errors. It can also be used to
     * signal the server to silently ignore unsupported parameters.
     * 
     * Can be overridden from terminal parameter `--lenient`
     */
    lenient: true,

    /**
     * Custom options for every request, EXCLUDING the authorization request and
     * any upload requests (in case we use remote destination).
     * Many options are available so be careful what you specify here! Some
     * useful options are hinted below.
     * @see https://github.com/sindresorhus/got/blob/main/documentation/2-options.md
     * @type {import("got/dist/source").OptionsOfUnknownResponseBody}
     */
    requests: {
        https: {
            rejectUnauthorized: true // reject self-signed certs
        },
        timeout: 20000, // 20 seconds custom timeout
        headers: {
            "accept": "application/fhir+json",
            "prefer": "respond-async",
            "content-type": "application/json",            
            "x-client-id": "fhir-bulk-client"
        }
    },

    /**
     * How many downloads to run in parallel. This will speed up the
     * download but can also overload the server. Don't be too greedy and
     * don't set this to more than 10!
     */
    parallelDownloads: 5,

    /**
     * In some cases it might be useful to also save the export manifest
     * file along with the downloaded NDJSON files.
     */
    saveManifest: false,

    /**
     * While parsing NDJSON files every single (non-empty) line is parsed
     * as JSON. It is recommended to set a reasonable limit for the line
     * length so that a huge line does not consume the entire memory.
     */
    ndjsonMaxLineLength: 10000000,

    /**
     * If `true`, verifies that every single JSON object extracted for the
     * NDJSON file has a `resourceType` property, and that this property
     * equals the expected `type` reported in the export manifest.
     */
    ndjsonValidateFHIRResourceType: true,

    /**
     * If the server reports the file `count` in the export manifest,
     * verify that the number of resources found in the file matches the
     * count reported by the server.
     */
    ndjsonValidateFHIRResourceCount: true,

    /**
     * The original export manifest will have an `url` property for each
     * file, containing the source location. It his is set to `true`, add
     * a `destination` property to each file containing the path (relative
     * to the manifest file) to the saved file.
     * 
     * This is ONLY used if `saveManifest` is set to `true`.
     */
    addDestinationToManifest: false,

    /**
     * Sometimes a server may use weird names for the exported files. For
     * example, a HAPI server will use random numbers as file names. If this
     * is set to `true` files will be renamed to match the standard naming
     * convention - `{fileNumber}.{ResourceType}.ndjson`.
     */
    forceStandardFileNames: true,

    /**
     * If this is set to `false`, external attachments found in
     * DocumentReference resources will not be downloaded. The DocumentReference
     * resources will still be downloaded but no further processing will be done.
     * Can also be an array of white-listed mime types.
     */
    downloadAttachments: true,

    /**
     * If `true` the client will try to download the attachments but it will
     * ignore download errors (although those errors will still be logged).
     */
    ignoreAttachmentDownloadErrors: false,

    /**
     * In `DocumentReference` resources, any `attachment` elements having an
     * `url` (instead of inline data) and a `size` below this number will be
     * downloaded and put inline as base64 `data`. Then the `size` property
     * will be updated and the `url` will be removed.
     * 
     * - To always disable this, set it to `0`
     * - To always enable this, set it to `Infinity` (bad idea!)
     * - To inline files smaller than 5 MB set it to `5 * 1024 * 1024` 
     */
    inlineDocRefAttachmentsSmallerThan: 0,

    /**
     * If an attachment can be inlined (based on its size and the value of
     * the `inlineDocRefAttachmentsSmallerThan` option), then its mime type
     * will be compared with this list. Only files of listed types will be
     * inlined and the rest will be downloaded into "attachment" subfolder.
     */
    inlineDocRefAttachmentTypes: ["text/plain", "application/pdf"],

    /**
     * If this is true, attachments of type PDF that are being inlined will
     * first be converted to text and then inlined as base64
     */
    pdfToText: false,

    /**
     * Examples:
     * - `s3://bucket-name/optional-subfolder/` - Upload to S3
     * - `./downloads` - Save to local folder (relative to the config file)
     * - `downloads` - Save to local folder (relative to the config file)
     * - `/path/to/downloads` - Save to local folder (absolute path)
     * - `file:///path/to/downloads` - Save to local folder (file url)
     * - `http://destination.dev` - POST to http
     * - `http://username:password@destination.dev` - POST to http with basic auth
     * - `""` - do nothing
     * - `"none"` - do nothing
     * 
     * Can be overridden from terminal parameter `-d` or `--destination`
     */
    destination: `s3://${bucket}/dataset-ndjson/fhir`, // Location for FHIR datasets


    /**
     * **Example: `us-east-1`**
     */
    awsRegion: process.env.AWS_REGION || "us-east-1",

    /**
     * Only needed if `destination` points to S3
     */
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    
    /**
     * Only needed if `destination` points to S3
     */
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

    /**
    * Only needed if `destination` points to S3
    */
    awsSessionToken:  process.env.AWS_SESSION_TOKEN,  

    /**
    * Only needed if `destination` points to S3
    */
    bucket: process.env.BUCKET_NAME || "fhir-bulk-data",   


    log: {
        enabled: true,

        /**
         * Key/value pairs to be added to every log entry. Can be used to add
         * useful information, for example which site imported this data.
         */
        metadata: {
            // siteId: "localhost"
        }
    },

    /**
     * If the server does not provide `Retry-after` header use this number of
     * milliseconds before checking the status again
     */
    retryAfterMSec: 200,

    /**
     * ResponseHeaders to include in error logs for debugging purposes
     * When 'all' is specified, all responseHeaders are returned
     * When 'none' is specified, no responseHeaders are returned
     * Otherwise, log any responseHeaders matches against 1...* strings/regexp 
     * NOTE: When an empty array is specified, an empty object of responseHeaders will be returned
     */
    logResponseHeaders: 'all',

    /**
     * A subset of got retry configuration object, determining retry behavior when downloading files. 
     * For most scenarios, an object with only a `limit`: `number` property will be sufficient. 
     * This determines how many times a file download will be retried before failing. 
     * Each subsequent attempt will delay using an exponential backoff.
     * For more details on options, see [https://github.com/sindresorhus/got/blob/main/documentation/7-retry.md](https://github.com/sindresorhus/got/blob/main/documentation/7-retry.md).
     */
    fileDownloadRetry: {
        limit: 5,
    },
}
