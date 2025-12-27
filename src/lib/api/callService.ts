import { apiClient } from './client';

interface ProcessIntentResponse {
  originalText: string;
  replies: string[];
  isCommunicationFailure?: boolean;
  failureType?: string;
  failureReason?: string;
}

/**
 * Convert speech audio to text using Eleven Labs
 */
export async function speechToText(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');

  const response = await apiClient.post<{ text: string }>('/call/speech-to-text', formData);

  return response.data?.text || '';
}

/**
 * Process text with AI to get reply options
 */
export async function processIntent(
  text: string,
  conversationContext?: any,
  isFirstMessage?: boolean
): Promise<ProcessIntentResponse> {
  // Send structured conversationContext (object) when available
  // Debug: log payload before sending
  console.debug('[API] processIntent payload:', { text, conversationContext, isFirstMessage });

  const response = await apiClient.post<ProcessIntentResponse>(
    '/call/process-intent',
    { text, conversationContext, isFirstMessage }
  );

  return response.data || { originalText: text, replies: [] };
}

/**
 * Convert text to speech using Eleven Labs
 */
export async function textToSpeech(text: string): Promise<string> {
  const response = await apiClient.post<{ audio: string; mimeType: string }>(
    '/call/text-to-speech',
    { text }
  );

  // Return audio as data URL
  if (!response.data?.audio || !response.data?.mimeType) {
    throw new Error('Invalid audio response from server');
  }
  
  return `data:${response.data.mimeType};base64,${response.data.audio}`;
}
