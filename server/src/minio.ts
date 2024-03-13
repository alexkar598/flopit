import { Client } from "minio";
import { createHash } from "node:crypto";

export const minioClient = new Client({
  endPoint: process.env.S3_ENDPOINT!,
  port: parseInt(process.env.S3_PORT ?? "9000"),
  useSSL: process.env.S3_SSL === "true",
  accessKey: process.env.S3_ACCESS_KEY!,
  secretKey: process.env.S3_SECRET_KEY!,
  region: process.env.S3_REGION!,
});

export async function minioUploadBuffer(
  content: Buffer,
  bucket = "images",
): Promise<string> {
  const hash = createHash("sha1");
  hash.write(content);

  const objectName = hash.digest("hex");

  await minioClient.putObject(bucket, objectName, content);

  return objectName;
}
