import formidable from "formidable";
import fs from "fs";

export let uploadDir = "uploads";
fs.mkdirSync(uploadDir, { recursive: true });
export let counter = 0;
export const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFiles: 1,
    maxFileSize: 200 * 1024 ** 2, // the default limit is 200KB
    filter: (part) =>
        part.mimetype?.startsWith("image/") ||
        false,
    filename: (originalName, originalExt, part, form) => {
        counter++
        let fieldName = part.name
        let timestamp = new Date().toJSON().slice(0, 10)
        let ext = part.mimetype?.split('/').pop()
        return `${fieldName}-${timestamp}-${counter}.${ext}`
    }
});