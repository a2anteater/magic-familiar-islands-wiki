(() => {
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const sidebar = qs("[data-sidebar]");
  const navScrim = qs("[data-nav-scrim]");
  const menuButton = qs("[data-menu-open]");
  const compactNav = window.matchMedia("(max-width: 1040px)");
  let menuReturnFocus = null;

  const syncMenuAccessibility = () => {
    if (!sidebar) return;
    const closed = compactNav.matches && sidebar.dataset.open !== "true";
    sidebar.inert = closed;
    sidebar.toggleAttribute("aria-hidden", closed);
    qsa("a[href], button", sidebar).forEach((control) => {
      if (closed) control.setAttribute("tabindex", "-1");
      else control.removeAttribute("tabindex");
    });
  };

  const setMenuOpen = (open) => {
    if (!sidebar) return;
    sidebar.dataset.open = String(open);
    syncMenuAccessibility();
    if (navScrim) navScrim.hidden = !open;
    if (menuButton) menuButton.setAttribute("aria-expanded", String(open));
    if (open) {
      menuReturnFocus = document.activeElement;
      qs(".nav-link", sidebar)?.focus();
    } else if (menuReturnFocus instanceof HTMLElement) {
      menuReturnFocus.focus();
    }
  };

  syncMenuAccessibility();
  compactNav.addEventListener("change", syncMenuAccessibility);

  menuButton?.addEventListener("click", () => setMenuOpen(true));
  navScrim?.addEventListener("click", () => setMenuOpen(false));
  qsa("[data-menu-close]").forEach((button) => button.addEventListener("click", () => setMenuOpen(false)));
  qsa(".nav-link", sidebar).forEach((link) => link.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 1040px)").matches) setMenuOpen(false);
  }));

  const dialog = qs("[data-search-dialog]");
  const searchInput = qs("[data-search-input]");
  const searchEmpty = qs("[data-search-empty]");
  const searchItems = dialog ? qsa("[data-search-item]", dialog) : [];
  let searchReturnFocus = null;
  let activeIndex = 0;

  const visibleItems = () => searchItems.filter((item) => !item.hidden);

  const setActive = (nextIndex) => {
    const items = visibleItems();
    if (!items.length) return;
    activeIndex = Math.max(0, Math.min(nextIndex, items.length - 1));
    searchItems.forEach((item) => item.setAttribute("aria-selected", "false"));
    items[activeIndex].setAttribute("aria-selected", "true");
    items[activeIndex].scrollIntoView({ block: "nearest" });
    searchInput?.setAttribute("aria-activedescendant", items[activeIndex].id);
  };

  const filterSearch = () => {
    const query = (searchInput?.value || "").trim().toLocaleLowerCase("zh-CN");
    searchItems.forEach((item) => item.setAttribute("aria-selected", "false"));
    searchItems.forEach((item) => {
      const haystack = (item.dataset.searchText || item.textContent || "").toLocaleLowerCase("zh-CN");
      item.hidden = Boolean(query) && !haystack.includes(query);
    });
    const items = visibleItems();
    if (searchEmpty) searchEmpty.hidden = items.length > 0;
    activeIndex = 0;
    if (items.length) setActive(0);
    else searchInput?.removeAttribute("aria-activedescendant");
  };

  const openSearch = () => {
    if (!dialog || !searchInput) return;
    searchReturnFocus = document.activeElement;
    dialog.hidden = false;
    document.body.dataset.overlayOpen = "true";
    searchInput.value = "";
    filterSearch();
    requestAnimationFrame(() => searchInput.focus());
  };

  const closeSearch = () => {
    if (!dialog) return;
    dialog.hidden = true;
    delete document.body.dataset.overlayOpen;
    if (searchReturnFocus instanceof HTMLElement) searchReturnFocus.focus();
  };

  qsa("[data-search-open]").forEach((button) => button.addEventListener("click", openSearch));
  qsa("[data-search-close]").forEach((button) => button.addEventListener("click", closeSearch));
  searchInput?.addEventListener("input", filterSearch);

  dialog?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(activeIndex + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(activeIndex - 1);
      return;
    }
    if (event.key === "Enter") {
      const item = visibleItems()[activeIndex];
      if (item) {
        event.preventDefault();
        item.click();
      }
      return;
    }
    if (event.key === "Tab") {
      const focusable = qsa("button:not([hidden]), input:not([hidden]), a[href]:not([hidden])", dialog).filter((item) => !item.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  searchItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      const items = visibleItems();
      const index = items.indexOf(item);
      if (index >= 0) setActive(index);
    });
    item.addEventListener("click", () => closeSearch());
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
    if (((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") || (!typing && event.key === "/")) {
      event.preventDefault();
      if (dialog?.hidden) openSearch();
      else closeSearch();
    } else if (event.key === "Escape" && sidebar?.dataset.open === "true") {
      event.preventDefault();
      setMenuOpen(false);
    }
  });

  const filterButtons = qsa("[data-filter]");
  const auditRows = qsa("[data-audit-status]");
  const liveRegion = qs("[data-filter-live]");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      let visibleCount = 0;
      auditRows.forEach((row) => {
        row.hidden = filter !== "all" && row.dataset.auditStatus !== filter;
        if (!row.hidden) visibleCount += 1;
      });
      if (liveRegion) liveRegion.textContent = `当前显示 ${visibleCount} 项`;
    });
  });
})();
