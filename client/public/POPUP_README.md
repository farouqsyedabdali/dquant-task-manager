# 🤖 AI Task Assistant Desktop Popup

A **256x256 desktop popup** for quick task creation and updates using AI. This complements your browser extension with a dedicated desktop tool.

## 🎯 Features

- **🖥️ Desktop Integration**: Small, always-on-top popup window
- **📋 Auto-Clipboard**: Automatically fills with your copied text
- **🤖 AI-Powered**: Same smart task extraction and matching as browser extension
- **⚡ Lightning Fast**: One-click task creation and updates
- **🔄 Seamless Integration**: Works with your existing task manager

## 🚀 Quick Start

### Method 1: Windows Batch File (Recommended for Windows)
1. **Double-click** `ai-task-assistant.bat`
2. A 256x256 popup window will open
3. Start using it immediately!

### Method 2: Node.js Launcher (Cross-Platform)
```bash
# In the client/public directory
node launcher.js
```

### Method 3: Direct Browser
1. Open your browser
2. Navigate to: `http://localhost:5173/popup.html`
3. Resize window to 256x256 (optional)

## 📋 How to Use

### Basic Workflow
1. **Copy any text** from emails, messages, documents, etc.
2. **Open the popup** (it auto-fills from clipboard)
3. **Choose an action**:
   - 🆕 **Create New Task** - AI extracts task details
   - 📝 **Update Existing Task** - AI matches to existing task
4. **Your task manager opens** with pre-filled data
5. **Review and save** in the main app

### Example Usage

**Email:** *"Hi John, can you finish the quarterly report by Friday? It's urgent for the board meeting."*

**Result:** 
- **Title:** "Finish quarterly report"
- **Description:** "Urgent quarterly report needed for board meeting by Friday"
- **Priority:** "URGENT"
- **Assignee:** "John" (if found in system)

## ⚙️ Setup & Installation

### Prerequisites
- Task Manager development server running (`npm run dev`)
- Chrome browser (recommended for best popup experience)
- Windows 10+ (for .bat file) or Node.js (for cross-platform)

### Windows Desktop Shortcut
1. **Right-click** on `ai-task-assistant.bat`
2. Select **"Create shortcut"**
3. **Drag shortcut** to your desktop
4. **Double-click** anytime to launch

### Custom Shortcut Icon (Optional)
1. Right-click the desktop shortcut → **Properties**
2. Click **"Change Icon"**
3. Use the included `icon.ico` or any icon you prefer

## 🔧 Configuration

### Window Settings
Edit the configuration in `launcher.js` or `ai-task-assistant.bat`:

```javascript
const POPUP_URL = 'http://localhost:5173/popup.html';
const WINDOW_WIDTH = 256;
const WINDOW_HEIGHT = 256;
```

### Authentication
The popup automatically shares authentication with your main task manager:
- **Login once** in the main app
- **Popup inherits** the session
- **Auto-refresh** when you login/logout

## 🎨 Customization

### Styling
Edit `popup.html` CSS to customize:
- Colors and themes
- Font sizes
- Button styles
- Layout

### Functionality
Modify `popup.html` JavaScript to add:
- Keyboard shortcuts
- Additional buttons
- Custom workflows
- Local storage preferences

## 🔍 Troubleshooting

### Common Issues

**❌ "Task Manager server is not running"**
```bash
cd client
npm run dev
```

**❌ "Not Logged In"**
1. Open main task manager: `http://localhost:5173`
2. Login to your account
3. Refresh the popup

**❌ Popup not the right size**
- Use Chrome for best results
- Try the Node.js launcher: `node launcher.js`

**❌ Clipboard not working**
- Grant clipboard permissions in browser
- Manually paste text instead

### Browser Compatibility
- ✅ **Chrome** - Full support, app mode
- ✅ **Edge** - Good support
- ⚠️ **Firefox** - Basic support, no app mode
- ⚠️ **Safari** - Limited support

## 🖱️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+V` | Paste into text area |
| `Ctrl+A` | Select all text |
| `Enter` | Create task (when text selected) |
| `Shift+Enter` | Update task (when text selected) |
| `Escape` | Clear text |

## 🔗 Integration with Browser Extension

The desktop popup **complements** your browser extension:

- **Browser Extension**: For highlighting text directly on web pages
- **Desktop Popup**: For working with copied text from any source

Both use the **same AI backend** and produce **identical results**.

## 🆕 Advanced Features

### Always on Top (Chrome)
The popup can stay on top of other windows for easy access throughout your workday.

### Multiple Instances
You can open multiple popups for different workflows:
```bash
node launcher.js  # Main popup
node launcher.js  # Second popup (if needed)
```

### Custom URL Parameters
Add parameters for specific behaviors:
```
http://localhost:5173/popup.html?theme=dark&size=large
```

## 🛠️ Development

### Adding New Features
1. Edit `popup.html` for UI changes
2. Modify the JavaScript for new functionality
3. Update `launcher.js` for window management
4. Test across different platforms

### API Integration
The popup uses the same endpoints as the main app:
- `POST /api/ai/extract-task` - Create tasks
- `POST /api/ai/identify-task-update` - Update tasks

## 📱 Future Enhancements

Planned features:
- **📱 Mobile version** for smartphones
- **🔔 Desktop notifications** for task updates
- **⌨️ Global hotkeys** for instant popup
- **📊 Quick stats** in popup header
- **🎨 Themes and customization** options

---

## 💡 Pro Tips

1. **Pin to taskbar** for one-click access
2. **Keep it open** all day for instant task capture
3. **Copy-paste workflow** becomes second nature
4. **Use with email** for automated task creation
5. **Team efficiency** - share the launcher with colleagues

**Happy task managing!** 🎉 