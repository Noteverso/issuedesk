# Quick Start Guide - Rich Text Editor

## 🎯 What You Can Do Now

With the new rich text editor, you can:
- ✍️ Format text with **bold**, *italic*, ~~strikethrough~~
- 📝 Create headings, lists, and quotes
- 🖼️ Upload images to cloud storage
- 📔 Write travel journals with photos
- 📚 Take formatted study notes
- 💡 Capture ideas with structure

## 🚀 Getting Started in 3 Steps

### Step 1: Configure Image Storage (Optional, but Recommended)

1. Open the app and go to **Settings** (⚙️ tab at bottom)
2. Tap **"Cloudflare R2 Configuration"**
3. Toggle **"Enable R2 Upload"** to ON
4. Enter your Cloudflare credentials:
   - Get these from [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 Object Storage
5. Tap **"Test Connection"** to verify it works
6. Tap **"Save Configuration"**

**Note:** Without R2, you can still use the editor! Images will just be embedded directly.

### Step 2: Start Writing

1. Go to **Issues** tab
2. Tap **+ Add Comment** or create a new issue
3. You'll see the **formatting toolbar** at the top of the text box

### Step 3: Use Formatting & Images

**Quick formatting:**
- Tap **B** to make text bold
- Tap **H1**, **H2**, **H3** for headings
- Tap **•** or **1.** for lists
- Tap **🖼️** to upload an image

**The editor automatically adds markdown syntax!**

## 📖 Common Use Cases

### Writing a Travel Journal

```markdown
# Day 1 in Tokyo 🗼

Today was **amazing**! Visited:
- Senso-ji Temple
- Shibuya Crossing
- Harajuku

The ramen was incredible:

![Delicious Ramen](https://your-r2.dev/ramen.jpg)

## Tomorrow's Plans
- [ ] Mount Fuji day trip
- [ ] Try conveyor belt sushi
```

**How to do it:**
1. Tap **H1** → Type "Day 1 in Tokyo 🗼"
2. Select "amazing" → Tap **B** → Now it's bold
3. Tap **•** → Type your list items
4. Tap **🖼️** → Select ramen photo → Uploads automatically
5. Tap **H2** → Type "Tomorrow's Plans"
6. Tap **☐** → Type your tasks

### Taking Study Notes

```markdown
## CS101 - Variables

A **variable** is a container for data.

### Types:
1. `int` - whole numbers
2. `float` - decimal numbers
3. `string` - text

### Example:
```
name = "Alice"
age = 25
```
```

**How to do it:**
1. Tap **H2** → Type your heading
2. Select "variable" → Tap **B** → Bold it
3. Tap **H3** for sub-heading
4. Tap **1.** for numbered list
5. Tap **`<  />`** for code formatting
6. Tap **`{  }`** for code blocks

### Capturing Quick Ideas

```markdown
💡 App Feature Idea

> Users should be able to filter by multiple labels

**Why it matters:**
- Faster issue discovery
- Better organization
- Enhanced UX

[Similar feature](https://github.com/example)
```

**How to do it:**
1. Type your title (no formatting needed)
2. Tap **"** → Type your quote
3. Tap **B** → Type bold heading
4. Tap **•** → List your reasons
5. Tap **🔗** → Add a link

## 🎨 Formatting Cheat Sheet

| What You Want | Button | Result |
|--------------|--------|--------|
| Bold text | B | **bold** |
| Italic text | I | *italic* |
| Strike through | S | ~~deleted~~ |
| Inline code | `</>` | `code` |
| Code block | `{  }` | Formatted code |
| Big heading | H1 | # Heading 1 |
| Medium heading | H2 | ## Heading 2 |
| Small heading | H3 | ### Heading 3 |
| Quote | " | > Quoted text |
| Bullet list | • | • List item |
| Numbered list | 1. | 1. List item |
| Task/checkbox | ☐ | - [ ] Task |
| Link | 🔗 | [Text](url) |
| Image | 🖼️ | ![Alt](url) |
| Divider line | ─ | Horizontal rule |

## 📸 Uploading Images

### First Time Setup

When you tap the **🖼️ button** for the first time:
1. iOS will ask: "Allow IssueDesk to access your photos?"
2. Tap **"Allow"**
3. Now you can select images

### Uploading an Image

1. Tap the **🖼️ image button** in the toolbar
2. Select a photo from your library
3. Wait for the upload indicator (1-3 seconds)
4. Image markdown is automatically inserted!

**Result:**
```markdown
![Photo description](https://your-bucket.r2.dev/image.jpg)
```

The image will display when you view the comment/issue.

## 💡 Pro Tips

### Tip 1: Select Text to Format It
Instead of adding markdown syntax, **select existing text** first:
1. Type "Hello World"
2. Select "Hello World"
3. Tap **B**
4. Becomes: **Hello World**

### Tip 2: Use Headers for Structure
Headers create visual hierarchy:
- Use **H1** for main titles
- Use **H2** for sections
- Use **H3** for sub-sections

### Tip 3: Combine Formatting
You can combine multiple formats:
```markdown
**_Bold and italic_**
~~**Bold strikethrough**~~
```

### Tip 4: Preview Your Content
After writing, tap "Submit" to see rendered markdown with:
- Formatted text
- Working links
- Displayed images
- Styled code blocks

### Tip 5: Edit Comments Later
Made a mistake? You can edit comments:
1. Tap **Edit** on your comment
2. The RichTextEditor appears again
3. Make changes
4. Tap **Save**

## 🔧 Troubleshooting

### Can't Upload Images

**Problem:** Image button doesn't work

**Solutions:**
1. Check if you granted photo permission
2. Go to iOS/Android Settings → IssueDesk → Allow Photos
3. If R2 is enabled, check your configuration
4. Try disabling R2 (images will embed instead)

### Formatting Looks Wrong

**Problem:** Bold/italic doesn't show

**Solution:** Make sure you're viewing the **submitted** comment/issue. The editor shows markdown syntax, but the view shows formatted text.

### R2 Upload Fails

**Problem:** "Upload failed" error

**Solutions:**
1. Go to Settings → Image Storage
2. Tap "Test Connection"
3. If it fails, check your credentials
4. Verify your bucket allows uploads
5. Check your internet connection

## 📱 Platform-Specific Notes

### iOS
- Uses native TextInput for best performance
- Photos permission required
- Keyboard dismisses automatically after submit

### Android
- Same great experience!
- Permission handling automatic
- Back button dismisses keyboard

### Web (Experimental)
- Works in browser via Expo web
- File upload instead of image picker
- All formatting features available

## 🎓 Learning Resources

Want to learn more about markdown?
- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)

## 📞 Need Help?

If you're stuck:
1. Check this guide
2. Check [RICH-TEXT-EDITOR.md](./RICH-TEXT-EDITOR.md) for detailed docs
3. Check [Troubleshooting](./RICH-TEXT-EDITOR.md#troubleshooting)
4. Open an issue on GitHub

## 🎉 Start Creating!

You're all set! Go create some beautiful content:
- ✍️ Write about your day
- 📸 Share photos from trips
- 📝 Take formatted notes
- 💭 Capture creative ideas

**Happy writing! 🚀**
