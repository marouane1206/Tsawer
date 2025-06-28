# 🎨 Background Remover App

AI-powered background removal application with React Native frontend and FastAPI backend.

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)

## 🚀 Quick Setup

### 1. Backend Setup

```bash
cd Backend
pip install -r requirements.txt
python main.py
```

Backend will run on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd Frontend
npm install --legacy-peer-deps
npx expo start
```

## 📱 Running the App

### Web
- Press `w` in the Expo terminal or visit `http://localhost:8081`

### Mobile
- Install Expo Go app on your device
- Scan the QR code from Expo terminal

## 🛠️ Features

- ✅ Upload images from gallery or camera
- ✅ AI-powered background removal
- ✅ Side-by-side comparison view
- ✅ Download processed images
- ✅ Cross-platform (Web, iOS, Android)

## 📁 Project Structure

```
Tsawer/
├── Backend/
│   ├── main.py              # FastAPI server
│   ├── requirements.txt     # Python dependencies
│   └── uploads/            # Processed images
└── Frontend/
    ├── app/
    │   └── (tabs)/
    │       └── index.tsx   # Main app component
    ├── config.ts           # API configuration
    └── package.json        # Node dependencies
```

## 🔧 Configuration

Edit `Frontend/config.ts` to change API endpoints:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  TIMEOUT: 30000,
};
```

## 🐛 Troubleshooting

- **Port conflicts**: Use `npx expo start --port 8082`
- **Backend connection**: Ensure backend runs on port 8000
- **Dependencies**: Use `--legacy-peer-deps` flag for npm install