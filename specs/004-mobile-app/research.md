# Research: IssueDesk Mobile App

**Feature**: 004-mobile-app  
**Date**: 2026-02-01  
**Status**: Complete

## Research Topics

### 1. React Native Markdown Rendering

**Question**: Which library to use for rendering GitHub-flavored markdown in React Native?

**Decision**: `react-native-markdown-display`

**Rationale**:
- Lightweight and actively maintained
- Supports GFM (code blocks, tables, task lists)
- Customizable styles to match GitHub appearance
- Works well with Expo (no native module linking required in managed workflow)

**Alternatives Considered**:
- `react-native-render-html`: More general-purpose, heavier, overkill for markdown
- `react-native-webview` with marked.js: Adds webview overhead, less native feel
- Custom parser: Too much effort for MVP

---

### 2. Secure Storage for Tokens

**Question**: How to securely store access tokens on mobile?

**Decision**: `expo-secure-store`

**Rationale**:
- Expo SDK built-in, no additional dependencies
- Uses iOS Keychain and Android Keystore under the hood
- Simple async API matching desktop's secure storage pattern
- Works in Expo managed workflow

**Alternatives Considered**:
- `react-native-keychain`: Requires native module, complicates Expo workflow
- AsyncStorage: Not encrypted, unsuitable for tokens
- MMKV: Fast but not encrypted by default

---

### 3. Navigation Library

**Question**: Which navigation solution for React Native?

**Decision**: `@react-navigation/native` with `@react-navigation/bottom-tabs` and `@react-navigation/native-stack`

**Rationale**:
- De facto standard for React Native navigation
- Expo-compatible out of the box
- Supports bottom tabs (main navigation) and stack navigation (detail screens)
- TypeScript support with type-safe navigation

**Alternatives Considered**:
- Expo Router: File-based routing, newer but less mature, more opinionated
- React Native Navigation (Wix): Native performance but complex setup

---

### 4. State Management

**Question**: How to manage global state (auth, repository, issues)?

**Decision**: React Context + custom hooks (same pattern as desktop)

**Rationale**:
- No additional dependencies
- Matches desktop app architecture
- Simple enough for MVP scope (single repository, no complex caching)
- Easy to upgrade to Zustand/Redux later if needed

**Alternatives Considered**:
- Redux Toolkit: Overkill for MVP scope
- Zustand: Good option but adds dependency
- Jotai/Recoil: Atomic state, different pattern from desktop

---

### 5. HTTP Client for API Calls

**Question**: How to make HTTP requests to GitHub API and auth backend?

**Decision**: Reuse `@issuedesk/github-api` package with fetch polyfill

**Rationale**:
- Code reuse with desktop
- Types and error handling already implemented
- React Native supports fetch natively
- Need to verify package compatibility with React Native bundler

**Alternatives Considered**:
- axios: Additional dependency
- ky: Modern but additional dependency
- Rewrite API client: Defeats purpose of shared packages

**Compatibility Check Required**: Ensure @issuedesk/github-api builds correctly for React Native (no Node.js-specific APIs)

---

### 6. Deep Linking for OAuth

**Question**: How to handle device flow authorization redirect?

**Decision**: `expo-linking` + `expo-web-browser`

**Rationale**:
- Expo built-in modules
- `expo-web-browser` opens in-app browser for GitHub authorization
- `expo-linking` handles URL scheme for any callbacks
- Device flow doesn't require redirect back to app (polling-based)

**Alternatives Considered**:
- Native WebView: More complex, less secure for OAuth
- External browser only: Works but less polished UX

---

### 7. Theme System

**Question**: How to implement light/dark theme support?

**Decision**: React Context with `useColorScheme` hook + StyleSheet

**Rationale**:
- Native system theme detection via React Native
- Simple theme context matching desktop pattern
- No CSS-in-JS (follows constitution)
- StyleSheet.create for static styles, dynamic styles via theme context

**Alternatives Considered**:
- styled-components/emotion: Prohibited by constitution
- NativeBase/Tamagui: Heavy UI libraries, overkill
- React Native Paper: Material Design focused, not GitHub-like

---

### 8. Pull-to-Refresh and List Performance

**Question**: How to implement efficient scrolling lists with pull-to-refresh?

**Decision**: `FlatList` with built-in `refreshControl`

**Rationale**:
- React Native built-in, optimized for mobile
- Supports pull-to-refresh via RefreshControl prop
- Virtualized rendering for large lists (1000+ items)
- No additional dependencies

**Alternatives Considered**:
- ScrollView: No virtualization, poor performance for large lists
- react-native-largelist: Additional dependency
- FlashList (Shopify): Better performance but additional dependency

---

### 9. Clipboard for Device Code

**Question**: How to copy device code to clipboard?

**Decision**: `expo-clipboard`

**Rationale**:
- Expo SDK built-in
- Simple async API
- Works on iOS and Android
- No native module configuration

**Alternatives Considered**:
- react-native-clipboard: Requires linking
- Custom native module: Unnecessary effort

---

### 10. Error Handling and Toast Notifications

**Question**: How to display error messages and success feedback?

**Decision**: Custom toast component with React Context

**Rationale**:
- Lightweight, no dependencies
- Matches desktop pattern (can reuse message types from @issuedesk/shared)
- Full control over styling to match GitHub UI

**Alternatives Considered**:
- react-native-toast-message: Additional dependency
- Native alerts: Less customizable, breaks immersion
- react-native-paper snackbars: Part of heavy UI library

---

## Dependency Summary

### Expo SDK Built-ins (No additional install)
- expo-secure-store
- expo-clipboard
- expo-linking
- expo-web-browser

### Additional Dependencies Required
- @react-navigation/native
- @react-navigation/native-stack
- @react-navigation/bottom-tabs
- react-native-screens (peer dep of navigation)
- react-native-safe-area-context (peer dep)
- react-native-markdown-display

### Shared Packages (Already exist)
- @issuedesk/shared
- @issuedesk/github-api (needs React Native compatibility verification)

---

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| Markdown rendering library | react-native-markdown-display |
| Secure token storage | expo-secure-store |
| Navigation framework | @react-navigation |
| State management | React Context + hooks |
| Theme implementation | useColorScheme + StyleSheet |
| API client | Reuse @issuedesk/github-api |

---

## Next Steps

1. Verify @issuedesk/github-api React Native compatibility
2. Set up navigation structure
3. Implement AuthContext with device flow
4. Build core screens (Issues, Detail, Create)
