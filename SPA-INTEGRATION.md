# Visually.io | Generic Headless (SPA/PWA/Hydrogen2) Integration

Welcome to our comprehensive guide on integrating Visually.io into your custom headless storefront.
This guide will walk you through the process step by step.
It's intended for any SPA, framework-agnostic. 
Be it Hydrogen, Next, Gatsby or something else.

For a complete example of a Hydrogen store integration, please refer to our README.md in this projct.

## Table of Contents

1. [Add Visually.io SDK](#add-visuallyio-sdk)
2. [Notify the SDK on Context Changes](#notify-our-sdk-on-context-changesgg)
3. [Create a Visually.io Instrument](#create-a-visuallyio-instrument)
4. [Cart Object Requirements](#ensure-the-cart-object-passed-to-our-sdk-conforms-to-the-following-structure)
5. [Instrument Bootstrap](#after-defining-your-instrument-invoke-our-bootstrap-method-during-the-initial-page-load-at-the-root-of-your-application)
6. [Privacy and Tracking Consent](#privacy)
7. [Allowed Domains](#allowed-domains)

## Add Visually.io SDK

To get started, you need to include the Visually.io runtime dependencies in the `<head>` section of your `index.html` file.
Be sure to place these script tags as close to the beginning of the `<head>` tag as possible. Replace `<ANALYTICS_KEY>`
and `<STORE_ALIAS>` with the values provided to you by Visually.io.

```html

<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <link rel="icon" type="image/svg+xml" href="/src/assets/favicon.svg"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

    <!-- VISUALLY SDK -->
    <script type="text/javascript" rel="preconnect prefetch"
            src="https://live.visually-io.com/widgets/vsly-preact.min.js?k=<STORE_API_KEY>&e=2&s=<STORE_ALIAS>"></script>
    <script type="text/javascript" rel="preconnect prefetch"
            src="https://live.visually-io.com/v/visually-spa.js"></script>
    <script defer type="application/javascript" src="https://live.visually-io.com/v/visually-a-spa.js"></script>
    <!-- END OF VISUALLY SDK -->

</head>
<body>
<!-- ... -->
</body>
</html>
```

## Notify our SDK on context changes:gg

To enable Visually.io to send analytics and track the user's journey throughout the session, 
call the appropriate Visually SDK methods in response to specific events in the application.

```typescript
declare global {
    interface Window {
        visually: {
            onCartChanged: (cart: CartBase) => void;
            productChanged: (product: CurrentProduct) => void;
            localeChanged: (locale: string) => void;
            customerTagsChanged: (newTags: [string]) => void // shopify customer tags
            currencyChanged: (currency: string) => void;
            pageTypeChanged: (pageType: 'home' | 'product' | 'catalog' | 'other') => void;
            onUserIdChanged: (userId: string) => void; // signed in user id
            visuallyConnect: (instrument: VisuallyInstrument) => void // connect the instrument to the Visually SDK once on page load
        }
    }
}
```

For instance, when the current product changes, you should call:
```javscript
window.visually.productChanged(currentProduct)
```
Or when the current locale changes you should call:
```javscript
window.visually.localeChanged('de')
```

## Create a Visually.io Instrument

To enable Visually.io to control and interact with key aspects of your storefront, you need to provide an object that implements a specific interface.
This instrument object exposes methods for actions such as adding or removing items from the cart, opening or closing the cart drawer, and more. 
Visually.io calls these methods from its upsell features to perform actions on your store. 
Of particular importance is the `cartAddAttributes` method, which Visually.io uses to add custom attributes to the Shopify cart object.
These attributes are later referenced in analytics to attribute orders to specific experiences.
Without implementing this method, Visually.io may not be able to track orders correctly.

```typescript
interface VisuallyInstrument {
    openCartDrawer: () => void;
    closeCartDrawer: () => void;
    addToCart: (variantId: string, quantity: number) => Promise<any>; // should create cart if none
    cartClear: () => void;
    cartAddAttributes: (attributes: {
        attributes: Array<{ key: string, value: string }>
    }, cb: (cart: any) => void) => void; // adds attributes to the cart
    pageType: string;
    currentProduct: CurrentProduct; // see type definition below
    initialLocale: string; // eg: en|de|es
    initialUserId: string; // signed in user id
    initialProductId: number;
    initialVariantId: number; // optional - only for PDP pages, current variant id
    initialVariantPrice: number; // optional - only for PDP pages, current variant price
    initialLocale: string; // optional - initial locale - 'en' by default
    initialCurrency: string; // optional - initial currency - 'USD' by default
    initialCart: CartBase; // initial cart if user has a cart, ( defined above )
    customerTags: Array<string>; //OPTIONAL: SHPOIFY CUSTOMER TAGS
    analyticsProcessingAllowed: () => boolean // return true or false. Depending on the user tracking consent
}
```
The `initial*` properties are used to initialize visually sdk with the current state of the application. Known at Page load. (before any user interaction)

## Ensure the Cart Object passed to our SDK conforms to the following structure
When you pass the cart object to the Visually SDK, it should conform to the following structure:
Notice that the price should be in cents.
If your store sells subscriptions, the `items` array should include a `selling_plan_allocation` object with the `selling_plan` object containing the plan name.
```typescript
type CartBase = {
    item_count: number
    attributes: Array<{ key: string, value: string }>
    items: BaseCartItem[]
    currency: string
    total_price: number // cents
    token: string
}


type BaseCartItem = {
    variant_id: number,
    quantity: number,
    product_id: number,
    price: number, // cents
    compare_at_price?: number, // cents
    handle: string,
    selling_plan_allocation?: SellingPlanAllocation // optional - subscriptions info

}

interface SellingPlanAllocation {
    selling_plan: SellingPlan
}

interface SellingPlan {
    name: string
}

type CurrentProduct = {
    variants: [
        {
            id: number,
            price: number, // cents
            iq: number // inventory quantity
        }
    ],
    id: number,
    oos: boolean,
    price: number // max variant price in cents
}
```

### After defining your instrument, invoke our bootstrap method during the initial page load at the root of your application:

```js
const [isLoaded, setIsLoaded] = useState(false);

useEffect(() => {
    if (typeof window === 'undefined') return;
    const abortController = new AbortController();
    const handleVisuallyInit = () => {
        setIsLoaded(!!window.visually?.visuallyConnect);
    };
    window.addEventListener('x-visually-init', handleVisuallyInit, {
        once: true,
        signal: abortController.signal,
    });
    return () => {
        abortController.abort();
    };
}, []);


useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return;
    window.visuallyConnect(instrumentationTool)
// ensuring/awaiting that window.visuallyConnect is defined 
}, [isLoaded]);
```


## Privacy
To respect customer tracking consent, implement the following method:

```typescript
    window.visually.analyticsProcessingAllowed = () => true; // Change this to false if user declined tracking consent
```
This ensures that analytics data is only processed when consent has been granted.
Visually will query the consent status before sending any analytics data.


## Allowed domains


If the SPA has a security mechanism that allows the website to run only on specific domains

We require to add the following domains to the domains 'allow list'

- visually.io

- loomi.me

- vsly.local:8000


If you have any more questions or need any help, please don't hesitate to reach out to us.


## Reference
Please to this project for a working example of the integration for a hydrogen store.