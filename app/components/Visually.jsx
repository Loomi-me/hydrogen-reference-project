import {useEffect, useState} from 'react';
import {useLocation} from 'react-router';
import {useCart} from '@shopify/hydrogen-react';
import {useAside} from '~/components/Aside.jsx';

export function VisuallyConnect() {
  useVisuallyConnect();
  return <div />;
}

const useVisuallyConnect = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const cartWithActions = useCart();
  const {open} = useAside();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsLoaded(!!window.visually?.visuallyConnect);
  }, []);
  const {pathname} = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isLoaded) {
      return;
    }
    window.visually.visuallyConnect({
      cartClear: () =>
        cartWithActions.linesRemove(cartWithActions.lines.map(({id}) => id)),
      customerTags: [], // add customer tags if available
      addToCart: (variantId, quantity) =>
        cartWithActions.linesAdd([
          {
            merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
            quantity,
          },
        ]),
      cartAddAttributes: (attributes) =>
        cartWithActions.cartAttributesUpdate(attributes),
      openCartDrawer: () => open('cart'),
      pageType: getPageType(pathname),
      initialProductId: 123,
      initialVariantPrice: 1500, // in cents
      initialVariantId: 111,
      initialCurrency: cartWithActions?.cost?.totalAmount?.currencyCode,
    });
  }, [isLoaded, pathname]);

  // useEffect(() => {
  //   if (status !== 'idle') return;
  //   if (DEBUG) console.log('visually onCartChanged:', cart);
  //   maybe(() => window.visually.onCartChanged(transformCart(cart)));
  // }, [status]);
  //
  // useEffect(() => {
  //   if (DEBUG) console.log('visually pageTypeChanged:', pageType);
  //   maybe(() => window.visually.pageTypeChanged(pageType));
  // }, [pageType]);
  //
  // useEffect(() => {
  //   if (DEBUG) console.log('visually: localeChanged:', locale?.currency);
  //   maybe(() => window.visually.localeChanged(locale?.currency));
  // }, [locale?.currency]);
  //
  // useEffect(() => {
  //   if (DEBUG) console.log('visually: productChanged:', currentProduct);
  //   maybe(() => window.visually.productChanged(currentProduct));
  // }, [currentProduct?.id]);
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
        dangerouslySetInnerHTML={{
          __html: `
            const env = 2;
            window.loomi_ctx = {
              ...(window.loomi_ctx || {}),
              storeAlias: "PURETAKI",
              jitsuKey: "js.65515421926",
              env
            };
            // window.vslyNotShopify = true;
          `,
        }}
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


function maybe(f, def = undefined) {
  try {
    return f();
  } catch (error) {
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
