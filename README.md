<div align="center">
<img width="1200" height="475" alt="AccessiTwin Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# AccessiTwin

**AI-powered accessibility assistant that turns physical devices into guided digital twins for elderly and visually impaired users**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=google&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)

</div>

---

## Overview

AccessiTwin bridges the technology gap for seniors and people with visual or cognitive impairments. Point your camera at any physical device — a washing machine, medication bottle, elevator panel, or household appliance — and AccessiTwin uses Google Gemini AI to instantly analyze it, break down every button and control, and guide you through operating it step by step with voice narration.

The name reflects the core idea: creating an accessible **digital twin** of any real-world interface, simplified and explained in plain language.

---

## Features

### Photo Analysis Mode
- Upload or capture a photo of any physical device
- Gemini 2.5 Flash identifies the device, summarizes its purpose, and flags safety warnings
- Every control (button, knob, switch, display) is categorized and explained with step-by-step instructions
- Controls are color-coded by priority: **Primary**, **Secondary**, **Advanced**, and **Danger**

### Live Vision Mode
- Real-time camera stream with continuous AI analysis
- **Fast Mode (⚡)**: Quick safety-focused responses — ideal for navigation and obstacle avoidance
- **Intelligent Mode (🧠)**: Detailed descriptions for learning device operation or complex tasks
- Hold to speak; AI responds with live audio and on-screen captions
- Live OCR reads visible text (signs, labels, dates) automatically
- Real-time subtitles and object tracking reticle

### Accessibility-First Design
- **High-contrast themes**: Bright mode and Eye-Care (dark) mode
- **Text-to-speech**: Multilingual voice synthesis at a slower, comfortable rate
- **Large touch targets**: Oversized buttons optimized for elderly and motor-impaired users
- **Haptic feedback**: Vibration patterns confirm button presses
- **Multilingual**: English, Chinese (Simplified), and Spanish — AI responses adapt to selected language

### Device History
- Saves up to 5 recently analyzed devices with thumbnail photos (via localStorage)
- Quickly revisit past analyses without re-uploading

### AI Chat Assistant
- Ask follow-up questions about any analyzed device
- Powered by Gemini 2.0 Flash with context from the current device analysis
- Short, jargon-free answers tailored for non-technical users

---

## Requirements

- **Node.js** (v18 or later recommended)
- A **Google Gemini API key** — get one at [Google AI Studio](https://aistudio.google.com)
- A modern browser with camera/microphone access (for Live Vision Mode)

---

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Arxchibobo/AccessiTwin-Hepl-the-older.git
   cd AccessiTwin-Hepl-the-older
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your API key**

   Create a `.env.local` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`.

---

## Usage

### Analyzing a Device (Photo Mode)

1. Open the app and select your preferred language (English, Chinese, or Spanish).
2. Tap the camera/upload button and either take a photo or upload an existing image of a device.
3. AccessiTwin analyzes the image and displays:
   - Device name and one-line summary
   - Any safety warnings
   - A breakdown of all controls with step-by-step instructions
4. Tap any control card to expand its full instructions; the app reads them aloud automatically.
5. Use the chat button to ask follow-up questions about the device.

### Live Vision Mode

1. Tap the **Live** button to start the camera stream.
2. Choose **Fast Mode** for quick safety checks or **Intelligent Mode** for detailed guidance.
3. Hold the screen and speak to ask a question; release to send.
4. The AI responds with voice and on-screen captions in real time.

---

## Configuration

| Setting | Description | Default |
|---|---|---|
| Language | Interface and AI response language | English |
| Theme | Bright or Eye-Care (dark high-contrast) | Bright |
| Text-to-Speech | Toggle voice narration on/off | On |
| Live Mode Speed | Fast (⚡) or Intelligent (🧠) | Fast |

Settings are accessible via the toolbar in the app header.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.8 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS (CDN) |
| AI Models | Gemini 2.5 Flash (image analysis), Gemini 2.0 Flash (chat), Gemini 2.5 Flash Native Audio (live) |
| Speech | Web Speech API (TTS), MediaStream API (camera/mic) |
| Storage | localStorage (device history) |

---

## Project Structure

```
AccessiTwin-Hepl-the-older/
├── components/          # UI components (buttons, modals, panels, live assistant)
├── services/
│   └── geminiService.ts # Gemini API integration (image analysis, chat, live stream)
├── utils/
│   ├── speechUtils.ts   # Text-to-speech with multilingual voice selection
│   ├── audioUtils.ts    # PCM audio processing for Gemini Live API
│   ├── storage.ts       # Device history persistence
│   └── translations.ts  # EN / ZH / ES string translations
├── types.ts             # TypeScript interfaces and enums
├── App.tsx              # Root component and application state
├── index.tsx            # React entry point
└── vite.config.ts       # Build configuration
```

---

## Build for Production

```bash
npm run build
npm run preview
```

The production build outputs to the `dist/` folder.

---

## Intended Use Cases

AccessiTwin is designed to assist with everyday situations including:

- Operating household appliances (washers, microwaves, ovens)
- Reading medication labels and verifying dosages
- Navigating public spaces (elevators, escalators, ATMs)
- Identifying obstacles while walking
- Reading documents, bills, and signs
- Verifying food freshness and expiry dates
- Handling cash and counting currency

---

*Built with ❤️ by [Bobo Zhou (Arxchibobo)](https://github.com/Arxchibobo)*
