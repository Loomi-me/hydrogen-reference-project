export interface SellingPlanAllocation {
  price_adjustments: PriceAdjustment[]
  price: number
  compare_at_price: number
  per_delivery_price: number
  selling_plan: SellingPlan
}

export interface PriceAdjustment {
  position: number
  price: number
}

export interface SellingPlan {
  id: number
  name: string
  description: any
  options: Option[]
  recurring_deliveries: boolean
  fixed_selling_plan: boolean
  price_adjustments: PriceAdjustment2[]
}

export type BaseCartItem = {
  variant_id: number,
  quantity: number,
  product_id: number,
  price: number, // cents
  compare_at_price?: number, // cents
  handle: string,
  selling_plan_allocation?: SellingPlanAllocation

  // Added via visually api
  collections?: string[];
  tags?: string[];
}
export interface CartBase {
  items: Array<BaseCartItem>
  token: string
  attributes: object | Array<{ key: string, value: string }> | any;
  currency: string
  total_price: number // cents
  original_total_price?: number;
  item_count: number
}
