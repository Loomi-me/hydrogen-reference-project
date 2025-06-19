import {useEffect, useState} from 'react';
import {useLocation} from 'react-router';
import {useCart} from '@shopify/hydrogen-react';
import {useAside} from '~/components/Aside.jsx';
import {useAnalytics} from '@shopify/hydrogen';

export function VisuallyConnect() {
  useVisuallyConnect();
  return <div />;
}

const useVisuallyConnect = () => {
  window.visually.analyticsProcessingAllowed = () => true // change this to false if user declined tracking consent

  const [isLoaded, setIsLoaded] = useState(false);
  const cartWithActions = useCart();
  const {open} = useAside();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsLoaded(!!window.visually?.visuallyConnect);
  }, []);

  const {shop} = useAnalytics();

  useEffect(() => {
    if (!isLoaded) return;
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
      initialCurrency: shop.currency,
      customerTags: [], // strings array
      country: '', // initialize in case you have a country selection - ISO CODE
      initialLocale: shop.acceptedLanguage.toLocaleLowerCase(),
    });
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
    maybe(() => window.visually.localeChanged(shop?.currency));
  }, [shop?.currency]);
};

export function VisuallySDK() {
  return (
    <>
      <link
        rel="preconnect"
        href="https://live.visually-io.com/"
        crossOrigin="anonymous"
      />
      <link rel="dns-prefetch" href="https://live.visually-io.com/" />
      <link
        rel="preload"
        as="script"
        href="https://live.visually-io.com/widgets/vsly-preact.min.js?k=js.65515421926&e=2&s=PURETAKI"
      />
      <link
        rel="preload"
        as="script"
        href="https://live.visually-io.com/cf/PURETAKI.js"
      />
      <link
        rel="preload"
        as="script"
        href="https://live.visually-io.com/v/visually-spa.js"
      />
      <script
        type="text/javascript"
        src="https://live.visually-io.com/widgets/vsly-preact.min.js?k=js.65515421926&e=2&s=PURETAKI"
      />
      <script
        type="text/javascript"
        src="https://live.visually-io.com/cf/PURETAKI.js"
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

export function maybe(f, def = undefined) {
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
        handle: l.merchandise.product.handle,
        price: maybe(() => parseFloat(l.cost.totalAmount.amount) * 100),
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
        () => parseFloat(cart.cost.totalAmount.amount) * 100,
        0,
      ),
      token: maybe(() => cart.id.replace('gid://shopify/Cart/', ''), ''),
    }
    : undefined;
}

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

export const transformVariant = (selected) => {
  return {
    id: selected?.id?.replace('gid://shopify/ProductVariant/', ''),
    price: selected?.price?.amount * 100, // price in cents
    iq: selected.quantityAvailable,
  };
};

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

export function hash(obj) {
  if (!obj) return '';
  return JSON.stringify(obj, Object.keys(obj).sort());
}