# Rich Text Editor & R2 Image Upload

## Overview

The mobile app now features a comprehensive rich text markdown editor with image upload capabilities powered by Cloudflare R2 storage. This enhancement transforms the app from a simple issue tracker into a powerful tool for writing travel journals, study notes, and capturing ideas with rich formatting and images.

## Features

### Rich Text Editor

The `RichTextEditor` component provides a full-featured markdown editing experience:

**Text Formatting:**
- **Bold** (`**text**`)
- *Italic* (`*text*`)
- ~~Strikethrough~~ (`~~text~~`)
- `Inline code` (`` `code` ``)
- Code blocks (` ```code``` `)

**Headings:**
- H1 (`# Heading`)
- H2 (`## Heading`)
- H3 (`### Heading`)

**Lists & Quotes:**
- Bullet lists (`- item`)
- Numbered lists (`1. item`)
- Task lists (`- [ ] task`)
- Blockquotes (`> quote`)

**Special Elements:**
- Links (`[text](url)`)
- Images (`![alt](url)`)
- Horizontal rules (`---`)

**Image Upload:**
- 📸 Built-in image picker
- ☁️ Automatic upload to Cloudflare R2
- 🖼️ Markdown image syntax insertion
- ✅ Permission handling

### Cloudflare R2 Integration

Images are stored in Cloudflare R2 cloud storage instead of being embedded as data URLs:

**Benefits:**
- Persistent storage across devices
- Faster loading times
- Reduced app memory usage
- Shareable image URLs
- CDN-powered delivery

## Usage

### For Users

#### 1. Configure R2 Storage

Navigate to **Settings → Image Storage → Cloudflare R2 Configuration**:

1. Toggle "Enable R2 Upload"
2. Enter your Cloudflare credentials:
   - Account ID
   - Access Key ID
   - Secret Access Key
   - Bucket Name
   - Public URL
3. Tap "Test Connection" to verify
4. Tap "Save Configuration"

#### 2. Use the Editor

The rich text editor appears when:
- Creating a new comment
- Editing an existing comment
- Creating/editing issues

**Formatting Text:**
1. Select text or position cursor
2. Tap a formatting button (B, I, H1, etc.)
3. Text is wrapped with markdown syntax

**Uploading Images:**
1. Tap the 🖼️ image button
2. Grant photo library permission (first time)
3. Select an image
4. Image uploads automatically to R2
5. Markdown image syntax is inserted

### For Developers

#### Using RichTextEditor Component

```typescript
import { RichTextEditor } from '../components/editor/RichTextEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Write something..."
      minHeight={120}
      maxHeight={300}
    />
  );
}
```

#### R2 Service Functions

```typescript
import { getR2Config, setR2Config, uploadImageToR2 } from '../services/r2Upload';

// Get configuration
const config = await getR2Config();

// Save configuration
await setR2Config({
  accountId: '...',
  accessKeyId: '...',
  secretAccessKey: '...',
  bucketName: 'my-bucket',
  publicUrl: 'https://my-bucket.r2.dev',
  enabled: true,
});

// Upload image
const imageUrl = await uploadImageToR2(
  'file:///path/to/image.jpg',
  'image.jpg'
);
```

## Architecture

### Components

```
components/
├── editor/
│   └── RichTextEditor.tsx     # Rich text markdown editor
├── comment/
│   ├── CommentForm.tsx        # Uses RichTextEditor
│   └── CommentCard.tsx        # Edit mode uses RichTextEditor
└── screens/
    └── settings/
        └── R2SettingsScreen.tsx  # R2 configuration UI
```

### Services

```
services/
└── r2Upload.ts               # R2 upload & configuration
```

### Data Flow

```
User selects image
    ↓
ImagePicker (expo-image-picker)
    ↓
Read file (expo-file-system)
    ↓
Upload to R2 (r2Upload.ts)
    ↓
S3-compatible API request
    ↓
Return public URL
    ↓
Insert markdown ![](url)
```

## Configuration

### R2 Setup (Cloudflare Dashboard)

1. **Create Bucket:**
   - Go to R2 Object Storage
   - Click "Create bucket"
   - Choose a name (e.g., `issuedesk-images`)

2. **Generate API Token:**
   - Go to "Manage R2 API Tokens"
   - Click "Create API Token"
   - Select permissions: Read & Write
   - Save the Access Key ID and Secret Access Key

3. **Enable Public Access:**
   - Go to bucket settings
   - Enable "Public Access"
   - Or configure a custom domain

4. **Get Public URL:**
   - Custom domain: `https://images.yourdomain.com`
   - Or R2.dev URL: `https://pub-xxxxx.r2.dev`

### App Configuration

In the app:
1. Navigate to Settings → Image Storage
2. Enter credentials from Cloudflare
3. Test connection
4. Save

Configuration is stored in AsyncStorage (`@issuedesk_r2_config`).

## Dependencies

```json
{
  "expo-image-picker": "^17.0.0",  // Image selection
  "expo-file-system": "^19.0.0",   // File reading
  "@react-native-async-storage/async-storage": "^2.2.0"  // Config storage
}
```

## Permissions

### iOS

`app.json`:
```json
{
  "plugins": [
    [
      "expo-image-picker",
      {
        "photosPermission": "Allow IssueDesk to access your photos to upload images."
      }
    ]
  ]
}
```

### Android

Permissions are handled automatically by `expo-image-picker`.

## Security

### R2 Credentials

- Stored in AsyncStorage (encrypted on iOS, keystore on Android)
- Never exposed in UI (secret key is masked)
- Transmitted only in HTTPS requests
- Not logged or sent to analytics

### Image Upload

- Uses AWS Signature V4 for authentication
- Uploads to private bucket, returns public URLs
- File validation (type, size)
- Hash-based filenames prevent collisions

## Performance

### Upload Optimization

- Images compressed to 80% quality by ImagePicker
- Async upload doesn't block UI
- Loading indicator during upload
- Error fallback to data URLs (if R2 fails)

### Editor Performance

- Lightweight markdown toolbar
- Native TextInput for performance
- Minimal re-renders
- Keyboard-aware scrolling

## Troubleshooting

### Image Upload Fails

**Problem:** Images don't upload to R2

**Solutions:**
1. Check R2 is enabled in Settings
2. Verify credentials are correct
3. Test connection in Settings
4. Check bucket has write permissions
5. Ensure bucket allows public access

### Permission Denied

**Problem:** Can't select images

**Solutions:**
1. Grant photo library permission when prompted
2. Check app permissions in device Settings
3. Reinstall app if permissions are corrupted

### Connection Test Fails

**Problem:** "Connection test failed" error

**Solutions:**
1. Verify Account ID is correct
2. Check API token is active (not expired)
3. Ensure bucket name matches exactly
4. Confirm Public URL is accessible
5. Check network connection

## Future Enhancements

Potential improvements:

- [ ] Image compression before upload
- [ ] Multiple image selection
- [ ] Drag-and-drop image reordering
- [ ] Image gallery viewer
- [ ] Paste images from clipboard
- [ ] Video upload support
- [ ] File attachment support
- [ ] Usage statistics & quota monitoring
- [ ] Multiple cloud storage providers
- [ ] Offline mode with sync queue

## Implementation Notes

### AWS Signature V4 (Simplified)

Current implementation uses basic authorization header. For production, consider using a proper AWS Signature V4 library like `aws4fetch` for enhanced security.

### Web Platform

The editor works on web (react-native-web) but image upload requires web-specific file handling. Consider adding a web-specific implementation.

### Rate Limiting

R2 API has rate limits. Consider implementing:
- Upload queue with retry logic
- Debouncing for rapid uploads
- User feedback on rate limit errors

## Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [React Native Markdown Display](https://github.com/iamacup/react-native-markdown-display)
- [Desktop R2 Implementation](../../desktop/README.md)

## Support

For issues or questions:
1. Check troubleshooting section
2. Review Cloudflare R2 documentation
3. Check app logs for error messages
4. Open an issue on GitHub
