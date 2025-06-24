# Tefereth Scripts

A React Native mobile application for creating video storyboards from text content using AI-powered scene generation and image creation.

## 🚀 Features

- **Text-to-Storyboard**: Convert stories, scripts, or any text content into visual storyboards
- **AI Scene Generation**: Automatically break down text into scenes using AI
- **Image Generation**: Create visual representations for each scene
- **Multiple Visual Styles**: Choose from various artistic styles (Cinematic, Animated, Watercolor, etc.)
- **Document Upload**: Support for text files, markdown, and document formats
- **Cross-Platform**: Works on iOS, Android, and Web

## 📱 Screenshots

<!-- TODO: Add screenshots of the app -->
*Screenshots coming soon...*

## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- For iOS development: Xcode
- For Android development: Android Studio

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd teferenth-expo
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Assets are ready!**
   ```
   ✅ Placeholder assets included:
   - icon.svg (app icon placeholder)
   - splash.svg (splash screen placeholder)
   - adaptive-icon.svg (Android adaptive icon placeholder)
   - favicon.svg (web favicon placeholder)
   
   For mobile builds, convert SVG to PNG:
   - Open assets/convert-assets.html in browser
   - Convert and download PNG files
   ```

## 🚀 Running the App

### Development

```bash
# Start the development server
npm start
# or
yarn start

# Run on specific platforms
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

### Building for Production

```bash
# Build for production
expo build:ios
expo build:android
expo build:web
```

## 🏗️ Project Structure

```
├── App.tsx                 # Main app component
├── index.ts               # App entry point
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
├── lib/                   # Shared utilities
│   ├── ErrorBoundary.tsx  # Error handling
│   ├── store.ts           # State management (Zustand)
│   ├── theme.ts           # Theme configuration
│   └── toast.ts           # Toast notifications
├── screens/               # App screens
│   ├── HomeScreen.tsx     # Project library
│   ├── NewProjectScreen.tsx # Project creation
│   └── StoryboardScreen.tsx # Storyboard view
├── constants/             # App constants
└── assets/               # Static assets
```

## 🔧 Configuration

### Environment Variables

The app uses environment variables for configuration. Copy `.env.example` to `.env` and configure:

- `AI_API_BASE_URL`: Base URL for AI services
- `AI_API_KEY`: API key for AI services (if required)
- `MAX_FILE_SIZE_MB`: Maximum file upload size
- Feature flags and other settings

### API Configuration

<!-- TODO: Document API requirements and setup -->
The app currently uses external APIs for:
- AI text processing (`https://api.a0.dev/ai/llm`)
- Image generation (`https://api.a0.dev/assets/image`)

**Note**: These APIs may require authentication or have usage limits.

## 🧪 Testing

<!-- TODO: Add testing setup and instructions -->
```bash
# Run tests (when implemented)
npm test
# or
yarn test
```

## 📚 Technologies Used

- **React Native** - Mobile app framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Zustand** - State management
- **React Navigation** - Navigation
- **Expo Vector Icons** - Icons
- **AsyncStorage** - Local storage

## 🤝 Contributing

<!-- TODO: Add contribution guidelines -->
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (when testing is set up)
5. Submit a pull request

## 📋 TODO

See [TODO.md](./TODO.md) for a comprehensive list of planned improvements and known issues.

### High Priority
- [ ] Add missing asset files
- [ ] Implement environment variable configuration
- [ ] Add image caching
- [ ] Improve accessibility

### Medium Priority
- [ ] Add comprehensive testing
- [ ] Implement offline support
- [ ] Add user authentication
- [ ] Performance optimizations

## 🐛 Known Issues

- ~~Missing asset files~~ ✅ FIXED - Placeholder assets included
- ~~Hardcoded API endpoints~~ ✅ FIXED - Environment variables implemented
- ~~No image caching~~ ✅ FIXED - Image caching system implemented
- ~~Poor accessibility~~ ✅ FIXED - Accessibility labels added
- Limited error handling for network issues
- No offline support

## 📄 License

This project is licensed under the 0BSD License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

<!-- TODO: Add support information -->
For support, please:
1. Check the [TODO.md](./TODO.md) for known issues
2. Search existing issues in the repository
3. Create a new issue with detailed information

## 🔄 Changelog

<!-- TODO: Maintain changelog -->
### v1.0.0
- Initial release
- Basic storyboard generation
- AI-powered scene creation
- Multiple visual styles
- Cross-platform support

---

**Note**: This app is in active development. See [TODO.md](./TODO.md) for planned improvements and current limitations.