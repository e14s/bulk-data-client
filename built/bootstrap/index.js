"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBucket = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config = {
    bucket_name: 'fhir-bulk-data',
    aws_region: 'us-east-1'
};
// Define the policy
const bucketPolicy = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "PublicReadGetObject",
            Effect: "Allow",
            Principal: "*",
            Action: [
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            Resource: `arn:aws:s3:::${config.bucket_name}/*`,
        },
    ],
};
// Create an S3 client instance.
const s3Client = new client_s3_1.S3Client({ region: config.aws_region });
// --- Main Function to Add Policy ---
const addBucketPolicy = async () => {
    try {
        // Prepare the parameters for the PutBucketPolicyCommand
        const params = {
            Bucket: config.bucket_name,
            Policy: JSON.stringify(bucketPolicy),
        };
        console.log(`Attempting to add policy to bucket: ${config.bucket_name}`);
        // Create and send the command to add/update the bucket policy
        const command = new client_s3_1.PutBucketPolicyCommand(params);
        const response = await s3Client.send(command);
        console.log("Successfully added bucket policy.");
        console.log("Response:", response);
    }
    catch (error) {
        console.error("Error adding bucket policy:", error);
        // The error object often contains useful information like the request ID.
        if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
        }
    }
};
/**
 * Checks if the bucket with the current name has already existed in Amazon S3.
 * If the bucket exists, it returns a success message "Bucket already Exist".
  * @name checkBucket
  * @param {S3} s3
  * @returns {Promise<{success:boolean; message: string; data:string;}>}
*/
const checkBucket = async (s3, bucket) => {
    try {
        const res = await s3.headBucket({ Bucket: bucket }).promise();
        console.log("Bucket already Exist", res.$response.data);
        return { success: true, message: "Bucket already Exist", data: {} };
    }
    catch (error) {
        console.log("Error bucket don't exsit", error);
        return { success: false, message: "Error bucket don't exsit", data: error };
    }
};
/**
  * Creates a new bucket in Amazon S3 with the specified bucket name.
  * @name createBucket
  * @param {S3} s3
  * @returns {Promise<{success:boolean; message: string; data: string;}>}
*/
const createBucket = async (s3) => {
    const params = { Bucket: config.bucket_name,
        CreateBucketConfiguration: {
            // Set your region here
            LocationConstraint: config.aws_region
        }
    };
    try {
        const res = await s3.createBucket(params).promise();
        console.log("Bucket Created Successfull", res.Location);
        return { success: true, message: "Bucket Created Successfull", data: res.Location };
    }
    catch (error) {
        console.log("Error: Unable to create bucket \n", error);
        return { success: false, message: "Unable to create bucket", data: error };
    }
};
/**
  * Initializes the S3 bucket by checking if it exists and creating it if it does not.
  * This function is used to ensure that the bucket is ready for use before performing any operations
  * on it.
  * @name initBucket
  * @returns {void}
*/
const initBucket = async (s3) => {
    const bucketStatus = await checkBucket(s3, config.bucket_name);
    if (!bucketStatus.success) { // check if the bucket don't exist
        let bucket = await createBucket(s3); // create new bucket
        if (!bucket.success) {
            console.error("Error creating bucket:", bucket.message);
            return { success: false, message: "Error creating bucket", data: bucket.message };
        }
        console.log(bucket.message);
    }
};
exports.initBucket = initBucket;
exports.default = exports.initBucket;
