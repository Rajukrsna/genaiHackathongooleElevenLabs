# 🎙️ Call Assistant Setup Instructions

## 1. Get API Keys

### Eleven Labs API Key
1. Go to https://elevenlabs.io/
2. Sign up or log in
3. Go to Profile > API Keys
4. Copy your API key

### Google Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy your API key

## 2. Add API Keys to .env

Create or edit the `.env` file in the project root:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

## 3. Install Dependencies (Already Done)

```bash
npm install
```

## 4. Run the Application

```bash
npm run dev
```

## 5. How to Use

1. Open the app in your browser (usually http://localhost:5173)
2. Navigate to the Call page
3. Click "Accept Call" to start the simulation
4. Click "Start Listening" button
5. **Speak into your microphone** (simulate the caller)
6. Click "Stop & Process" when done speaking
7. Wait for AI to process and show reply options
8. Click one of the reply buttons
9. Hear the TTS response play back

## 🎯 Features Implemented

✅ Speech-to-Text (Eleven Labs)
✅ AI Intent Detection (Google Gemini)
✅ Reply Generation (3-4 options)
✅ Text-to-Speech (Eleven Labs)
✅ Full audio recording and playback
✅ Real-time UI updates with loading states

## 🐛 Troubleshooting

- **No microphone access**: Check browser permissions
- **API errors**: Verify API keys in .env file
- **No audio recording**: Make sure you allow microphone access when prompted
- **TTS not playing**: Check browser audio permissions and volume

## 📝 Notes

- This is a simulation - you speak into the mic to simulate the caller
- The app records your speech, processes it, and gives you reply options
- When you select a reply, it plays back via TTS
- For production, this would integrate with actual phone call systems
