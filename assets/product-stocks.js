import { morph } from '@theme/morph';
import { Component } from '@theme/component';
import { StandardEvents } from '@shopify/events';

class ProductStocks extends Component {
  connectedCallback() {
    super.connectedCallback();
    const closestSection = this.closest('.shopify-section, dialog');
    closestSection?.addEventListener(StandardEvents.productSelect, this.#handleProductSelect);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    const closestSection = this.closest('.shopify-section, dialog');
    closestSection?.removeEventListener(StandardEvents.productSelect, this.#handleProductSelect);
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

        const selector = `product-stocks[data-block-id="${this.dataset.blockId}"]`;
        const newStocks = html.querySelector(selector);
        if (!newStocks) return;

        this.hidden = newStocks.hasAttribute('hidden');
        morph(this, newStocks, { childrenOnly: true });
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[product-stocks] Event promise rejected:', error);
      });
  };
}

if (!customElements.get('product-stocks')) {
  customElements.define('product-stocks', ProductStocks);
}
