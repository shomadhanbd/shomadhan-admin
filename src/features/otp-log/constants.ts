import type { OtpStatus } from "./types";

type Variant = "default" | "secondary" | "outline" | "destructive";

export const OTP_STATUSES: { id: OtpStatus; name: string; variant: Variant; hint: string }[] = [
  {
    id: "not_sent",
    name: "Not sent",
    variant: "destructive",
    hint: "BulkSMSBD refused the SMS; the student got no code.",
  },
  { id: "verified", name: "Verified", variant: "default", hint: "The right code was entered." },
  { id: "pending", name: "Waiting", variant: "secondary", hint: "Sent, still valid, not entered yet." },
  { id: "expired", name: "Unused", variant: "outline", hint: "Ran out after 5 minutes without being entered." },
  { id: "locked", name: "Locked", variant: "destructive", hint: "Too many wrong codes; a new one is needed." },
];

export const otpStatus = (status: OtpStatus) => OTP_STATUSES.find((s) => s.id === status) ?? OTP_STATUSES[0];
