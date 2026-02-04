# iOS 26 Modern App Icon & UI Guide

## App Icon Design

### Icon Specifications (iOS 26)

**Required Sizes:**
- 1024x1024 - App Store
- 180x180 - iPhone (@3x)
- 120x120 - iPhone (@2x)
- 167x167 - iPad Pro (@2x)
- 152x152 - iPad (@2x)
- 76x76 - iPad (@1x)

### Design Concept

**Modern Minimalist Design:**
```
┌─────────────────────────┐
│                         │
│         ┌────┐          │
│         │ 📝 │          │  Primary: Issue/Document Icon
│         └────┘          │
│           │             │
│      ┌────┴────┐        │  Connection: Link to GitHub
│      │    ⚡   │        │  Speed: Fast workflow
│      └─────────┘        │
│                         │
└─────────────────────────┘
```

**Color Palette (iOS 26 Style):**
- Primary: `#0A84FF` (iOS Blue)
- Accent: `#5E5CE6` (iOS Purple)
- Gradient: `#0A84FF` → `#5E5CE6`
- Background: White/Dark adaptive

**Design Guidelines:**
1. **Simple & Clean**: Single focal point
2. **High Contrast**: Works on all backgrounds
3. **Recognizable**: Clear at small sizes
4. **No Text**: Icon only, no labels
5. **Rounded Corners**: iOS standard (22% radius)
6. **Adaptive**: Light & dark mode variants

### Icon Concept Options

#### Option 1: Issue Badge (Recommended)
```
Gradient background (#0A84FF → #5E5CE6)
White document with checkmark
Minimal shadow for depth
```

#### Option 2: Desk Stack
```
Stacked papers/issues
Blue accent color
Modern flat design
```

#### Option 3: GitHub Integration
```
Octocat-inspired
Issue tracker theme
Professional look
```

### Icon Creation Tools

**Recommended:**
1. **Figma** - Free, web-based
2. **Sketch** - Mac only, professional
3. **Adobe Illustrator** - Industry standard
4. **Affinity Designer** - One-time purchase

**Online Generators:**
- [App Icon Generator](https://appicon.co/)
- [Make App Icon](https://makeappicon.com/)
- [Icon Kitchen](https://icon.kitchen/)

### Icon Files Structure

```
apps/mobile/assets/
├── icon.png                    # 1024x1024 - Primary
├── adaptive-icon.png           # 1024x1024 - Android
├── splash-icon.png             # 1284x2778 - Launch screen
├── favicon.png                 # 192x192 - Web
└── app-store/
    ├── icon-1024.png          # App Store
    ├── icon-180.png           # iPhone @3x
    ├── icon-120.png           # iPhone @2x
    ├── icon-167.png           # iPad Pro
    └── icon-152.png           # iPad
```

## iOS 26 UI Adaptations

### 1. Dynamic Island Support

Update splash screen to accommodate Dynamic Island:

```json
{
  "splash": {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#0A84FF"
  }
}
```

### 2. Theme Adaptations

**Light Mode:**
- Background: `#FFFFFF`
- Surface: `#F2F2F7`
- Primary: `#0A84FF`
- Text: `#000000`

**Dark Mode:**
- Background: `#000000`
- Surface: `#1C1C1E`
- Primary: `#0A84FF`
- Text: `#FFFFFF`

### 3. Typography Updates

iOS 26 System Font Stack:
```typescript
{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display"',
  fontWeight: '400' | '500' | '600' | '700',
}
```

### 4. Corner Radius Standards

iOS 26 uses larger corner radii:
```typescript
borderRadius: {
  small: 8,     // Buttons, inputs
  medium: 12,   // Cards
  large: 16,    // Modals, sheets
  xlarge: 20,   // Full-screen cards
}
```

### 5. Shadow & Elevation

Modern iOS shadow styles:
```typescript
// Light elevation
boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)'

// Medium elevation
boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)'

// High elevation
boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.16)'
```

### 6. Interactive Elements

**Touch Targets:**
- Minimum: 44x44 points
- Recommended: 48x48 points
- Spacing: 8-12 points between elements

**Haptic Feedback:**
```typescript
import * as Haptics from 'expo-haptics';

// Light feedback for selections
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium for actions
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy for important events
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
```

### 7. Safe Area Handling

iOS 26 notch/Dynamic Island considerations:
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={{ flex: 1 }}>
  {/* Content automatically respects safe areas */}
</SafeAreaView>
```

### 8. Navigation Patterns

**Bottom Tab Bar:**
- Height: 49pt (83pt with safe area)
- Icon size: 24x24pt
- Label font: 10pt SF Pro Text

**Navigation Bar:**
- Height: 44pt (88pt with safe area)
- Title font: 17pt SF Pro Text Semibold
- Back button: 17pt SF Pro Text Regular

## Implementation Checklist

### Phase 1: Icon Assets
- [ ] Design 1024x1024 base icon
- [ ] Generate all required sizes
- [ ] Create adaptive icon for Android
- [ ] Design splash screen
- [ ] Add dark mode variants
- [ ] Replace placeholder assets

### Phase 2: Theme Updates
- [ ] Update color palette to iOS 26 standards
- [ ] Implement dynamic theme switching
- [ ] Update shadow styles
- [ ] Increase corner radii
- [ ] Adjust spacing & padding

### Phase 3: Typography
- [ ] Update font weights
- [ ] Adjust font sizes
- [ ] Improve line heights
- [ ] Enhance readability

### Phase 4: Interactive Elements
- [ ] Add haptic feedback
- [ ] Update touch targets
- [ ] Improve button states
- [ ] Enhance animations

### Phase 5: Safe Areas
- [ ] Wrap screens in SafeAreaView
- [ ] Handle notch/Dynamic Island
- [ ] Test on all device sizes
- [ ] Adjust bottom tab bar

## Quick Icon Generation Script

Create a simple SVG icon:

```svg
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A84FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#5E5CE6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1024" height="1024" rx="226" fill="url(#gradient)"/>
  
  <!-- Document Icon -->
  <rect x="312" y="256" width="400" height="512" rx="40" fill="white" opacity="0.95"/>
  
  <!-- Lines (text representation) -->
  <rect x="382" y="356" width="260" height="24" rx="12" fill="#0A84FF" opacity="0.6"/>
  <rect x="382" y="420" width="200" height="24" rx="12" fill="#0A84FF" opacity="0.4"/>
  <rect x="382" y="484" width="220" height="24" rx="12" fill="#0A84FF" opacity="0.4"/>
  
  <!-- Checkmark -->
  <circle cx="512" cy="640" r="60" fill="#34C759"/>
  <path d="M 480 640 L 500 660 L 544 616" stroke="white" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

Save as `icon.svg`, then convert to PNG at 1024x1024.

## Testing Checklist

### Visual Tests
- [ ] Icon visible in home screen
- [ ] Icon crisp at all sizes
- [ ] Dark mode looks good
- [ ] Splash screen smooth
- [ ] No clipping or distortion

### Device Tests
- [ ] iPhone 15 Pro Max (Dynamic Island)
- [ ] iPhone 15 (Dynamic Island)
- [ ] iPhone SE (Home button)
- [ ] iPad Pro 12.9"
- [ ] iPad Air

### Accessibility
- [ ] High contrast mode
- [ ] Reduce transparency
- [ ] Increase contrast
- [ ] Bold text
- [ ] Larger text sizes

## Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [iOS 26 Design Resources](https://developer.apple.com/design/resources/)
- [SF Symbols](https://developer.apple.com/sf-symbols/)
- [App Icon Template](https://applypixels.com/template/app-icon/)

## Color Picker

iOS 26 System Colors:
```typescript
const iOS26Colors = {
  blue: '#0A84FF',
  purple: '#5E5CE6',
  pink: '#FF2D55',
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  green: '#34C759',
  teal: '#5AC8FA',
  indigo: '#5856D6',
  gray: '#8E8E93',
};
```

## Final Notes

1. **Keep it Simple**: iOS values minimalism
2. **Test Everywhere**: All devices, all modes
3. **Use Guidelines**: Follow Apple HIG strictly
4. **Be Consistent**: Match iOS system patterns
5. **Iterate**: Get feedback, refine design

---

**Status:** Documentation complete. Icon assets need to be created using design tools.
