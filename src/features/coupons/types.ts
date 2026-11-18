/** Whether a student could redeem the coupon right now. */
export type CouponStatus = "active" | "inactive" | "scheduled" | "expired" | "used_up";

export interface Coupon {
  id: number;
  code: string;
  discount_amount: number;
  valid_from: string | null;
  valid_until: string | null;
  /** `null` is unlimited. */
  max_uses: number | null;
  times_used: number;
  /** Product ids; empty means every plan that accepts coupons. */
  applies_to: number[];
  is_active: boolean;
  status: CouponStatus;
}

export interface CouponBody {
  code: string;
  discount_amount: number;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  applies_to: number[];
  is_active: boolean;
}
