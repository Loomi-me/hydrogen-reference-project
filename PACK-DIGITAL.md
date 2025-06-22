# Visually.io + Pack Digital (Next.js) Integration

![img.png](img.png)

Welcome to our comprehensive tutorial on integrating Visually.io into your pack-digital headless storefront. This guide
will walk you through the process step by step.

DISCLAIMER: this is an example of integration to the most basic structure of pack-digital, if your code looks different
please contact our technical support team.
This example is also based on the legacy pack-digital Next.js implementation .

## If you are using the latest pack-digital version
## please refer to the [Hydrogen Implementation](README.md).


---

Create the following `VisuallyIo.tsx` file anywhere you want, this file will setup our analytics tracking & cart
manipulation components.
Notice that you'll need to replace the <API_KEY> and <ALIAS> placeholders with the ones given to you by our support
team.

```typescript
// VisuallyIo.tsx
import React, {useEffect} from 'react';
import {
    useCart,
    useCartAddAttributes,
    useCartAddItem,
    useCartClear,
    useCurrency,
} from '@backpackjs/storefront';
import Script from 'next/script';
import {useGlobalContext} from '../contexts';

function getPageType(resourceType) {
    const pageType = 'other';
    if (resourceType === 'home_page') {
        return 'home';
    }
    if (resourceType === 'product_page') {
        return 'product';
    }
    if (resourceType === 'collection_page') {
        return 'collection';
    }
    return pageType;
}

function maybe(f, def = undefined) {
    try {
        return f();
    } catch {
        return def;
    }
}

function transformCart(cart) {
    return cart
        ? {
            item_count: maybe(() => cart.lines.reduce((p, c) => p + c.quantity, 0)),
            attributes: cart?.attributes || [],
            items: cart.lines.map((l) => ({
                handle: l.variant.product.handle,
                price: maybe(() => parseFloat(l.variant.price.amount) * 100), // cents
                compare_at_price: maybe(
                    () => parseFloat(l.variant.compareAtPrice.amount) * 100 // centes
                ),
                product_id: maybe(() =>
                    parseInt(
                        l.variant.product.id.replace('gid://shopify/Product/', ''),
                        10
                    )
                ),
                quantity: l.quantity,
                variant_id: maybe(() =>
                    parseInt(
                        l.variant.id.replace('gid://shopify/ProductVariant/', ''),
                        10
                    )
                ),
            })),
            currency: maybe(() => cart.estimatedCost.totalAmount.currencyCode, 0),
            total_price: maybe(
                () => parseFloat(cart.estimatedCost.totalAmount.amount) * 100, // cents
                0
            ),
            original_total_price: maybe(
                () => parseFloat(cart.estimatedCost.compareAtAmount.amount) * 100, // cents
                0
            ),
            token: maybe(() => cart.id.replace('gid://shopify/Cart/', ''), ''),
        }
        : undefined;
}

function transformProduct(product) {
    //type CurrentProduct = {
    //   variants: [
    //     {
    //       id: number,
    //       price: number, // in cents
    //       iq: number // inventory quantity
    //     }
    //   ],
    //   id: number, // product id
    //   oos: boolean, // out of stock
    //   price: number // max variant price in cents
    // }
    // todo: return above shape
}

function useVisuallyIo({product, resourceType}) {
    const currency = useCurrency();
    const cart = useCart();
    const {cartClear} = useCartClear();
    const {cartAddItem} = useCartAddItem();
    const {cartAddAttributes} = useCartAddAttributes();
    const pageType = getPageType(resourceType);
    const {actions: {openCart},} = useGlobalContext();
    useEffect(() => {
        maybe(() => window.visually.onCartChanged(transformCart(cart)));
    }, [cart]);

    useEffect(() => {
        maybe(() => window.visually.productChanged(transformProduct(product)));
    }, [product?.id]);
    useEffect(() => {
        maybe(() => window.visually.visuallyConnect({
            analyticsProcessingAllowed: () => boolean // see privacy section in the document below
            cartClear,
            customerTags: [], //OPTIONAL: ARRAY<STRING> SHPOIFY CUSTOMER TAGS
            initialClientId: '<replace with real value>', // OPTIONAL: signed in client id
            initialProductId: maybe(() => product.id.replace('gid://shopify/Product/', '')),
            initialVariantPrice: maybe(() => parseInt(product.variants[0].priceV2.amount, 10)),
            initialVariantId: maybe(() => product.variants[0].replace('gid://shopify/ProductVariant/', '')),
            addToCart: (variantId, quantity) => cartAddItem({
                merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
                quantity,
            }),
            cartAddAttributes,
            openCartDrawer: openCart,
            pageType,
            initialCurrency: currency,
            initialLocale: 'en',
            currentProduct: transformProduct(product)
        }));
    }, [pageType, currency, product]);
}


```


```typescript jsx
export function VisuallyIo({ page, product }) {
  useVisuallyIo({
    product,
    resourceType: page?.resourceType,
  });
  return (
    <>
      <Script
        strategy="beforeInteractive"
        rel="preconnect prefetch"
        src="https://live.visually-io.com/widgets/vsly-preact.min.js?k=<API_KEY>&e=2&s=<ALIAS>"
      />
      <Script
        strategy="beforeInteractive"
        rel="preconnect prefetch"
        src="https://live.visually-io.com/v/visually-spa.js"
      />
      <Script
        strategy="afterInteractive"
        src="https://live.visually-io.com/v/visually-a-spa.js"
      />
      <span />
    </>
  );
}
```

## Notify our SDK on context changes


To enable Visually.io to send analytics and track the user's journey throughout the session, you must set up the following hooks in your code:

```typescript
declare global {
    interface Window {
        visually: {
            localeChanged: (locale: string) => void; customerTagsChanged: (newTags: [string]) => void // shopify customer tags
            onUserIdChanged: (userId: string) => void; // signed in user id
        }
    }
}
```

For instance, when the current product changes, you should call:
`window.visually?.productChanged(currentProduct)`

Or when the current locale changes you should call:
`window.visually?.localeChanged('de')`

Afterward, you'll need to add the component we just created to your main global context:


```typescript jsx
// layouts/Storefront.jsx
// ...
  return (
    <GlobalContextProvider>
        <StorefrontHead />
        .
        .
        .
        <VisuallyIo {...props} /> 
        .
        .
        .
    </GlobalContextProvider>
)
```


## Privacy

To respect customer tracking consent, implement the following method:

instrumentationTool.analyticsProcessingAllowed: () => boolean

When initializing our integration, pass this method as a parameter. If provided, it will be used to check for user consent before collecting analytics events.

window.visuallyConnect(instrumentationTool)

This ensures that analytics data is only processed when consent has been granted.


And that's it.

The SDK connects to Visually.io API, runs all the experiences, and reports all the analytics.

If you have any more questions or need any help, please don't hesitate to reach out to us.