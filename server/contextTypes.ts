export interface UserProfile {
  user_id: string;
  role?: string;
  speech_ability?: string;
  accessibility_mode?: boolean;
  preferred_language?: string;
  tts_voice?: string;
}

export interface OrderContext {
  order_id?: string;
  platform?: string;
  delivery_type?: string;
  payment_mode?: string;
  cash_to_collect?: boolean;
}

export interface EnvironmentContext {
  noise_level?: string;
  network_quality?: string;
  location_accuracy?: string;
}

export interface TripStatus {
  delivery_stage?: string;
  distance_to_destination_meters?: number;
  eta_minutes?: number;
  gps_status?: string;
  last_stop_reason?: string;
}

export interface CallReasonProbabilities {
  ask_location?: number;
  ask_eta?: number;
  delivery_instruction?: number;
  wrong_address?: number;
  [key: string]: number | undefined;
}

export interface CustomerContext {
  customer_name?: string;
  preferred_language?: string;
  call_reason_probability?: CallReasonProbabilities;
}

export interface SpeechInputAnalysis {
  raw_transcript?: string;
  confidence?: number;
  background_noise_detected?: boolean;
  overlapping_voices_detected?: boolean;
  language_detected?: string;
}

export interface IntentDetection {
  primary_intent?: string;
  secondary_intent?: string;
  certainty?: number;
  urgency?: string;
}

export interface ResponseRules {
  max_response_length_words?: number;
  tone?: string;
  allow_follow_up?: boolean;
  avoid_questions?: boolean;
}

export interface CallContext {
  user_profile?: UserProfile;
  order_context?: OrderContext;
  environment_context?: EnvironmentContext;
  trip_status?: TripStatus;
  customer_context?: CustomerContext;
  speech_input_analysis?: SpeechInputAnalysis;
  intent_detection?: IntentDetection;
  response_rules?: ResponseRules;
  dynamic_tap_responses?: string[];
}
