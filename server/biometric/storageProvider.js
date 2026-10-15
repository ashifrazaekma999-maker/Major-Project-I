import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class FileStorageProvider {
  async saveFile(filename, buffer, mimeType) {
    throw new Error('Not implemented');
  }

  async getFile(filePath) {
    throw new Error('Not implemented');
  }

  validateFile(filename, buffer, mimeType) {
    throw new Error('Not implemented');
  }
}

export class LocalFileStorageProvider extends FileStorageProvider {
  constructor(options = {}) {
    super();
    this.uploadDir = options.uploadDir || path.resolve(process.cwd(), 'data/uploads/biometric');
    this.datasetDir = options.datasetDir || path.resolve(process.cwd(), 'data/NETRISH_Biometric_Test_Dataset');
    this.allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    this.allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    this.maxSizeBytes = options.maxSizeBytes || 5 * 1024 * 1024; // 5 MB

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  validateFile(filename, buffer, mimeType) {
    if (!filename || typeof filename !== 'string') {
      return { valid: false, error: 'Filename is required' };
    }

    const ext = path.extname(filename).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported file extension '${ext}'. Allowed extensions: ${this.allowedExtensions.join(', ')}`
      };
    }

    if (mimeType && !this.allowedMimeTypes.includes(mimeType.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported MIME type '${mimeType}'. Allowed MIME types: ${this.allowedMimeTypes.join(', ')}`
      };
    }

    if (buffer !== undefined && buffer !== null) {
      if (buffer.length === 0) {
        return { valid: false, error: 'File content cannot be empty' };
      }
      if (buffer.length > this.maxSizeBytes) {
        return {
          valid: false,
          error: `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum limit of 5 MB`
        };
      }
    }

    return { valid: true };
  }

  async saveFile(filename, buffer, mimeType) {
    const validation = this.validateFile(filename, buffer, mimeType);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const ext = path.extname(filename).toLowerCase();
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
    const sanitizedBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storedFilename = `${Date.now()}_${sanitizedBase}_${hash}${ext}`;
    const targetPath = path.join(this.uploadDir, storedFilename);

    await fs.promises.writeFile(targetPath, buffer);

    return {
      storedFilename,
      targetPath,
      relativePath: `uploads/biometric/${storedFilename}`,
      fileSize: buffer.length,
      mimeType: mimeType || 'image/png',
      hash
    };
  }

  async getFile(filePath) {
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(this.uploadDir) && !resolvedPath.startsWith(this.datasetDir)) {
      throw new Error('Access denied: File is outside permitted storage boundaries.');
    }

    if (!fs.existsSync(resolvedPath)) {
      return null;
    }

    const buffer = await fs.promises.readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    const mimeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp'
    };

    return {
      buffer,
      mimeType: mimeMap[ext] || 'application/octet-stream',
      size: buffer.length
    };
  }

  getDatasetFilePath(relativeDatasetPath) {
    const sanitized = relativeDatasetPath.replace(/\\/g, '/').replace(/^\/+/, '');
    const fullPath = path.join(this.datasetDir, sanitized);
    if (!path.resolve(fullPath).startsWith(this.datasetDir)) {
      throw new Error('Path traversal attempt detected.');
    }
    return fullPath;
  }
}
