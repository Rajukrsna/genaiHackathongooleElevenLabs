# 🎙️ AI Call Assistant for Non-Verbal Users

An accessibility-focused web application that helps non-verbal individuals participate in phone calls using AI-powered speech recognition, intent detection, and text-to-speech technology.

## 🌟 Features

- **Real-time Speech Recognition**: Converts caller's speech to text using Eleven Labs STT
- **AI Intent Detection**: Uses Google Gemini AI to analyze conversation context
- **Smart Reply Suggestions**: Generates 3-4 contextually appropriate response options
- **Natural Voice Responses**: Converts selected replies to natural-sounding speech using Eleven Labs TTS
- **Intuitive UI**: Clean, accessible interface optimized for quick decision-making
- **Real-time Processing**: Live updates with loading states and feedback

## 🎯 How It Works

1. **Call Simulation**: User accepts an incoming call in the app
2. **Listen Mode**: Click "Start Listening" to record the caller's speech
3. **AI Processing**: Speech is converted to text and analyzed by Gemini AI
4. **Smart Replies**: AI generates 3-4 appropriate response options
5. **Voice Response**: User selects a reply, which is spoken back via TTS
6. **Continuous Flow**: Process repeats for natural conversation

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Web Audio API** for audio recording

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Eleven Labs API** for STT and TTS
- **Google Gemini AI** for intent detection
- **Multer** for file uploads

## 📋 Prerequisites

- Node.js 18+ and npm
- Microphone access (for speech recording)
- Browser with Web Audio API support (Chrome, Firefox, Edge)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd aiproject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get API Keys**

   **Eleven Labs:**
   - Visit https://elevenlabs.io/
   - Sign up and go to Profile > API Keys
   - Copy your API key

   **Google Gemini:**
   - Visit https://makersuite.google.com/app/apikey
   - Sign in and create an API key
   - Copy your API key

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   
   Navigate to `http://localhost:5173` in your browser

## 📱 Usage Guide

### Starting a Call Simulation

1. Navigate to the Call page in the app
2. Click **"Accept Call"** to begin
3. Read the on-screen instructions

### Recording Caller Speech

1. Click **"Start Listening"** button (blue)
2. **Speak into your microphone** to simulate the caller
3. Click **"Stop & Process"** (red) when finished

### Selecting a Reply

1. Wait for AI to generate reply options (3-4 buttons)
2. Read each option carefully
3. Click the most appropriate response
4. The selected reply will be spoken via TTS

### Regenerating Replies

- Click the **"Regenerate"** button if you want different reply options
- The AI will generate new suggestions based on the same caller speech

## 🏗️ Project Structure

```
aiproject/
├── src/
│   ├── components/
│   │   ├── call/          # Call-specific components
│   │   └── ui/            # Reusable UI components
│   ├── hooks/
│   │   ├── useAudioRecorder.ts    # Audio recording logic
│   │   └── use-toast.ts           # Toast notifications
│   ├── lib/
│   │   └── api/
│   │       └── callService.ts     # API client for call features
│   ├── pages/
│   │   └── CallPage.tsx           # Main call interface
│   └── types/                      # TypeScript type definitions
├── server/
│   ├── controllers/
│   │   └── aiController.ts        # AI processing endpoints
│   ├── routes.ts                   # API routes
│   └── index.ts                    # Express server
├── uploads/                        # Temporary audio files (gitignored)
└── .env                            # Environment variables (gitignored)
```

## 🔧 API Endpoints

### POST `/api/call/speech-to-text`
Converts audio to text using Eleven Labs
- **Input**: Audio file (multipart/form-data)
- **Output**: `{ text: string }`

### POST `/api/call/process-intent`
Analyzes text and generates reply options
- **Input**: `{ text: string }`
- **Output**: `{ originalText: string, replies: string[] }`

### POST `/api/call/text-to-speech`
Converts text to speech audio
- **Input**: `{ text: string }`
- **Output**: `{ audio: base64string, mimeType: string }`

## 🎨 UI Components

- **CallerID**: Displays caller information and call controls
- **ListeningIndicator**: Shows recording status
- **PauseButton**: Controls recording with visual feedback
- **IntentDetection**: Displays AI-generated reply options
- **IncomingCard**: Shows transcribed caller speech
- **TextInputBox**: Manual text input fallback

## 🐛 Troubleshooting

### Microphone Issues
- Check browser permissions for microphone access
- Ensure microphone is not being used by another application
- Try refreshing the page and allowing permissions again

### API Errors
- Verify API keys are correctly added to `.env` file
- Check that you have available credits/quota on Eleven Labs and Google AI
- Check browser console for detailed error messages

### No Audio Playback
- Check browser audio permissions
- Ensure volume is not muted
- Try a different browser (Chrome recommended)

### Processing Takes Too Long
- Eleven Labs API can take 2-5 seconds for STT
- Gemini AI typically responds in 1-3 seconds
- Network speed affects processing time

## 🔐 Security Notes

- API keys are stored in `.env` (never commit this file)
- Uploaded audio files are automatically deleted after processing
- No conversation data is permanently stored
- CORS is configured for local development only

## 🚧 Future Enhancements

- [ ] Integration with real phone call systems (Twilio, WebRTC)
- [ ] Multi-language support
- [ ] Custom voice selection
- [ ] Conversation history
- [ ] Offline mode with local models
- [ ] Mobile app (React Native)
- [ ] Real-time transcription display
- [ ] Custom response templates
- [ ] User profiles and preferences

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ for accessibility and inclusion**
