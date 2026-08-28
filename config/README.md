# Bulk Data Client Config

## Config Files for Server Connection and Download Configuration

In order make it workable, make sure you configure AWS config settings in your running environment for FHIR Bulk Account.

![AWS Account](account.png)

Never commit real credentials to this repository. Obtain temporary credentials
from your AWS access portal and set them only in your local environment:

```sh
export AWS_ACCESS_KEY_ID="<your-access-key-id>"
export AWS_SECRET_ACCESS_KEY="<your-secret-access-key>"
export AWS_SESSION_TOKEN="<your-session-token>"
```

In order to override the default value of Bucket name and region, you can set the environment variable.
The default value for Bucket is 'fhir-bulk-data' and region is 'us-east-1'

```sh
export BUCKET_NAME="your_bucket_name"
export AWS_REGION="aws_region"
``` 

### 1. BCDA Server Config
This configuration will upload files to S3 bucket in BCDA folder.

BCDA Credential Link for Sandbox: https://bcda.cms.gov/api-documentation/get-a-bearer-token.html#sandbox-credentials

File Server URL: https://sandbox.bcda.cms.gov/api/v2/

Authentication URL: https://sandbox.bcda.cms.gov/auth/token

Client ID: Needs to be added from BCDA credential website

Client Secrets: Needs to be added from BCDA credential website

```sh
export CLIENT_ID="<client-id-from-bcda-credential-website>"
export CLIENT_SECRETS="<client-secret-from-bcda-credential-website>"
```

For running Bulk client to upload files in AWS S3 bucket use the following CLI command
```sh
node . --config config/bcda-config.js --reporter text
```

### 2. Bulk Data Server Config
This configuration will upload files to S3 bucket in FHIR folder.

File Server URL: https://bulk-data.smarthealthit.org/

For running Bulk client to upload files in AWS S3 bucket use the following CLI command
```sh
node . --config config/fhir-config.js --reporter text
```

### AWS Bucket location for both Bulk data client and BCDA:

![S3 Bucket](s3.png)
