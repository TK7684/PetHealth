// Handle image uploads directly to S3 from frontend
export async function handleImageUpload(request, env) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Generate signed URL for S3 upload
  const signedUrl = await generateS3SignedUrl(env, file.name, file.type);

  return new Response(
    JSON.stringify({
      uploadUrl: signedUrl,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

async function generateS3SignedUrl(env, filename, contentType) {
  // Generate presigned URL for S3 upload
  const aws = require("aws-sdk");
  const s3 = new aws.S3({
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    region: env.S3_REGION,
    signatureVersion: "v4",
  });

  const params = {
    Bucket: env.S3_BUCKET,
    Key: `uploads/${Date.now()}-${filename}`,
    Expires: 60,
    ContentType: contentType,
  };

  return s3.getSignedUrl("putObject", params);
}
