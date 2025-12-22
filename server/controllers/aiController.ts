import { Request, Response } from 'express';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// Extend Express Request type to include multer file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Initialize AI clients
const elevenLabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Convert speech to text using Eleven Labs
 */
export async function speechToText(req: Request, res: Response) {
  try {
    const multerReq = req as MulterRequest;
    
    console.log('📥 Received request:', {
      contentType: req.headers['content-type'],
      hasFile: !!multerReq.file,
      bodyKeys: Object.keys(req.body || {}),
    });
    
    if (!multerReq.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Read audio file as buffer
    const audioBuffer = fs.readFileSync(multerReq.file.path);

    // Create Blob from buffer
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/webm' });

    console.log('🎤 Converting speech to text...');

    // Use Eleven Labs SDK for STT
    const transcription = await elevenLabs.speechToText.convert({
      file: audioBlob,
      modelId: 'scribe_v1',
      languageCode: 'eng',
    });

    console.log('✅ Transcription:', transcription);

    // Clean up uploaded file
    fs.unlinkSync(multerReq.file.path);

    // Extract just the text from the transcription object
    const transcribedText = transcription.text || '';
    console.log('📝 Extracted text:', transcribedText);

    res.json({ text: transcribedText });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    
    const multerReq = req as MulterRequest;
    
    // Clean up uploaded file on error
    if (multerReq.file && fs.existsSync(multerReq.file.path)) {
      fs.unlinkSync(multerReq.file.path);
    }

    res.status(500).json({ 
      error: 'Failed to convert speech to text',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Process text with Gemini AI to detect intent and generate reply options
 */
export async function processIntent(req: Request, res: Response) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create a prompt for intent detection and reply generation
    const prompt = `You are helping a non-verbal person communicate during a phone call. 
The caller just said: "${text}"

Analyze the intent and provide 3-4 short, appropriate reply options (each 5-15 words max) that a non-verbal person could use to respond. 
The replies should be natural, polite, and contextually appropriate.

Format your response as a JSON array of strings, for example:
["Yes, I understand", "Could you please repeat that?", "I need a moment to think", "No, that doesn't work for me"]

Only output the JSON array, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    // Parse the JSON response
    let replies: string[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (jsonMatch) {
        replies = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines and clean
        replies = responseText
          .split('\n')
          .map(line => line.trim().replace(/^["\-\*\d]+\s*/, '').replace(/["]/g, ''))
          .filter(line => line.length > 0 && line.length < 100)
          .slice(0, 4);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Provide default fallback replies
      replies = [
        "Yes, I understand",
        "Could you please repeat that?",
        "Let me think about it",
        "I'm not sure about that"
      ];
    }

    // Ensure we have 3-4 options
    if (replies.length < 3) {
      replies = [
        "Yes, I understand",
        "Could you please repeat that?",
        "Let me think about it",
        ...replies
      ].slice(0, 4);
    }

    res.json({ 
      originalText: text,
      replies: replies.slice(0, 4)
    });
  } catch (error) {
    console.error('Intent processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Convert text to speech using Eleven Labs
 */
export async function textToSpeech(req: Request, res: Response) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log('🔊 Converting text to speech:', text);

    // Use Eleven Labs TTS with updated API and free tier model
    const audio = await elevenLabs.textToSpeech.convert(
      'JBFqnCBsd6RMkjVDRZzb', // George voice (free tier)
      {
        text: text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
      }
    );

    // Convert stream to buffer
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const audioBuffer = Buffer.concat(chunks);

    console.log('✅ TTS completed, buffer size:', audioBuffer.length);

    // Send audio as base64
    const audioBase64 = audioBuffer.toString('base64');

    res.json({ 
      audio: audioBase64,
      mimeType: 'audio/mpeg'
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({ 
      error: 'Failed to convert text to speech',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
