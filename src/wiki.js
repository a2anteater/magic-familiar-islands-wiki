(() => {
  const scrollRoot = document.querySelector(".main-scroll");
  const pages = [...document.querySelectorAll("[data-wiki-page]")];
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const tocLinks = [...document.querySelectorAll(".toc-link")];

  const scrollToTarget = (target, updateHistory = true) => {
    if (!target) return;
    if (updateHistory) history.pushState(null, "", `#${target.id}`);
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start" });
      window.scrollTo(0, 0);
    });
  };

  const setCurrent = (id) => {
    [...navLinks, ...tocLinks].forEach((link) => {
      const current = link.getAttribute("href") === `#${id}`;
      if (link.classList.contains("nav-link")) {
        if (current) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      } else if (current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  if (scrollRoot && pages.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
      if (visible[0]) setCurrent(visible[0].target.id);
    }, { root: scrollRoot, rootMargin: "-16% 0px -70%", threshold: 0 });
    pages.forEach((page) => observer.observe(page));
  }

  document.querySelectorAll(".nav-link[href], .toc-link[href], .search-result[href]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      scrollToTarget(target);
    });
  });

  if (window.location.hash) {
    scrollToTarget(document.querySelector(window.location.hash), false);
  } else {
    window.scrollTo(0, 0);
  }
})();
