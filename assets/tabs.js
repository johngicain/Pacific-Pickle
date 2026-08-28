import { Component } from '@theme/component';

/**
 * @extends Component
 */
class TabsComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.#syncScroller();
    this.#sync();
    document.addEventListener('shopify:block:select', this.#onBlockSelect);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('shopify:block:select', this.#onBlockSelect);
  }

  /**
   * @param {Event} event
   */
  selectTab = (event) => {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
    const button = path.find(
      (node) => node instanceof HTMLButtonElement && node.getAttribute('role') === 'tab'
    );
    if (!(button instanceof HTMLButtonElement) || !this.contains(button)) return;
    this.#activate(button);
  };

  /**
   * @param {KeyboardEvent} event
   */
  onKeyDown = (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const tabs = this.#tabs;
    if (tabs.length === 0) return;

    const current = document.activeElement;
    const index = tabs.indexOf(/** @type {HTMLButtonElement} */ (current));
    if (index < 0) return;

    event.preventDefault();

    const rtl = document.documentElement.getAttribute('dir') === 'rtl';
    let next = index;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        next = rtl && event.key === 'ArrowLeft' ? index + 1 : index - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        next = rtl && event.key === 'ArrowRight' ? index - 1 : index + 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tabs.length - 1;
        break;
    }

    if (next < 0) next = tabs.length - 1;
    if (next >= tabs.length) next = 0;

    const button = tabs[next];
    if (button) this.#activate(button, true);
  };

  /**
   * @param {Event} event
   */
  #onBlockSelect = (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    if (!this.contains(target)) return;

    const item = target.closest('.tabs__item');
    const panel =
      (item instanceof HTMLElement ? item.querySelector('[role="tabpanel"]') : null) ??
      target.closest('[role="tabpanel"]');
    if (!(panel instanceof HTMLElement)) return;

    const button = this.querySelector(`[role="tab"][aria-controls="${panel.id}"]`);
    if (button instanceof HTMLButtonElement) this.#activate(button);
  };

  /**
   * @param {Element} element
   */
  #itemFrom(element) {
    const item = element.closest('.tabs__item');
    if (item instanceof HTMLElement) return item;

    if (element instanceof HTMLButtonElement) {
      const panelId = element.getAttribute('aria-controls');
      if (!panelId) return null;
      const panel = this.querySelector(`[role="tabpanel"]#${CSS.escape(panelId)}`);
      return panel instanceof HTMLElement ? panel.closest('.tabs__item') : null;
    }

    return null;
  }

  /**
   * @param {Element} element
   */
  #isVisibleItem(element) {
    const item = this.#itemFrom(element);
    return !(item instanceof HTMLElement && (item.hidden || item.classList.contains('tabs__item--empty')));
  }

  #syncScroller() {
    const layout = this.querySelector('.tabs__layout');
    if (!(layout instanceof HTMLElement)) return;

    let scroller = layout.querySelector(':scope > .tabs__scroller');
    if (!(scroller instanceof HTMLElement)) {
      scroller = document.createElement('div');
      scroller.className = 'tabs__scroller';
      layout.prepend(scroller);
    }

    const items = Array.from(this.querySelectorAll('.tabs__item')).filter(
      (item) => item.closest('tabs-component') === this
    );

    for (const tab of Array.from(scroller.querySelectorAll('.tabs__tab'))) {
      const item = this.#itemFrom(tab);
      if (item instanceof HTMLElement && (item.hidden || item.classList.contains('tabs__item--empty'))) {
        item.prepend(tab);
      }
    }

    for (const item of items) {
      const tab = item.querySelector(':scope > .tabs__tab');
      if (!(tab instanceof HTMLButtonElement)) continue;

      if (item.hidden || item.classList.contains('tabs__item--empty')) continue;

      scroller.append(tab);
    }
  }

  get #tabs() {
    return Array.from(this.querySelectorAll('[role="tab"]')).filter(
      (tab) =>
        tab instanceof HTMLButtonElement && tab.closest('tabs-component') === this && this.#isVisibleItem(tab)
    );
  }

  get #panels() {
    return Array.from(this.querySelectorAll('[role="tabpanel"]')).filter(
      (panel) =>
        panel instanceof HTMLElement && panel.closest('tabs-component') === this && this.#isVisibleItem(panel)
    );
  }

  #sync() {
    const selected =
      this.#tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? this.#tabs[0];
    if (selected) this.#activate(selected);
  }

  /**
   * @param {HTMLButtonElement} button
   * @param {boolean} [focus]
   */
  #activate(button, focus = false) {
    const panelId = button.getAttribute('aria-controls');

    for (const tab of this.#tabs) {
      const selected = tab === button;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
    }

    for (const panel of this.#panels) {
      const selected = panel.id === panelId;
      panel.classList.toggle('is-active', selected);
      panel.hidden = !selected;
    }

    if (focus) button.focus();

    const scroller = button.parentElement;
    if (scroller instanceof HTMLElement && scroller.classList.contains('tabs__scroller')) {
      const left = button.offsetLeft;
      const right = left + button.offsetWidth;
      if (left < scroller.scrollLeft) {
        scroller.scrollTo({ left, behavior: 'smooth' });
      } else if (right > scroller.scrollLeft + scroller.clientWidth) {
        scroller.scrollTo({ left: right - scroller.clientWidth, behavior: 'smooth' });
      }
    }
  }
}

if (!customElements.get('tabs-component')) {
  customElements.define('tabs-component', TabsComponent);
}
