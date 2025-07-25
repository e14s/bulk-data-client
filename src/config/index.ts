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