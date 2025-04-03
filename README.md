# Bulk Data Client

If you want to use this in JS/TS projects, aor if you would like to contribute to this projects see the **[API Docs](https://docs.smarthealthit.org/bulk-data-client/docs/api/)**

## Usage examples
Note: these example are using an open server. Protected server examples would work the same but you need to set your clientId, privateKey and tokenEndpoint in the configuration file. The `fhirUrl` option can also set in the config file to keep the examples shorter.


Patient-level export
```sh
node . -f https://bulk-data.smarthealthit.org/fhir
```

System-level export
```sh
node . --global
```

Group-level export
```sh
node . -g myGroupId
```

Passing export parameters
Group-level export
```sh
node . --_since 2010-03 --_type Patient, Observations
```

Patient-level export with debugging information printed to the console
```sh
export NODE_DEBUG=app-request; node . -f https://builk-data.smarthealthit.org/fhir 
```

For more options see the CLI parameters and configuration options below.

### Retrying previous exports
In some cases the export might fail due to network errors or other interruptions.
If that happens the export might still be running on the server. If you want to
restart a failed export, make sure you look at the terminal output for a line
like `Status endpoint: {URL}`. If that is present, it means the export started
successfully on the server and we have been given that URL as dedicated status
location. To save some time and resources, and to avoid starting a new export
while retrying, you can copy that URL and use it as the value of the `---status`
CLI parameter when you re-run the command. 

## Installation

**Prerequisites**: Git and NodeJS 15 to 18.

1. Clone the repository
   ```sh
   git clone https://github.com/smart-on-fhir/bulk-data-client.git
   ```
2. Go into the project directory
   ```sh
   cd bulk-data-client
   ```
3. Make sure you are using NodeJS 15, 16, 17, or 18. If you use `nvm` run:
   ```sh
   nvm use
   ```
4. Install dependencies
   ```sh
   npm i
   ```

## Configuration
A configuration file will have to be created for every server you want to connect to. The way to do that is:
1. Copy the default config file and give it new name:
   ```sh
   cp config/defaults.js config/my-config-1.js
   ```
2. Edit your configuration open your newly created configuration file, read the description in the comments for every option and set whatever you need. Feel free to remove unneeded options! See below for details.

The configuration works by loading the default values from `config/defaults.js`, then merging that with your custom config (overriding the defaults), and finally merging with any CLI parameters (a subset of the config options can be passed as CLI parameters).

### Configuration File Options
The Bulk Data Client uses `js` configuration files, but you can think of them as JSON configuration objects. The only reason to use JS is to allow for comments and type hinting. Below are all the options that can be set in a configuration file.

- *string* **`fhirUrl`** - FHIR server base URL. Can be overridden by the `-f` or `--fhir-url` CLI parameter.
- *string* **`tokenUrl`** - The Bulk Data server token URL (use `"none"` for open servers and `""` to try to auto-detect it)
- *object* **`privateKey`** - The private key (as `JWK`) used to sign authentication tokens. This is not needed for open servers
- *string* **`clientId`** - This is not needed for open servers
- *number* **`accessTokenLifetime`** - The access token lifetime in seconds. Note that the authentication server may ignore or restrict this to its own boundaries
- *string* **`reporter`** - The default reporter is "cli". That works well in terminal and renders some fancy stuff like progress bars. However, this does not look good when your STDOUT ends up in log files. For example, if you are using this tool as part of some kind of pipeline and want to maintain clean logs, then consider changing this to "text". Can be overridden from terminal parameter `--reporter`.
  
  Running an export using the (default) `cli` reporter produces output looking like this:
  <img alt="bulk-data-client-cli" src="https://user-images.githubusercontent.com/1119082/134519314-01addd27-a086-4227-a5a2-0fc812b91512.png" width="578" />

  Running the same export using the `text` reporter produces output looking like this:
  <img alt="bulk-data-client-text" src="https://user-images.githubusercontent.com/1119082/134519352-7cfd2894-ad73-4fb7-ae2c-44bdbdc36236.png" width="713" />

- *string* **`_outputFormat`** - The value of the `_outputFormat` parameter for Bulk Data kick-off requests. Will be ignored if empty or falsy. Can be overridden from terminal parameter `-F` or `--_outputFormat`
- *string* **`_since`** - The value of the `_since` parameter for Bulk Data kick-off requests. Can also be partial date like "2002", "2020-03" etc. Can be anything that Moment can parse. Will be ignored if empty or falsy. See [https://momentjs.com/docs/#/parsing/](https://momentjs.com/docs/#/parsing/). Can be overridden from terminal parameter `-F` or `--_outputFormat`
- *string* **`_type`** -  The value of the `_type` parameter for Bulk Data kick-off requests. Will be ignored if empty or falsy. Can be overridden from terminal parameter `-t` or `--_type`
- *string* **`_elements`** - The value of the `_elements` parameter for Bulk Data kick-off requests. Will be ignored if empty or falsy. Can be overridden from terminal parameter `-e` or `--_elements`
- *string* **`patient`** -  The value of the `patient` parameter for Bulk Data kick-off requests. Will be ignored if empty or falsy. Can be overridden from terminal parameter `-p` or `--patient`
- *string* **`includeAssociatedData`** - The value of the `includeAssociatedData` parameter for Bulk Data kick-off requests. Will be ignored if empty or falsy. Can be overridden from terminal parameter `-i` or `--includeAssociatedData`
- *string* **`_typeFilter`** - The value of the `_typeFilter` parameter for Bulk Data kick-off requests. Will be ignored if empty or falsy. Can be overridden from terminal parameter `-q` or `--_typeFilter`
- *boolean* **`allowPartialManifests`** - When provided, a server with support for the parameter MAY return a portion of bulk data output files to a client prior to all output files being available and/or MAY distribute bulk data output files among multiple manifests and provide links for clients to page through the manifests.
- *string* **`organizeOutputBy`** - When provided, a server with support for the parameter SHALL organize the resources in output files by instances of the specified resource type, including a header for each resource of the type specified in the parameter, followed by the resource and resources in the output that contain references to that resource. When omitted, servers SHALL organize each output file with resources of only single type. A server unable to structure output by the requested organizeOutputBy resource SHOULD return an error and FHIR OperationOutcome resource. When a Prefer: handling=lenient header is included in the request, the server MAY process the request instead of returning an error.
- *boolean* **`global`** - By default this client will make patient-level exports. If this is set to true, it will make system-level exports instead. Ignored if `group` is set! Can be overridden from terminal parameter `--global`
- *string* **`group`** - Id of FHIR group to export. If set, the client will make group-level exports. Can be overridden from terminal parameter `-g` or `--group`
- *boolean* **`lenient`** - If `true`, adds `handling=lenient` to the `prefer` request header. This may enable a "retry" option after certain errors. It can also be used to signal the server to silently ignore unsupported parameters. Can be overridden from terminal parameter `--lenient`
- *object* **`requests`** - Custom options for every request, EXCLUDING the authorization request and any upload requests (in case we use remote destination). Many options are available so be careful what you specify here! See [https://github.com/sindresorhus/got/blob/main/documentation/2-options.md](https://github.com/sindresorhus/got/blob/main/documentation/2-options.md). Example:
    ```js
    requests: {
        https: {
            rejectUnauthorized: true // reject self-signed certs
        },
        timeout: 20000, // 20 seconds custom timeout
        headers: {
            "x-client-id": "whatever" // pass custom headers
        }
    }
    ```
- *number* **`parallelDownloads`** - How many downloads to run in parallel. This will speed up the download but can also overload the server. Don't be too greedy and don't set this to more than 10!
- *boolean* **`saveManifest`** - In some cases it might be useful to also save the export manifest file along with the downloaded NDJSON files.
- *number* **`ndjsonMaxLineLength`** - While parsing NDJSON files every single (non-empty) line is parsed as JSON. It is recommended to set a reasonable limit for the line length so that a huge line does not consume the entire memory. This is the maximal acceptable line length expressed as number characters.
- *boolean* **`ndjsonValidateFHIRResourceType`** - If `true`, verifies that every single JSON object extracted for the NDJSON file has a `resourceType` property, and that this property equals the expected `type` reported in the export manifest.
- *boolean* **`ndjsonValidateFHIRResourceCount`** - If the server reports the file `count` in the export manifest, verify that the number of resources found in the file matches the count reported by the server.
- *boolean* **`addDestinationToManifest`** - The original export manifest will have an `url` property for each file, containing the source location. It his is set to `true`, add a `destination` property to each file containing the path (relative to the manifest file) to the saved file. This is ONLY used if `saveManifest` is set to `true`.
- *boolean* **`forceStandardFileNames`** - Sometimes a server may use weird names for the exported files. For example, a HAPI server will use random numbers as file names. If this is set to `true` files will be renamed to match the standard naming convention - `{fileNumber}.{ResourceType}.ndjson`.
- *boolean | string[]* **`downloadAttachments`** - If this is set to `false`, external attachments found in `DocumentReference` resources will not be downloaded. The `DocumentReference` resources will still be downloaded but no further processing will be done. Can also be an array of white-listed mime types to filter out which attachments should be downloaded.
- *boolean* **`ignoreAttachmentDownloadErrors`** - If `true`, the client will try to download the attachments but it will ignore download errors (although those errors will still be logged).
- *number* **`inlineDocRefAttachmentsSmallerThan`** - In `DocumentReference` resources, any `attachment` elements having an `url` (instead of inline data) and a `size` below this number will be downloaded and put inline as base64 `data`. Then the `size` property will be updated and the `url` will be removed. **Ignored** if `downloadAttachments` is set to `false`!
    - To always disable this, set it to `0`
    - To always enable this, set it to `Infinity` (bad idea!)
    - To inline files smaller than 5 MB set it to `5 * 1024 * 1024` 

- *string[]* **`inlineDocRefAttachmentTypes`** - If an attachment can be inlined (based on its size and the value of the `inlineDocRefAttachmentsSmallerThan` option), then its mime type will be compared with this list. Only files of listed types will be inlined and the rest will be downloaded into "attachment" subfolder. Example: `["text/plain", "application/pdf"]`. **Ignored** if `downloadAttachments` is set to `false`!
- *boolean* **`pdfToText`** - If this is `true`, attachments of type PDF that are being inlined will first be converted to text and then inlined as base64. **Ignored** if `downloadAttachments` is set to `false`!
- *string* **`destination`** - Examples:
     - `s3://bucket-name/optional-subfolder/` - Upload to S3
     - `./downloads` - Save to local folder (relative to the config file)
     - `downloads` - Save to local folder (relative to the config file)
     - `/path/to/downloads` - Save to local folder (absolute path)
     - `file:///path/to/downloads` - Save to local folder (file url)
     - `http://destination.dev` - POST to http
     - `http://username:password@destination.dev` - POST to http with basic auth
     - `""` - do nothing
     - `"none"` - do nothing
     
     Can be overridden from terminal parameter `-d` or `--destination`
- *string* **`awsRegion`** - Example: `us-east-1`. Only used if `destination` points to S3. The AWS SDK will first look for this in the shared config file (`~/.aws/config`). Then the SDK will look for an `AWS_REGION` environment variable. Finally, you can override both of these if you set the `awsRegion` variable in your bulk-data client config file. 
- *string* **`awsAccessKeyId`** - Only used if `destination` points to S3. The AWS SDK will first look for this in the shared credentials file (`~/.aws/credentials`). You can override this if you set the `awsAccessKeyId` variable in your bulk-data client config file, but only if you also set the `awsSecretAccessKey`. 
- *string* **`awsSecretAccessKey`** - Only needed if `destination` points to S3. The AWS SDK will first look for this in the shared credentials file (`~/.aws/credentials`). You can override this if you set the `awsSecretAccessKey` variable in your bulk-data client config file, but only if you also set the `awsAccessKeyId`.
- *object* **`log`** - Optional logging options (see below)
- *boolean* **`log.enabled`** - Set this to false to disable logging. Optional (defaults to true).
- *string* **`log.file`** - Path to the log file. Absolute, or relative to process CWD. If not provided, the file will be called log.ndjson and will be stored in the downloads folder.
- *object* **`log.metadata`** - Key/value pairs to be added to every log entry. Can be used to add useful information (for example which site imported this data).
- *boolean* **`log.logStatusProgress`** - By default we don't log status progress events because they fill the logs with useless entries. Set this to true if you want the progress to be included in the logs.
- *number* **`retryAfterMSec`** - If the server does not provide `Retry-after` header use this number of milliseconds before checking the status again.
- *complex* **`logResponseHeaders`** - ResponseHeaders to include in error logs for debugging purposes.     
  - As for the complex type, valid values are `"all" | "none" | string | RegExp | (string | RegExp)[]`
  - When `"all"` is specified, all responseHeaders are returned. When `"none"` is specified, no responseHeaders are returned. Otherwise, log any responseHeaders matches against 1...* strings/regexp 
- *object* **`fileDownloadRetry`** - A subset of got retry configuration object, determining retry behavior when downloading files. 
  - For most scenarios, an object with only a `limit`: `number` property will be sufficient. This determines how many times a file download will be retried before failing. Each subsequent attempt will delay using an exponential backoff.
  - For more details on options, see [https://github.com/sindresorhus/got/blob/main/documentation/7-retry.md](https://github.com/sindresorhus/got/blob/main/documentation/7-retry.md).

### Environment Variables
There are two environment that can be passed to the client to modify it's behavior.
- `AUTO_RETRY_TRANSIENT_ERRORS` - Typically, if the server replies with an error as
  OperationOutcome having a **transient** code, the user is asked if (s)he wants to
  retry. However, if the client runs as part of some kind of automated pipeline (with
  no human interaction), the we don't want to ask question which no one could answer.
  `AUTO_RETRY_TRANSIENT_ERRORS` can be set to truthy or falsy value to pre-answer
  questions like these.
- `SHOW_ERRORS` - When an error is thrown, if it contains additional details the
  user is asked if (s)he wants to see those. Similarly to `AUTO_RETRY_TRANSIENT_ERRORS`,
  setting `SHOW_ERRORS` to boolean-like value will make it so that those error
  details are always shown or hidden and will avoid having to show question prompts.

Example of running in non-interactive mode:
```sh
AUTO_RETRY_TRANSIENT_ERRORS=1 SHOW_ERRORS=1 node . --config myConfigFile.js --reporter text
```

### CLI Parameters
Note that you can pass a `--help` parameter to see this listed in your terminal

| short | long             |description |
|-------|------------------|------------|
| `-f`  | `--fhir-url`     | FHIR server base URL. Must be set either as parameter or in the configuration file. |
| `-F`  | `--_outputFormat`| The output format you expect. |
| `-s`  | `--_since`       | Only include resources modified after this date |
| `-t`  | `--_type`        | Zero or more resource types to download. If omitted downloads everything.|
| `-e`  | `--_elements`    | Zero or more FHIR elements to include in the downloaded resources |
| `-p`  | `--patient`      | Zero or more patient IDs to be included. Implies `--post`|
| `-i`  | `--includeAssociatedData` | String of comma delimited values. When provided, server with support for the parameter and requested values SHALL return a pre-defined set of metadata associated with the request. |
| `-q`  | `--_typeFilter`  | Experimental _typeFilter parameter passed as is to the server |
|       | `--global`       | Global (system-level) export |
|       | `--post`         | Use POST kick-off requests |
| `-g`  | `--group`        | Group ID - only include resources that belong to this group. Ignored if --global is set |
|       | `--lenient`      | Sets a "Prefer: handling=lenient" request header to tell the server to ignore unsupported parameters |
| `-d`  | `--destination`  | Download destination. See config/defaults.js for examples |
|       | `--config`       | Relative path to config file |
|       | `--reporter`     | Reporter to use to render the output. "cli" renders fancy progress bars and tables. "text" is better for log files. Defaults to "cli" |
| `-c`  | `--custom`       | Custom parameters to be passed to the kick-off endpoint. Example: `-c a=1 b=c` |
|       | `--status`       | If a status request fails for some reason the client will exit. However, if the status endpoint is printed in the output, you can retry by passing it as `--status` option here |


Features
--------------------------------------------------
- [x] Patient-level export
- [x] System-level export
- [x] Group-level export
- [x] All Bulk Data v2 parameters
- [x] Token endpoint auto detection
- [x] Support multiple reporters
- [x] Parallel downloads
- [x] Save manifest
- [x] NDJSON line limit
- [x] NDJSON ResourceType validation
- [x] NDJSON count validation
- [x] Add destination to manifest
- [x] Force standard file names
- [x] Inline DocumentReference attachments
- [x] PDF to Text
- [x] Destination none
- [x] Destination S3
- [x] Destination file://
- [x] Destination directory path
- [x] Destination http
- [x] multiple config files
- [ ] tests (~64% coverage)
- [x] Custom kick-off params
- [x] Logging
