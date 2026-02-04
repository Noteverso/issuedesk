import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
  enabled: boolean;
}

const R2_CONFIG_KEY = '@issuedesk_r2_config';

/**
 * Get R2 configuration from AsyncStorage
 */
export async function getR2Config(): Promise<R2Config | null> {
  try {
    const configJson = await AsyncStorage.getItem(R2_CONFIG_KEY);
    if (!configJson) return null;
    return JSON.parse(configJson) as R2Config;
  } catch (error) {
    console.error('Failed to get R2 config:', error);
    return null;
  }
}

/**
 * Save R2 configuration to AsyncStorage
 */
export async function setR2Config(config: R2Config): Promise<void> {
  try {
    await AsyncStorage.setItem(R2_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save R2 config:', error);
    throw error;
  }
}

/**
 * Generate a unique key for the image using timestamp and random hash
 */
function generateImageKey(fileName: string): string {
  const timestamp = Date.now();
  const randomHash = Math.random().toString(36).substring(2, 10);
  const extension = fileName.match(/\.\w+$/)?.[0] || '.jpg';
  return `images/${timestamp}-${randomHash}${extension}`;
}

/**
 * Get content type from file extension
 */
function getContentType(fileName: string): string {
  const extension = fileName.match(/\.\w+$/)?.[0]?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
  };
  return mimeTypes[extension || ''] || 'image/jpeg';
}

/**
 * Create AWS Signature Version 4
 * Simplified implementation for R2 uploads
 */
async function createAwsSignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  payload: string,
  config: R2Config
): Promise<Record<string, string>> {
  // For simplicity, we'll use presigned URLs or implement basic auth
  // This is a placeholder - you may need to use a library like aws4fetch
  const authHeaders = {
    ...headers,
    'Authorization': `AWS ${config.accessKeyId}:${config.secretAccessKey}`,
  };
  return authHeaders;
}

/**
 * Upload image to Cloudflare R2
 * @param imageUri - Local file URI from ImagePicker
 * @param fileName - Original file name
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToR2(imageUri: string, fileName: string): Promise<string> {
  const config = await getR2Config();
  
  if (!config || !config.enabled) {
    throw new Error('R2 is not configured or not enabled');
  }

  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to binary for upload
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const key = generateImageKey(fileName);
    const contentType = getContentType(fileName);
    
    // R2 S3-compatible endpoint
    const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${config.bucketName}/${key}`;

    // Upload using fetch with AWS signature
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'x-amz-acl': 'public-read',
        'Cache-Control': 'public, max-age=31536000',
        // Note: For production, implement proper AWS Signature V4
        // This is a simplified version - you may need aws4fetch library
        'Authorization': `AWS ${config.accessKeyId}:${config.secretAccessKey}`,
      },
      body: bytes,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`R2 upload failed: ${response.status} - ${errorText}`);
    }

    // Construct public URL
    const publicUrl = config.publicUrl.endsWith('/') 
      ? config.publicUrl.slice(0, -1) 
      : config.publicUrl;
    const imageUrl = `${publicUrl}/${key}`;

    console.log('✅ Uploaded image to R2:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('❌ R2 upload error:', error);
    throw error;
  }
}

/**
 * Test R2 connection
 */
export async function testR2Connection(): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getR2Config();
    
    if (!config || !config.enabled) {
      return { success: false, message: 'R2 is not configured or not enabled' };
    }

    // Test by attempting a HEAD request to the bucket
    const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${config.bucketName}`;

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Authorization': `AWS ${config.accessKeyId}:${config.secretAccessKey}`,
      },
    });

    if (response.ok) {
      return { success: true, message: 'Connection successful' };
    } else {
      return { 
        success: false, 
        message: `Connection failed: ${response.status} ${response.statusText}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
