import { z } from 'zod';

export const userProfileSchema = z.object({
  user_id: z.string(),
  role: z.string().optional(),
  speech_ability: z.string().optional(),
  accessibility_mode: z.boolean().optional(),
  preferred_language: z.string().optional(),
  tts_voice: z.string().optional(),
});

export const orderContextSchema = z.object({
  order_id: z.string().optional(),
  platform: z.string().optional(),
  delivery_type: z.string().optional(),
  payment_mode: z.string().optional(),
  cash_to_collect: z.boolean().optional(),
});

export const environmentContextSchema = z.object({
  noise_level: z.string().optional(),
  network_quality: z.string().optional(),
  location_accuracy: z.string().optional(),
});

export const tripStatusSchema = z.object({
  delivery_stage: z.string().optional(),
  distance_to_destination_meters: z.number().optional(),
  eta_minutes: z.number().optional(),
  gps_status: z.string().optional(),
  last_stop_reason: z.string().optional(),
});

export const callReasonProbabilitiesSchema = z.record(z.number()).optional();

export const customerContextSchema = z.object({
  customer_name: z.string().optional(),
  preferred_language: z.string().optional(),
  call_reason_probability: callReasonProbabilitiesSchema,
});

export const speechInputAnalysisSchema = z.object({
  raw_transcript: z.string().optional(),
  confidence: z.number().optional(),
  background_noise_detected: z.boolean().optional(),
  overlapping_voices_detected: z.boolean().optional(),
  language_detected: z.string().optional(),
});

export const intentDetectionSchema = z.object({
  primary_intent: z.string().optional(),
  secondary_intent: z.string().optional(),
  certainty: z.number().optional(),
  urgency: z.string().optional(),
});

export const responseRulesSchema = z.object({
  max_response_length_words: z.number().optional(),
  tone: z.string().optional(),
  allow_follow_up: z.boolean().optional(),
  avoid_questions: z.boolean().optional(),
});

export const callContextSchema = z.object({
  user_profile: userProfileSchema.optional(),
  order_context: orderContextSchema.optional(),
  environment_context: environmentContextSchema.optional(),
  trip_status: tripStatusSchema.optional(),
  customer_context: customerContextSchema.optional(),
  speech_input_analysis: speechInputAnalysisSchema.optional(),
  intent_detection: intentDetectionSchema.optional(),
  response_rules: responseRulesSchema.optional(),
  dynamic_tap_responses: z.array(z.string()).optional(),
});

export const validateCallContext = (data: unknown) => callContextSchema.safeParse(data);
