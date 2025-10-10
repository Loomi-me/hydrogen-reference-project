import {useEffect, useState} from 'react';
import {useLocation} from 'react-router';
import {useCart} from '@shopify/hydrogen-react';
import {useAside} from '~/components/Aside.jsx';
import {useAnalytics} from '@shopify/hydrogen';

/**
 * VisuallyConnect is a component that initializes visually connect hooks on mount.
 * It does not render any UI.
 * @returns {JSX.Element} An empty div.
 */
export function VisuallyConnect() {
    useVisuallyConnect();
    return <div/>;
}

/**
 * Custom hook to integrate with the Visually SDK.
 * Sets up Visually connect event handlers and listeners.
 */
const useVisuallyConnect = () => {
    const isLoaded = useIsVisuallyLoaded();

    const {shop} = useAnalytics();
    const {open} = useAside();
    const cartWithActions = useCart();

    useEffect(() => {
        console.log(`visually connected!`)
      // visuallyConnect is idempotent  - you can call it many times and it will only initialize once
        window.visually.visuallyConnect({
            cartClear: () => cartWithActions.linesRemove(cartWithActions.lines.map(({id}) => id)),
            addToCart: (variantId, quantity) => cartWithActions.linesAdd([
                {
                    merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
                    quantity,
                },
            ]),
            cartAddAttributes: (attributes) => cartWithActions.cartAttributesUpdate(attributes),
            openCartDrawer: () => open('cart'),
            initialCurrency: shop?.currency,
            customerTags: [], // strings array
            country: '', // initialize in case you have a country selection - ISO CODE
            initialLocale: shop?.acceptedLanguage?.toLocaleLowerCase(),
        });
      window.visually.analyticsProcessingAllowed = () => true; // Change this to false if user declined tracking consent
    }, [isLoaded]);

    const transformedCart = transformCart(cartWithActions);
    useEffect(() => {
        if (!isLoaded) return;
        maybe(() => window.visually.onCartChanged(transformedCart));
    }, [isLoaded, hash(transformedCart)]);

    const {pathname} = useLocation();
    const pageType = getPageType(pathname);
    useEffect(() => {
        if (!isLoaded) return;
        maybe(() => window.visually.pageTypeChanged(pageType));
    }, [isLoaded, pageType]);

    useEffect(() => {
        if (!isLoaded) return;
        maybe(() => window.visually.localeChanged(shop?.currency));
    }, [isLoaded, shop?.currency]);

};

/**
 * VisuallySDK injects script and link tags necessary for Visually SDK.
 * we intentionally don't use react-router Link and Script components to ensure
 * our code is injected to the top of the document head
 * @returns {JSX.Element} React fragment with link and script tags.
 */
export function VisuallySDK({alias, clientKey}) {
    return (
        <>
            <link
                rel="preconnect"
                href="https://live.visually-io.com/"
                crossOrigin="anonymous"
            />
            <link rel="dns-prefetch" href="https://live.visually-io.com/"/>
            <link
                rel="preload"
                as="script"
                href={`"https://live.visually-io.com/widgets/vsly-preact.min.js?k=js.${clientKey}&e=2&s=${alias}"`}
            />
            <link
                rel="preload"
                as="script"
                href={`https://live.visually-io.com/cf/${alias}.js`}
            />
            <link
                rel="preload"
                as="script"
                href="https://live.visually-io.com/v/visually-spa.js"
            />
            <script
                type="text/javascript"
                src={`https://live.visually-io.com/widgets/vsly-preact.min.js?k=js.${clientKey}&e=2&s=${alias}`}
            />
            <script
                type="text/javascript"
                src={`https://live.visually-io.com/cf/${alias}.js`}
            />
            <script
                type="text/javascript"
                src="https://live.visually-io.com/v/visually-spa.js"
            />
            <script
                defer
                type="text/javascript"
                src="https://live.visually-io.com/v/visually-a-spa.js"
            />
        </>
    );
}

/**
 * Executes a function and returns its result, or a default value if it throws an error.
 * @template T
 * @param {() => T} f Function to execute.
 * @param {T} [def=undefined] Default value to return if the function throws.
 * @returns {T|undefined}
 */
export function maybe(f, def = undefined) {
    try {
        return f();
    } catch {
        return def;
    }
}

/**
 * Transforms a Shopify cart object into a format expected by the Visually SDK.
 * @param {object} cart Cart object from Shopify's useCart.
 * @returns {CartBase|undefined} Transformed cart object or undefined if cart is not provided.
 */
function transformCart(cart) {
    return cart
        ? {
            item_count: maybe(() => cart.lines.reduce((p, c) => p + c.quantity, 0)),
            attributes: cart?.attributes || [],
            items: cart.lines.map((l) => ({
                // selling_plan_allocation:{selling_plan:{name:undefined}}, // add a selling plan if available
                handle: l.merchandise.product.handle,
                price: maybe(() => parseFloat(l.cost.totalAmount.amount) * 100), // PRICE IN CENTS
                product_id: maybe(() =>
                    parseFloat(
                        l.merchandise.product.id.replace('gid://shopify/Product/', ''),
                    ),
                ),
                quantity: l.quantity,
                variant_id: maybe(() =>
                    parseFloat(
                        l.merchandise.id.replace('gid://shopify/ProductVariant/', ''),
                    ),
                ),
            })),
            currency: maybe(() => cart.cost.totalAmount.currencyCode, 0),
            total_price: maybe(
                () => parseFloat(cart.cost.totalAmount.amount) * 100, // PRICE IN CENTS
                0,
            ),
            token: maybe(() => cart.id.replace('gid://shopify/Cart/', ''), ''),
        }
        : undefined;
}

/**
 * Returns a string describing the page type based on the pathname.
 * @param {string} pathname The current location pathname.
 * @returns {'home'|'product'|'collection'|'other'} The resolved page type.
 */
function getPageType(pathname) {
    const pageType = 'other';

    if (pathname === '/') {
        return 'home';
    }
    if (pathname.startsWith('/products/')) {
        return 'product';
    }
    if (pathname.startsWith('/collections/')) {
        return 'collection';
    }
    return pageType;
}

/**
 * Transforms a product variant object for use with Visually integrations.
 * @param {object} selected The selected product variant.
 * @returns {object} The transformed variant.
 */
export const transformVariant = (selected) => {
    return {
        id: selected?.id?.replace('gid://shopify/ProductVariant/', ''),
        price: selected?.price?.amount * 100, // price in cents
        iq: selected.quantityAvailable,
    };
};

/**
 * Transforms a product object for use with Visually integrations.
 * @param {object} product The product object from Shopify.
 * @returns {CurrentProduct|undefined} The transformed product or undefined if failed.
 */
export function transformProduct(product) {
    return maybe(() => {
        const selected = product.selectedOrFirstAvailableVariant;
        const variants = [selected, ...(product?.adjacentVariants || [])];
        return {
            variants: [...variants.map(transformVariant)],
            id: product.id.replace('gid://shopify/Product/', ''),
            oos: false,
            price: selected?.price?.amount * 100, // cents
        };
    });
}

/**
 * Hook that updates Visually SDK with product and variant data. Should be called whenever
 * a new PDP page loads or when a variant is selected on a PDP page.
 * @param {object} product The product object from Shopify.
 * @param {object} selectedVariant The currently selected variant
 * notice! make sure that transformProduct and transformVariant take all necessary fields for the object
 */
export const useVisuallyOnPDPChange = (product, selectedVariant) => {
    const isLoaded = useIsVisuallyLoaded();
    const transformedProduct = transformProduct(product);
    useEffect(() => {
        if (!isLoaded) return;
        maybe(() => window.visually.productChanged(transformedProduct));
    }, [isLoaded, hash(transformedProduct)]);

    const transformedVariant = transformVariant(selectedVariant);
    useEffect(() => {
        if (!isLoaded) return;
        maybe(() => window.visually.variantChanged(transformedVariant));
    }, [isLoaded, hash(transformedVariant)]);

};

function hash(obj) {
    if (!obj) return '';
    return JSON.stringify(obj, Object.keys(obj).sort());
}

const useIsVisuallyLoaded = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    awaitCondition(() => !!window.visually?.visuallyConnect, 50, 100).then(() => setIsLoaded(!isLoaded))

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleVisuallyInit = () => setIsLoaded(!isLoaded);
        window.addEventListener('x-visually-init', handleVisuallyInit);
        return () => window.removeEventListener('x-visually-init', handleVisuallyInit);
    }, []);
    return isLoaded;
};

export const awaitCondition = (
    condition,
    timeout ,
    retries ,
) => new Promise((resolve, reject) => {
    if (condition()) {
        resolve(0)
        return
    }
    if (retries === 0) {
        reject(0)
        return
    }
    setTimeout(() => {
        awaitCondition(condition, timeout, retries - 1)
            .then(resolve)
            .catch(reject)
    }, timeout)
});
