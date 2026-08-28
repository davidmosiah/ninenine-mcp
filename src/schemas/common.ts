import { z } from "zod";

export const ResponseFormatSchema = z.enum(["markdown", "json"]).default("markdown");
export const PrivacyModeSchema = z.enum(["summary", "structured", "raw"]).optional();

const Intent = z
  .boolean()
  .default(false)
  .describe("Must be true after the user explicitly asked for this write.");

export const ResponseOnlyInputSchema = z
  .object({
    response_format: ResponseFormatSchema
  })
  .strict();

export const ReadInputSchema = z
  .object({
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const EstimateInputSchema = z
  .object({
    from_lat: z.number(),
    from_lng: z.number(),
    to_lat: z.number(),
    to_lng: z.number(),
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const RideIdInputSchema = z
  .object({
    ride_id: z.string().min(1),
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const ActiveRideInputSchema = z
  .object({
    ride_id: z.string().min(1).optional(),
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const LogoutInputSchema = z
  .object({
    explicit_user_intent: Intent,
    response_format: ResponseFormatSchema
  })
  .strict();

export const RequestRideInputSchema = z
  .object({
    from_lat: z.number(),
    from_lng: z.number(),
    to_lat: z.number(),
    to_lng: z.number(),
    category: z.enum(["pop", "moto"]).optional(),
    explicit_user_intent: Intent,
    response_format: ResponseFormatSchema
  })
  .strict();

export const CancelRideInputSchema = z
  .object({
    ride_id: z.string().min(1),
    explicit_user_intent: Intent,
    response_format: ResponseFormatSchema
  })
  .strict();
