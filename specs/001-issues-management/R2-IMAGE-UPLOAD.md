# Cloudflare R2 Image Upload Integration

## Overview

This document describes the Cloudflare R2 cloud storage integration for image uploads in the IssueDesk application. Images uploaded through the markdown editor are now stored in Cloudflare R2 (when configured) instead of being embedded as data URLs.

## Features

- ✅ **Cloud Storage**: Images are uploaded to Cloudflare R2 for reliable, scalable storage
- ✅ **Fallback Support**: Automatically falls back to data URLs if R2 is not configured or upload fails
- ✅ **Settings UI**: Easy-to-use configuration interface in the Settings page
- ✅ **Connection Testing**: Test R2 configuration before saving
- ✅ **Drag-and-Drop**: Full support for both toolbar button uploads and drag-and-drop
- ✅ **Custom Domains**: Support for both R2.dev public URLs and custom domains

## Architecture

### Backend Components

#### 1. R2 Service (`apps/desktop/src/main/services/r2.ts`)
- **Purpose**: Handles all R2 cloud storage operations
- **Key Methods**:
  - `setConfig()`: Configure R2 credentials and bucket information
  - `testConnection()`: Verify R2 configuration with a test upload
  - `uploadImage()`: Upload image buffer to R2 with automatic hashing and deduplication
- **Dependencies**: AWS SDK S3 Client (compatible with Cloudflare R2)

#### 2. Settings Manager (`apps/desktop/src/main/settings/manager.ts`)
- **Purpose**: Persist R2 configuration using electron-store
- **Key Methods**:
  - `setR2Config()`: Save R2 configuration
  - `getR2Config()`: Retrieve R2 configuration
- **Storage**: Encrypted settings stored locally

#### 3. IPC Handlers (`apps/desktop/src/main/ipc/settings.ts`)
- **Handlers**:
  - `settings:setR2Config`: Save R2 configuration
  - `settings:getR2Config`: Retrieve R2 configuration
  - `settings:testR2Connection`: Test R2 connection and credentials
  - `settings:uploadToR2`: Upload image to R2

### Frontend Components

#### 1. Settings Page (`apps/desktop/src/renderer/pages/Settings.tsx`)
- **UI Features**:
  - Enable/disable R2 uploads toggle
  - Configuration form with fields:
    - Account ID
    - Access Key ID
    - Secret Access Key
    - Bucket Name
    - Public URL (custom domain or R2.dev URL)
  - Connection test button with status feedback
  - Auto-save on form submission

#### 2. Markdown Editor (`apps/desktop/src/renderer/components/markdown/MarkdownEditor.tsx`)
- **Upload Methods**:
  - Toolbar button upload
  - Drag-and-drop upload
- **R2 Integration**:
  - Checks if R2 is configured and enabled
  - Uploads to R2 when available
  - Falls back to data URLs on error or when R2 is disabled
  - Inserts public URL into markdown

### Type Definitions

#### R2Config Interface (`packages/shared/src/types/settings.ts`)
```typescript
export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string; // Custom domain or R2.dev public URL
  enabled: boolean;
}
```

#### IPC Contract Types (`packages/shared/src/types/ipc.ts`)
```typescript
export interface R2UploadRequest {
  buffer: number[];
  fileName: string;
  contentType: string;
}

export interface R2UploadResponse {
  url: string;
}

export interface R2ConfigRequest {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
  enabled: boolean;
}

export interface R2TestConnectionResponse {
  success: boolean;
  message: string;
}
```

## Configuration Steps

### 1. Get Cloudflare R2 Credentials

1. Log in to Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Create a new bucket or use an existing one
4. Generate API credentials:
   - Go to "Manage R2 API Tokens"
   - Create a new API token with read and write permissions
   - Save the **Access Key ID** and **Secret Access Key**
5. Note your **Account ID** (found in the R2 dashboard)
6. Set up public access:
   - Enable public access on your bucket, or
   - Configure a custom domain

### 2. Configure in IssueDesk

1. Open IssueDesk Settings page
2. Scroll to "Cloudflare R2 图片存储" section
3. Check "启用 R2 图片上传"
4. Fill in the configuration:
   - **Account ID**: Your Cloudflare account ID
   - **Access Key ID**: R2 API token access key
   - **Secret Access Key**: R2 API token secret key
   - **Bucket Name**: Your R2 bucket name
   - **Public URL**: Your custom domain or R2.dev public URL
5. Click "测试连接" to verify configuration
6. Click "保存设置" to save

### 3. Upload Images

**Method 1: Toolbar Button**
1. Click the image icon in the markdown editor toolbar
2. Select an image file
3. Image uploads to R2 and URL is inserted into markdown

**Method 2: Drag-and-Drop**
1. Drag an image file into the markdown editor
2. Drop the file
3. Image uploads to R2 and URL is inserted into markdown

## Image Upload Flow

```
User uploads image
       ↓
┌──────────────────┐
│ MarkdownEditor   │
│ - handleImage    │
│   Upload()       │
└──────┬───────────┘
       ↓
  Check R2 enabled?
       ↓
    Yes │ No
        ↓  ↓
┌───────────┐  ┌──────────────┐
│ Upload    │  │ Use Data URL │
│ to R2     │  └──────────────┘
└─────┬─────┘
      ↓
┌──────────────────┐
│ settings:        │
│ uploadToR2       │
│ (IPC Handler)    │
└──────┬───────────┘
       ↓
┌──────────────────┐
│ R2Service        │
│ - uploadImage()  │
│ - Hash filename  │
│ - Upload buffer  │
└──────┬───────────┘
       ↓
┌──────────────────┐
│ Cloudflare R2    │
│ S3-compatible    │
│ API              │
└──────┬───────────┘
       ↓
   Return public URL
       ↓
┌──────────────────┐
│ Insert into      │
│ markdown:        │
│ ![name](url)     │
└──────────────────┘
```

## File Naming

Images are stored in R2 with SHA-256 hash-based filenames to:
- Prevent naming conflicts
- Enable automatic deduplication
- Preserve file extensions

Format: `{hash}.{extension}`
Example: `a3f5e8c9d2b1f7e4c6a8d9e1f2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1.jpg`

## Error Handling

The system includes multiple levels of error handling:

1. **Configuration Validation**: Settings UI validates required fields
2. **Connection Testing**: Test button verifies credentials before saving
3. **Upload Fallback**: Automatically falls back to data URLs on R2 errors
4. **User Feedback**: Clear error messages in UI

## Security

- ✅ Credentials stored using electron-store (encrypted)
- ✅ IPC handlers validate input
- ✅ No credentials exposed to renderer process
- ✅ AWS SDK handles secure S3 communication

## Performance

- **Deduplication**: Hash-based filenames prevent duplicate storage
- **Async Upload**: Non-blocking upload with loading states
- **Fallback Speed**: Instant fallback to data URLs on error

## Future Enhancements

Potential improvements for future releases:

- [ ] Image compression before upload
- [ ] Progress indicators for large uploads
- [ ] Batch upload support
- [ ] Image gallery/manager
- [ ] Usage statistics and quota monitoring
- [ ] Multiple cloud storage providers (S3, Azure Blob, etc.)
- [ ] Image optimization (resize, format conversion)

## Troubleshooting

### Connection Test Fails

**Problem**: "Connection test failed" message

**Solutions**:
1. Verify Account ID is correct
2. Check API credentials are active
3. Ensure bucket exists and has proper permissions
4. Confirm public access is configured

### Images Not Uploading

**Problem**: Images insert as data URLs instead of R2 URLs

**Solutions**:
1. Ensure R2 is enabled in settings
2. Test connection to verify configuration
3. Check browser console for error messages
4. Verify bucket has write permissions

### Public URLs Not Working

**Problem**: Image URLs return 404 or access denied

**Solutions**:
1. Enable public access on R2 bucket
2. Configure custom domain correctly
3. Verify Public URL in settings matches actual access URL
4. Check bucket CORS settings if using custom domain

## Development Notes

### Testing

```bash
# Build shared packages
npm run build:packages

# Run development server
npm run dev:desktop
```

### Type Safety

All R2-related operations use TypeScript with full type safety:
- Zod schemas for runtime validation
- TypeScript interfaces for compile-time checking
- IPC contract types for cross-process communication

### Dependencies

```json
{
  "@aws-sdk/client-s3": "^3.x",
  "@aws-sdk/lib-storage": "^3.x",
  "electron-store": "^8.x"
}
```

## Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Electron Store](https://github.com/sindresorhus/electron-store)
