import { Client } from "minio";
import { createHash } from "node:crypto";
import { memo } from "./util.ts";

export const minioClient = memo(
  () =>
    new Client({
      endPoint: process.env.S3_ENDPOINT!,
      port: parseInt(process.env.S3_PORT ?? "9000"),
      useSSL: process.env.S3_SSL === "true",
      accessKey: process.env.S3_ACCESS_KEY!,
      secretKey: process.env.S3_SECRET_KEY!,
      region: process.env.S3_REGION!,
    }),
);

export async function minioUploadFile(
  file: Blob,
  bucket = "images",
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const hash = createHash("sha1");
  hash.write(buffer);

  const objectName = hash.digest("hex");

  await minioClient().putObject(bucket, objectName, buffer);

  return objectName;
}

export async function minioUploadFileNullableHelper(
  file: Blob | null | undefined,
  bucket: string | undefined = undefined,
) {
  return file != null ? await minioUploadFile(file, bucket) : file;
}
