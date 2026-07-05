import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

type UploadStartupDocumentOptions = {
  file: File | null;
  folder?: string;
  publicIdPrefix?: string;
};

function assertCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary credentials are required for document uploads.");
  }
}

async function fileToBuffer(file: File) {
  return Buffer.from(await file.arrayBuffer());
}

export async function uploadStartupDocument({
  file,
  folder = "9jafounders/startup-verification",
  publicIdPrefix,
}: UploadStartupDocumentOptions) {
  if (!file || file.size === 0) {
    return null;
  }

  assertCloudinaryConfig();

  const buffer = await fileToBuffer(file);

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicIdPrefix,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload did not return a result."));
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
}
