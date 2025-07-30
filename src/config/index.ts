import * as dotenv from 'dotenv';
dotenv.config();
/**
* Config file
*/
export const config: { 
  bucket_name: string,
  aws_region: string 
} = {
  bucket_name: process.env.BUCKET_NAME ?? 'fhir-bulk-data',
  aws_region: process.env.AWS_REGION ?? 'us-east-1'
}

// Debug purpose: Log the environment variables
console.log("Environment value for Bucket Name:", process.env.BUCKET_NAME);
console.log("Environment value for AWS Region:", process.env.AWS_REGION);