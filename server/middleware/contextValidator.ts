import { Request, Response, NextFunction } from 'express';
import { validateCallContext } from '../schemas/contextSchema';

// Lightweight sanitizer: keep only known keys and primitive-typed values where appropriate
function sanitizeContext(raw: any) {
  if (!raw || typeof raw !== 'object') return null;

  const clean: any = {};

  if (raw.user_profile && typeof raw.user_profile === 'object') {
    clean.user_profile = {};
    const up = raw.user_profile;
    if (typeof up.user_id === 'string') clean.user_profile.user_id = up.user_id;
    if (typeof up.role === 'string') clean.user_profile.role = up.role;
    if (typeof up.speech_ability === 'string') clean.user_profile.speech_ability = up.speech_ability;
    if (typeof up.accessibility_mode === 'boolean') clean.user_profile.accessibility_mode = up.accessibility_mode;
    if (typeof up.preferred_language === 'string') clean.user_profile.preferred_language = up.preferred_language;
    if (typeof up.tts_voice === 'string') clean.user_profile.tts_voice = up.tts_voice;
  }

  if (raw.order_context && typeof raw.order_context === 'object') {
    clean.order_context = {};
    const o = raw.order_context;
    if (typeof o.order_id === 'string') clean.order_context.order_id = o.order_id;
    if (typeof o.platform === 'string') clean.order_context.platform = o.platform;
    if (typeof o.delivery_type === 'string') clean.order_context.delivery_type = o.delivery_type;
    if (typeof o.payment_mode === 'string') clean.order_context.payment_mode = o.payment_mode;
    if (typeof o.cash_to_collect === 'boolean') clean.order_context.cash_to_collect = o.cash_to_collect;
  }

  if (raw.environment_context && typeof raw.environment_context === 'object') {
    clean.environment_context = {};
    const e = raw.environment_context;
    if (typeof e.noise_level === 'string') clean.environment_context.noise_level = e.noise_level;
    if (typeof e.network_quality === 'string') clean.environment_context.network_quality = e.network_quality;
    if (typeof e.location_accuracy === 'string') clean.environment_context.location_accuracy = e.location_accuracy;
  }

  if (raw.trip_status && typeof raw.trip_status === 'object') {
    clean.trip_status = {};
    const t = raw.trip_status;
    if (typeof t.delivery_stage === 'string') clean.trip_status.delivery_stage = t.delivery_stage;
    if (typeof t.distance_to_destination_meters === 'number') clean.trip_status.distance_to_destination_meters = t.distance_to_destination_meters;
    if (typeof t.eta_minutes === 'number') clean.trip_status.eta_minutes = t.eta_minutes;
    if (typeof t.gps_status === 'string') clean.trip_status.gps_status = t.gps_status;
    if (typeof t.last_stop_reason === 'string') clean.trip_status.last_stop_reason = t.last_stop_reason;
  }

  if (raw.customer_context && typeof raw.customer_context === 'object') {
    clean.customer_context = {};
    const c = raw.customer_context;
    if (typeof c.customer_name === 'string') clean.customer_context.customer_name = c.customer_name;
    if (typeof c.preferred_language === 'string') clean.customer_context.preferred_language = c.preferred_language;
    if (c.call_reason_probability && typeof c.call_reason_probability === 'object') {
      clean.customer_context.call_reason_probability = {};
      Object.keys(c.call_reason_probability).forEach((k) => {
        const v = c.call_reason_probability[k];
        if (typeof v === 'number') clean.customer_context.call_reason_probability[k] = v;
      });
    }
  }

  if (raw.speech_input_analysis && typeof raw.speech_input_analysis === 'object') {
    clean.speech_input_analysis = {};
    const s = raw.speech_input_analysis;
    if (typeof s.raw_transcript === 'string') clean.speech_input_analysis.raw_transcript = s.raw_transcript;
    if (typeof s.confidence === 'number') clean.speech_input_analysis.confidence = s.confidence;
    if (typeof s.background_noise_detected === 'boolean') clean.speech_input_analysis.background_noise_detected = s.background_noise_detected;
    if (typeof s.overlapping_voices_detected === 'boolean') clean.speech_input_analysis.overlapping_voices_detected = s.overlapping_voices_detected;
    if (typeof s.language_detected === 'string') clean.speech_input_analysis.language_detected = s.language_detected;
  }

  if (raw.intent_detection && typeof raw.intent_detection === 'object') {
    clean.intent_detection = {};
    const i = raw.intent_detection;
    if (typeof i.primary_intent === 'string') clean.intent_detection.primary_intent = i.primary_intent;
    if (typeof i.secondary_intent === 'string') clean.intent_detection.secondary_intent = i.secondary_intent;
    if (typeof i.certainty === 'number') clean.intent_detection.certainty = i.certainty;
    if (typeof i.urgency === 'string') clean.intent_detection.urgency = i.urgency;
  }

  if (raw.response_rules && typeof raw.response_rules === 'object') {
    clean.response_rules = {};
    const r = raw.response_rules;
    if (typeof r.max_response_length_words === 'number') clean.response_rules.max_response_length_words = r.max_response_length_words;
    if (typeof r.tone === 'string') clean.response_rules.tone = r.tone;
    if (typeof r.allow_follow_up === 'boolean') clean.response_rules.allow_follow_up = r.allow_follow_up;
    if (typeof r.avoid_questions === 'boolean') clean.response_rules.avoid_questions = r.avoid_questions;
  }

  if (raw.dynamic_tap_responses && Array.isArray(raw.dynamic_tap_responses)) {
    clean.dynamic_tap_responses = raw.dynamic_tap_responses.filter((x: any) => typeof x === 'string');
  }

  return clean;
}

export function validateCallContextMiddleware(rejectInvalid = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    const raw = (req.body && req.body.conversationContext) ? req.body.conversationContext : null;

    if (!raw) return next();

    const result = validateCallContext(raw);
    if (result.success) {
      req.body.conversationContext = result.data;
      return next();
    }

    // Validation failed — attempt to sanitize
    console.warn('⚠️ [CONTEXT] Validation failed, attempting to sanitize');
    const sanitized = sanitizeContext(raw);

    // Re-validate sanitized
    const sanitizedResult = validateCallContext(sanitized);
    if (sanitizedResult.success) {
      req.body.conversationContext = sanitizedResult.data;
      console.info('ℹ️ [CONTEXT] Sanitized context accepted');
      return next();
    }

    // Still invalid
    console.warn('⚠️ [CONTEXT] Sanitization did not produce a valid context');

    if (rejectInvalid) {
      return res.status(400).json({ error: 'Invalid conversationContext' });
    }

    // Otherwise, attach sanitized (possibly partial) context as best-effort and continue
    req.body.conversationContext = sanitized || null;
    return next();
  };
}
