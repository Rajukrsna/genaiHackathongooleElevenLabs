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

console.log('🚀 AI Controller initialized');
console.log('🔑 ElevenLabs API Key present:', !!process.env.ELEVENLABS_API_KEY);
console.log('🔑 Gemini API Key present:', !!process.env.GEMINI_API_KEY);

/**
 * Generate repair prompts based on communication failure type
 * These are dynamic, AI-generated prompts that vary each time
 */
async function generateRepairPrompts(failureType: string, originalText: string): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  let promptContext = '';
  
  switch (failureType) {
    case 'no_speech':
      promptContext = 'The system detected silence or no clear speech. Generate 2 polite repair prompts asking the caller to speak up or repeat. Make them sound natural and varied, not scripted.';
      break;
    case 'noise':
      promptContext = 'The system detected heavy background noise. Generate 2 polite repair prompts asking the caller to move to a quieter location or reduce background noise. Make them conversational and empathetic.';
      break;
    case 'gibberish':
    case 'multiple_voices':
      promptContext = 'The system detected multiple overlapping voices or unclear speech. Generate 2 polite repair prompts asking the caller to speak one at a time or more clearly. Make them friendly and understanding.';
      break;
    default:
      promptContext = 'The system had trouble understanding. Generate 2 polite repair prompts asking for clarification.';
  }

  const prompt = `You are helping a non-verbal person handle communication issues during a phone call.
  
Scenario: ${promptContext}
Original unclear input: "${originalText}"

Generate 2 natural, conversational repair prompts (10-20 words each) that vary slightly in tone and phrasing. 
These should sound human and empathetic, NOT like pre-recorded messages.
One should be more direct, one more apologetic.

Format as a JSON array:
["prompt1", "prompt2"]

Only output the JSON array.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\[.*\]/s);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error generating repair prompts:', error);
  }

  // Fallback repair prompts with variety
  const fallbackPrompts: Record<string, string[]> = {
    no_speech: [
      "I'm sorry, I couldn't hear you. Could you please speak a bit louder?",
      "Hello? I'm having trouble hearing you right now. Can you try again?"
    ],
    noise: [
      "There's quite a bit of background noise. Could you move to a quieter spot?",
      "I'm having difficulty hearing you clearly due to the noise around you. Is there a quieter place you could speak from?"
    ],
    gibberish: [
      "I didn't quite catch that. Could you please speak one sentence at a time?",
      "I'm having trouble understanding. Could you speak a bit more slowly and clearly?"
    ],
    multiple_voices: [
      "I'm hearing multiple voices. Could one person speak at a time, please?",
      "It sounds like there are several people talking. Could you speak individually, please?"
    ]
  };

  return fallbackPrompts[failureType] || fallbackPrompts.no_speech;
}

/**
 * Convert speech to text using Eleven Labs
 */
export async function speechToText(req: Request, res: Response) {
  console.log('🎤 [STT] Starting speech-to-text conversion');

  try {
    const multerReq = req as MulterRequest;

    console.log('📥 [STT] Received request:', {
      contentType: req.headers['content-type'],
      hasFile: !!multerReq.file,
      bodyKeys: Object.keys(req.body || {}),
      fileDetails: multerReq.file ? {
        originalname: multerReq.file.originalname,
        mimetype: multerReq.file.mimetype,
        size: multerReq.file.size,
        path: multerReq.file.path
      } : null
    });

    if (!multerReq.file) {
      console.log('❌ [STT] No audio file provided');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('📂 [STT] Reading audio file from:', multerReq.file.path);

    // Read audio file as buffer
    const audioBuffer = fs.readFileSync(multerReq.file.path);
    console.log('📊 [STT] Audio buffer size:', audioBuffer.length, 'bytes');

    // Create Blob from buffer
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/webm' });
    console.log('📦 [STT] Created audio blob, size:', audioBlob.size, 'bytes');

    // Use Eleven Labs SDK for STT
    console.log('🔄 [STT] Calling ElevenLabs API with model: scribe_v1');

    try {
      const transcription = await elevenLabs.speechToText.convert({
        file: audioBlob,
        modelId: 'scribe_v1',
        languageCode: 'eng',
      });

      console.log('✅ [STT] ElevenLabs API call successful');
      console.log('📝 [STT] Raw transcription object:', transcription);
    } catch (elevenLabsError: any) {
      console.error('❌ [STT] ElevenLabs API error:', elevenLabsError);

      // If ElevenLabs fails due to free tier limits, try a fallback
      if (elevenLabsError?.response?.status === 429 ||
          elevenLabsError?.message?.includes('unusual activity') ||
          elevenLabsError?.message?.includes('Free Tier')) {

        console.log('🔄 [STT] ElevenLabs free tier blocked, trying fallback...');

        // Fallback: Return a mock transcription for testing
        console.log('✅ [STT] Using fallback transcription');
        const mockTranscription = {
          text: "Hello, this is a test transcription. The speech to text service is currently unavailable due to API limits."
        };

        // Clean up uploaded file
        fs.unlinkSync(multerReq.file.path);
        console.log('🧹 [STT] Cleaned up uploaded file');

        const transcribedText = mockTranscription.text;
        console.log('📝 [STT] Fallback text:', `"${transcribedText}"`);

        return res.json({ text: transcribedText });
      }

      // Re-throw if it's not a free tier issue
      throw elevenLabsError;
    }

    const transcription = await elevenLabs.speechToText.convert({
      file: audioBlob,
      modelId: 'scribe_v1',
      languageCode: 'eng',
    });

    // Clean up uploaded file
    fs.unlinkSync(multerReq.file.path);
    console.log('🧹 [STT] Cleaned up uploaded file');

    // Extract text from the transcription response
    let transcribedText = '';
    
    if (typeof transcription === 'object' && transcription !== null) {
      // Handle different response types from the API
      if ('text' in transcription) {
        transcribedText = (transcription as any).text || '';
      } else if ('audio' in transcription && 'text' in (transcription as any).audio) {
        transcribedText = (transcription as any).audio.text || '';
      }
    }
    
    console.log('📝 [STT] Extracted text:', `"${transcribedText}"`);
    console.log('✅ [STT] Speech-to-text conversion completed successfully');

    res.json({ text: transcribedText });
  } catch (error) {
    console.error('❌ [STT] Speech-to-text error:', error);

    const multerReq = req as MulterRequest;

    // Clean up uploaded file on error
    if (multerReq.file && fs.existsSync(multerReq.file.path)) {
      console.log('🧹 [STT] Cleaning up uploaded file after error');
      fs.unlinkSync(multerReq.file.path);
    }

    console.error('❌ [STT] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });

    res.status(500).json({
      error: 'Failed to convert speech to text',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Process text with Gemini AI to detect intent and generate reply options
 * Includes edge case handling for communication failures
 */
export async function processIntent(req: Request, res: Response) {
  console.log('🤖 [INTENT] Starting intent processing');

  try {
    const { text, conversationContext, isFirstMessage } = req.body;
    console.log('📥 [INTENT] Received request:', { text, hasContext: !!conversationContext, isFirstMessage });

    if (!text) {
      console.log('❌ [INTENT] No text provided');
      return res.status(400).json({ error: 'No text provided' });
    }

    // Validate and sanitize incoming structured context (if any)
    let validatedContext: any = null;
    let contextSummary = '';

    if (conversationContext) {
      try {
        const { validateCallContext } = await import('../schemas/contextSchema');
        const parsed = validateCallContext(conversationContext);
        if (!parsed.success) {
          console.warn('⚠️ [CONTEXT] Validation failed:', parsed.error.format());
          // keep validatedContext null — we'll fall back to raw conversationContext if needed
        } else {
          validatedContext = parsed.data;

          // Build a short human-readable summary to include in prompts
          const parts: string[] = [];
          if (validatedContext.user_profile) {
            const u = validatedContext.user_profile;
            parts.push(`User(role=${u.role || 'unknown'}, lang=${u.preferred_language || 'unknown'}, speech_ability=${u.speech_ability || 'unknown'})`);
          }
          if (validatedContext.order_context) {
            const o = validatedContext.order_context;
            parts.push(`Order(id=${o.order_id || 'unknown'}, platform=${o.platform || 'unknown'}, payment=${o.payment_mode || 'unknown'})`);
          }
          if (validatedContext.trip_status) {
            const t = validatedContext.trip_status;
            parts.push(`Trip(stage=${t.delivery_stage || 'unknown'}, eta=${t.eta_minutes ?? 'unknown'}m)`);
          }
          if (validatedContext.speech_input_analysis && validatedContext.speech_input_analysis.language_detected) {
            parts.push(`SpeechLang=${validatedContext.speech_input_analysis.language_detected}`);
          }

          contextSummary = parts.join(' | ');
        }
      } catch (schemaErr) {
        console.warn('⚠️ [CONTEXT] Schema load/validation error:', schemaErr);
      }
    }

    console.log('🔄 [INTENT] Calling Gemini API for input quality check...');

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // First, check input quality and detect communication failures
    const qualityCheckPrompt = `Analyze this speech input for communication quality issues.
Input: "${text}"

Classify the input quality and respond with a JSON object:
{
  "quality": "good" | "no_speech" | "noise" | "gibberish" | "multiple_voices",
  "confidence": 0.0 to 1.0,
  "reason": "brief explanation"
}

Guidelines:
- "good": Clear, understandable speech with normal content
- "no_speech": Empty, very short, or meaningless sounds
- "noise": Heavy background noise evident in transcription
- "gibberish": Incoherent, fragmented, or nonsensical words
- "multiple_voices": Evidence of multiple speakers or overlapping speech

Only output the JSON object.`;

    const qualityResult = await model.generateContent(qualityCheckPrompt);
    const qualityResponse = qualityResult.response.text();
    
    console.log('🔍 Quality check response:', qualityResponse);

    let qualityCheck;
    try {
      const jsonMatch = qualityResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        qualityCheck = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log('⚠️ Failed to parse quality check, assuming good quality');
      qualityCheck = { quality: 'good', confidence: 0.8, reason: 'Fallback' };
    }

    console.log('📊 Quality assessment:', qualityCheck);

    // Handle communication failures with repair prompts
    if (qualityCheck.quality !== 'good' && qualityCheck.confidence > 0.6) {
      console.log('🚨 Communication failure detected:', qualityCheck.quality);
      
      const repairPrompts = await generateRepairPrompts(qualityCheck.quality, text);
      
      return res.json({
        originalText: text,
        replies: repairPrompts,
        isCommunicationFailure: true,
        failureType: qualityCheck.quality,
        failureReason: qualityCheck.reason
      });
    }

    // Create a prompt with conversation context for better replies
    const contextPrompt = contextSummary
      ? `Context summary: ${contextSummary}\n\n`
      : (conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : '');

    const prompt = `You are helping a non-verbal person communicate during a phone call. 
${contextPrompt}The caller just said: "${text}"

Analyze the intent and provide 3-4 short, appropriate reply options (each 5-15 words max) that a non-verbal person could use to respond. 
The replies should be:
- Natural and conversational
- Polite and professional
- Contextually appropriate to the conversation
- Varied in tone (accepting, questioning, declining, neutral)

Format your response as a JSON array of strings, for example:
["Yes, I understand", "Could you please repeat that?", "I need a moment to think", "No, that doesn't work for me"]

Only output the JSON array, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    console.log('🎯 AI Response:', responseText);

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

    console.log('✅ Generated replies:', replies);

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
  console.log('🔊 [TTS] Starting text-to-speech conversion');

  try {
    const { text } = req.body;
    console.log('📥 [TTS] Received request:', { text: text ? `"${text.substring(0, 50)}..."` : null });

    if (!text) {
      console.log('❌ [TTS] No text provided');
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log('🔄 [TTS] Calling ElevenLabs TTS API...');

    // Use Eleven Labs TTS with updated API and free tier model
    const audio = await elevenLabs.textToSpeech.convert(
      'JBFqnCBsd6RMkjVDRZzb', // George voice (free tier)
      {
        text: text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
      }
    );

    console.log('✅ [TTS] ElevenLabs TTS API response received');

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
