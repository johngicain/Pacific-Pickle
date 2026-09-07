import { Component } from '@theme/component';

class BlogFiltersComponent extends Component {
  /** @param {Event} event */
  selectFilter = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest('[data-category]');
    if (!(button instanceof HTMLElement) || !this.contains(button)) return;

    this.#applyFilter(button, button.getAttribute('data-category') ?? '');
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('shopify:block:select', this.#onBlockSelect);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('shopify:block:select', this.#onBlockSelect);
  }

  /** @param {Event} event */
  #onBlockSelect = (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    if (!(target instanceof HTMLElement) || !this.contains(target)) return;

    const button = target.closest('[data-category]');
    if (!(button instanceof HTMLElement) || !this.contains(button)) return;

    this.#applyFilter(button, button.getAttribute('data-category') ?? '');
  };

  /**
   * @param {HTMLElement} activeButton
   * @param {string} category
   */
  #applyFilter(activeButton, category) {
    const buttons = this.querySelectorAll('.blog-filters__item');

    for (const button of buttons) {
      const isActive = button === activeButton;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    const posts = document.querySelectorAll('.blog-post-item');
    const list = document.querySelector('.blog-posts');
    let visibleCount = 0;

    for (const post of posts) {
      if (!(post instanceof HTMLElement)) continue;

      const match = category === '' || post.dataset.category === category;
      post.classList.toggle('is-filter-hidden', !match);

      if (!match) {
        post.classList.remove('blog-post-item--featured', 'blog-post-item--horizontal');
        continue;
      }

      const isFeatured = category === '' && visibleCount === 0;
      post.classList.toggle('blog-post-item--featured', isFeatured);
      post.classList.toggle('blog-post-item--horizontal', isFeatured);
      visibleCount += 1;
    }

    if (list) {
      list.classList.toggle('blog-posts--featured', category === '');
    }

    const empty = document.querySelector('[data-blog-filter-empty]');
    if (empty instanceof HTMLElement) {
      empty.hidden = visibleCount > 0;
    }
  }
}

if (!customElements.get('blog-filters-component')) {
  customElements.define('blog-filters-component', BlogFiltersComponent);
}
