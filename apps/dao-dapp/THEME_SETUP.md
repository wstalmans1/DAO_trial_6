# Theme Setup

The frontend supports both automatic system theme detection and manual theme switching.

## How It Works

### 1. **Theme Modes**
- **System** (default) - Automatically follows OS/browser preference
- **Light** - Force light mode
- **Dark** - Force dark mode

### 2. **Theme Toggle Switch**
- Click the theme button in the header to cycle through modes
- Cycles: System → Light → Dark → System
- Your preference is saved in localStorage
- Shows current mode with icon and label

### 3. **CSS Variables**
- Defined in `src/index.css` using HSL color values
- Light and dark mode colors are defined separately
- Smooth transitions between themes
- Uses `data-theme` attribute for manual overrides

### 4. **RainbowKit Integration**
- RainbowKit wallet connector automatically switches themes
- Uses `darkTheme()` and `lightTheme()` from RainbowKit
- Syncs with current theme mode in real-time

### 5. **React Context**
- `ThemeProvider` manages theme state
- `useTheme()` hook provides theme control
- Persists preference in localStorage
- Listens for system theme changes when in "system" mode

## Features

✅ **Manual Toggle** - Click to switch between System/Light/Dark
✅ **Automatic Detection** - System mode follows OS/browser preference
✅ **Persistent Preference** - Saves your choice in localStorage
✅ **Real-time Updates** - Changes instantly when toggled
✅ **Smooth Transitions** - CSS transitions for theme switching
✅ **RainbowKit Compatible** - Wallet UI matches current theme
✅ **Accessible** - Proper ARIA labels and semantic HTML

## Testing

1. **On macOS/Linux:**
   - System Preferences → Appearance → Dark Mode
   - The app will automatically switch themes

2. **On Windows:**
   - Settings → Personalization → Colors → Choose your mode
   - The app will automatically switch themes

3. **In Browser:**
   - Chrome/Edge: Settings → Appearance → Theme
   - Firefox: Settings → General → Language and Appearance → Theme

## Customization

To customize colors, edit the CSS variables in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;  /* Light mode background */
  --foreground: 222.2 84% 4.9%;  /* Light mode text */
  /* ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 222.2 84% 4.9%;  /* Dark mode background */
    --foreground: 210 40% 98%;  /* Dark mode text */
    /* ... */
  }
}
```

## Usage

### Using the Toggle Switch
1. Click the theme button in the header (next to the wallet connect button)
2. The button cycles through: **System** → **Light** → **Dark** → **System**
3. The icon changes to show the current mode:
   - 🖥️ System (monitor icon)
   - ☀️ Light (sun icon)
   - 🌙 Dark (moon icon)
4. Your preference is automatically saved

### System Mode
- When set to "System", the app follows your OS/browser theme
- Automatically updates when you change your system theme
- Perfect for users who want automatic theme switching

### Manual Modes
- **Light**: Always shows light theme
- **Dark**: Always shows dark theme
- Overrides system preference

## Files Created/Modified

**New Files:**
- `src/contexts/ThemeContext.tsx` - Theme state management with React Context
- `src/components/ThemeToggle.tsx` - Theme toggle button component

**Modified Files:**
- `src/index.css` - Added CSS variables with `data-theme` support
- `src/main.tsx` - Integrated ThemeProvider and updated RainbowKit theme sync
- `src/App.tsx` - Added ThemeToggle component and theme attribute management
- `index.html` - Added color-scheme meta tag

