import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { AppSettings } from '@issuedesk/shared';
import path from 'path';
import crypto from 'crypto';

type R2Config = NonNullable<AppSettings['r2Config']>;

export class R2Service {
  private client: S3Client | null = null;
  private config: R2Config | null = null;

  setConfig(config: R2Config) {
    this.config = config;
    if (config.enabled) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
    } else {
      this.client = null;
    }
  }

  async testConnection(): Promise<{ success: boolean; message?: string }> {
    if (!this.client || !this.config) {
      return { success: false, message: 'R2 not configured' };
    }

    try {
      const command = new HeadBucketCommand({ Bucket: this.config.bucketName });
      await this.client.send(command);
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      console.error('R2 connection test failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async uploadImage(buffer: Buffer, fileName: string, contentType: string): Promise<{
    success: boolean;
    message?: string;
    data?: {
      url: string;
      key: string;
      size: number;
    };
  }> {
    if (!this.client || !this.config) {
      return { success: false, message: 'R2 not configured' };
    }

    try {
      // Generate a unique key for the image
      const timestamp = Date.now();
      const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
      const extension = path.extname(fileName) || this.getExtensionFromMimeType(contentType);
      const key = `images/${timestamp}-${hash}${extension}`;

      // Upload to R2
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.config.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000', // 1 year cache
        },
      });

      await upload.done();

      // Construct the public URL
      const publicUrl = this.config.publicUrl.endsWith('/') 
        ? this.config.publicUrl.slice(0, -1) 
        : this.config.publicUrl;
      const url = `${publicUrl}/${key}`;

      console.log('🚀 Uploaded image to R2:', url);

      return {
        success: true,
        data: {
          url,
          key,
          size: buffer.length,
        },
      };
    } catch (error) {
      console.error('❌ Error uploading to R2:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
      'image/svg+xml': '.svg',
    };
    return mimeToExt[mimeType] || '.jpg';
  }

  isConfigured(): boolean {
    return this.config !== null && this.config.enabled && this.client !== null;
  }

  getConfig(): R2Config | null {
    return this.config;
  }
}

// Global instance
export const r2Service = new R2Service();