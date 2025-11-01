# Image Upload Feature Test

This document tests the new image upload functionality in the MarkdownEditor component.

## Features Implemented

### 1. Toolbar Image Upload Button
- Added an image upload button to the editor toolbar
- Shows uploading state with spinner animation
- Uses GitHub-style image icon

### 2. File Selection Dialog
- Native file dialog for selecting images
- Filters to image files only (jpg, png, gif, bmp, webp)
- Converts selected images to data URLs for immediate preview

### 3. Drag and Drop Support  
- Drag and drop images directly into the editor content area
- Visual overlay shows when dragging images over the editor
- Supports multiple image files at once
- Works with files from system file explorer

### 4. Image Insertion
- **Edit Mode**: Inserts images directly into TipTap editor using Image extension
- **Code Mode**: Inserts markdown image syntax with data URL
- Images show immediately without needing external hosting

## Technical Implementation

### Backend (IPC)
- `system:selectImage` - Opens native file dialog for image selection
- `system:imageToDataUrl` - Converts image file to base64 data URL
- Secure file handling through Electron's main process

### Frontend (React/TipTap)
- TipTap Image extension for WYSIWYG image support
- Drag and drop event handlers with visual feedback
- File type validation and error handling
- Loading states and user feedback

### GitHub Integration Ready
- GitHub API client includes `uploadImage()` method (placeholder)
- `createImageDataUrl()` method for immediate preview
- Can be extended to upload to GitHub repositories when authenticated

## Usage Instructions

1. **Using Toolbar Button**: 
   - Click the image icon in the editor toolbar
   - Select image file from the dialog
   - Image appears in the editor immediately

2. **Using Drag and Drop**:
   - Drag image file(s) from file explorer
   - Drop onto the editor content area
   - Images are inserted at cursor position

3. **Supported Formats**:
   - PNG, JPG/JPEG, GIF, BMP, WebP
   - Data URLs are generated for immediate display
   - No external hosting required

## Test Cases

To test this feature:

1. Open the IssueDesk desktop app
2. Navigate to create/edit an issue or comment
3. Try uploading an image using the toolbar button
4. Try drag-and-drop with images from the file system
5. Switch between Edit and Code modes to verify markdown generation
6. Test with different image formats and sizes

The images will be embedded as data URLs, allowing for immediate preview without requiring external image hosting services.