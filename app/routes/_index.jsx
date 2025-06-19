import {Await, useLoaderData, Link} from 'react-router';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import logo from '~/assets/logo-wide.webp';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Visually.io Reference Headless Store'}];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({context}) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    featuredCollection: collections.nodes[0],
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  return (
    <div className="home">
      <FeaturedCollection collection={data.featuredCollection} />
      <div>
        <h1
          style={{
            fontSize: '3.5rem',
            textAlign: 'center',
            padding: '3rem 1rem',
            margin: '0',
            backgroundColor: '#f8f9fa',
            borderBottom: '2px solid #dee2e6',
            color: '#212529',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: '700',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          Visually.io Reference Headless Store
        </h1>
        <div
          style={{
            width: '100%',
            background: '#fff',
            padding: '2rem 0',
            borderRadius: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '2rem 0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <img
            src={logo}
            alt="Visually.io Logo"
            style={{
              width: '100%',
              maxWidth: '600px',
              height: 'auto',
              display: 'block',
              borderRadius: '1rem',
              background: '#fff',
            }}
          />
        </div>
      </div>
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

/**
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function FeaturedCollection({collection}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery | null>;
 * }}
 */
function RecommendedProducts({products}) {
  return (
    <div className="recommended-products">
      <h2>Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes.map((product) => (
                    <div key={product.id} style={{width: '200px',borderRadius:"15px"}}>
                      <ProductItem  product={product} />
                    </div>
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
fragment FeaturedCollection on Collection {
  id
  title
  image {
    id
    url
    altText
    width
    height
  }
  handle
}
query FeaturedCollection($country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
    nodes {
      ...FeaturedCollection
    }
  }
}
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
fragment RecommendedProduct on Product {
  id
  title
  handle
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
  }
  featuredImage {
    id
    url
    altText
    width
    height
  }
}
query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  products(first: 4, sortKey: UPDATED_AT, reverse: true) {
    nodes {
      ...RecommendedProduct
    }
  }
}
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('react-router').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
