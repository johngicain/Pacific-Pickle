import { morph } from '@theme/morph';
import { Component } from '@theme/component';
import { StandardEvents, CartLinesUpdateEvent } from '@shopify/events';

/**
 * @typedef {object} Refs
 * @property {HTMLElement} [count]
 *
 * @extends {Component<Refs>}
 */
class ProductCartVisitors extends Component {
  connectedCallback() {
    super.connectedCallback();
    const closestSection = this.closest('.shopify-section, dialog');
    closestSection?.addEventListener(StandardEvents.productSelect, this.#handleProductSelect);
    document.addEventListener(StandardEvents.cartLinesUpdate, this.#handleCartUpdate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    const closestSection = this.closest('.shopify-section, dialog');
    closestSection?.removeEventListener(StandardEvents.productSelect, this.#handleProductSelect);
    document.removeEventListener(StandardEvents.cartLinesUpdate, this.#handleCartUpdate);
  }

  #handleProductSelect = (event) => {
    if (!(event.target instanceof Element) || event.target.closest('product-card')) return;

    event.promise
      .then(({ detail }) => {
        if (!detail?.html) return;

        const { html, newProduct } = detail;

        if (newProduct) {
          this.dataset.productId = newProduct.id;
        } else if (detail.productId && detail.productId !== this.dataset.productId) {
          return;
        }

        const selector = `product-cart-visitors[data-block-id="${this.dataset.blockId}"]`;
        const next = html.querySelector(selector);
        if (!next) return;

        this.hidden = next.hasAttribute('hidden');
        morph(this, next, { childrenOnly: true });
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[product-cart-visitors] Event promise rejected:', error);
      });
  };

  /**
   * @param {CartLinesUpdateEvent} event
   */
  #handleCartUpdate = (event) => {
    event.promise
      ?.then(({ detail }) => {
        const items = detail?.items;
        if (Array.isArray(items)) {
          this.#setCount(this.#quantityForProduct(items));
          return;
        }

        return this.#refreshFromCart();
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[product-cart-visitors] Event promise rejected:', error);
      });
  };

  async #refreshFromCart() {
    const response = await fetch(`${Theme.routes.cart_url}.json`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!response.ok) throw new Error(`Failed to fetch cart: ${response.status}`);
    const cart = await response.json();
    this.#setCount(this.#quantityForProduct(cart.items));
  }

  /**
   * @param {Array<{product_id?: string | number, productId?: string | number, quantity?: number}>} [items]
   */
  #quantityForProduct(items) {
    const productId = String(this.dataset.productId ?? '');
    if (!productId || !Array.isArray(items)) return 0;

    return items.reduce((sum, item) => {
      const itemProductId = String(item.product_id ?? item.productId ?? '');
      if (itemProductId !== productId) return sum;
      return sum + (Number(item.quantity) || 0);
    }, 0);
  }

  #setCount(count) {
    const nextCount = Math.max(0, Number(count) || 0);
    const countEl = this.refs.count;
    if (countEl) countEl.textContent = String(nextCount);

    const text = this.dataset.text ?? '';
    this.setAttribute('aria-label', `${nextCount} ${text}`.trim());

    if (this.hasAttribute('data-preview')) return;
    this.hidden = nextCount === 0;
  }
}

if (!customElements.get('product-cart-visitors')) {
  customElements.define('product-cart-visitors', ProductCartVisitors);
}
