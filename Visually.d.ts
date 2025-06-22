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

export type CurrentProduct = {
  variants: [
    {
      id: number,
      price: number, // in cents
      iq: number // inventory quantity
    }
  ],
  oos: boolean,
  id: number,
  price: number // current variant price in cents
}

export interface VisuallyInstrument {
  country?: string;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (variantId: string, quantity: number) => Promise<any>; // should create cart if none
  cartClear: () => void;
  localeChanged: (locale: string) => void; // en|es|de|....
  cartAddAttributes: (attributes: { attributes: Array<{ key: string, value: string }> }, cb: (cart: any) => void) => void
  initialProductId: number;
  pageType: string;
  initialVariantId: number;
  initialVariantPrice: number;
  initialUserId: string;
  initialLocale: string;
  initialCurrency: string;
  initialCart: any,
  customerTags: Array<string>,
  currentProduct?: CurrentProduct
}
