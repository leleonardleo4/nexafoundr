import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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

async function fileToBuffer(file: File) {
  return Buffer.from(await file.arrayBuffer());
}

async function uploadToLocalStorage(
  file: File,
  folder: string,
  publicIdPrefix?: string,
) {
  const buffer = await fileToBuffer(file);
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-") || "upload";
  const fileExtension = path.extname(safeFileName);
  const baseName = path.basename(safeFileName, fileExtension);
  const safePrefix = publicIdPrefix?.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  const finalFileName = [
    safePrefix || "document",
    baseName,
    randomUUID(),
  ]
    .filter(Boolean)
    .join("-");
  const storedFileName = `${finalFileName}${fileExtension}`;
  const folderSegments = folder.split("/").filter(Boolean);
  const localDir = path.join(process.cwd(), "public", "uploads", ...folderSegments);
  const publicPath = `/uploads/${folderSegments.join("/")}/${storedFileName}`;

  await mkdir(localDir, { recursive: true });
  await writeFile(path.join(localDir, storedFileName), buffer);

  return {
    secure_url: publicPath,
    public_id: `${folder}/${storedFileName}`,
  } as UploadApiResponse;
}

export async function uploadStartupDocument({
  file,
  folder = "nexafoundr/startup-verification",
  publicIdPrefix,
}: UploadStartupDocumentOptions) {
  if (!file || file.size === 0) {
    return null;
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return uploadToLocalStorage(file, folder, publicIdPrefix);
  }

  const buffer = await fileToBuffer(file);

  try {
    return await new Promise<UploadApiResponse>((resolve, reject) => {
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
  } catch {
    return uploadToLocalStorage(file, folder, publicIdPrefix);
  }
}
