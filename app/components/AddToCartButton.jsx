import {CartForm} from '@shopify/hydrogen';
import {useCart} from '@shopify/hydrogen-react';

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: () => void;
 * }}
 */
export function AddToCartButton({children, disabled, lines, onClick}) {
  const cart = useCart();
  return (
    <button
      disabled={disabled}
      type="submit"
      onClick={() => {
        cart.linesAdd(lines);
        onClick();
      }}
      style={{
        border: '1px solid black',
        backgroundColor: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/** @typedef {import('react-router').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
