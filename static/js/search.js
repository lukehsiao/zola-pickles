/*!
 * Site search for the pickles theme.
 *
 * Reads the elasticlunr index that Zola writes when `build_search_index` is
 * enabled. Neither the library nor the index is referenced by the page until
 * the reader shows intent to search (hovering or focusing the trigger, or
 * opening the dialog), so a reader who never searches downloads nothing beyond
 * this file. Everything below is scoped to the elements the theme renders in
 * `templates/index.html`; the URLs of the scripts injected on demand arrive as
 * data attributes because only the template knows the site's base URL, its
 * language, and any language stemmers the site supplies.
 */
(function () {
  "use strict";

  var dialog = document.getElementById("js-search-dialog");
  var trigger = document.getElementById("js-search-trigger");
  if (!dialog || !trigger) {
    return;
  }

  // Without `<dialog>` support there is no modal to open, so retire the
  // control rather than leave a button that does nothing.
  if (typeof dialog.showModal !== "function") {
    trigger.remove();
    dialog.remove();
    return;
  }

  var input = document.getElementById("js-search-input");
  var list = document.getElementById("js-search-results");
  var status = document.getElementById("js-search-status");
  var closer = document.getElementById("js-search-close");

  // Eight hits fill the panel without scrolling on a laptop, and capping the
  // list is what keeps snippet building bounded no matter how large the site.
  var MAX_RESULTS = 8;
  // A single-character prefix query expands to most of the index, which is
  // both slow and useless; two characters is where the results start to mean
  // something.
  var MIN_QUERY_LENGTH = 2;
  // Roughly two lines of snippet at the panel's width.
  var SNIPPET_LENGTH = 180;
  // Show a little of the text leading up to the match, not just what follows.
  var SNIPPET_LEAD = 60;
  // Short enough to feel instantaneous, long enough that a fast typist runs
  // one query per word rather than one per keystroke.
  var DEBOUNCE_MS = 80;

  var index = null;
  var indexPromise = null;
  var results = [];
  var activeIndex = -1;
  var highlighter = null;
  var debounceTimer = 0;

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var element = document.createElement("script");
      element.src = url;
      element.onload = resolve;
      element.onerror = function () {
        reject(new Error("could not load " + url));
      };
      document.head.appendChild(element);
    });
  }

  // Zola builds a non-English index with that language's analysis pipeline and
  // records the pipeline function names in the index. elasticlunr throws on
  // names it does not have registered, so such a site has to supply the
  // matching lunr-languages files through `extra.search_stemmers`. They read
  // the `lunr` global that elasticlunr defines, and each builds on the one
  // before it, so they load after the library and strictly in order.
  function loadStemmers() {
    var urls = (dialog.dataset.searchStemmers || "").split(/\s+/);
    return urls.reduce(function (chain, url) {
      if (!url) {
        return chain;
      }
      return chain.then(function () {
        return loadScript(url);
      });
    }, Promise.resolve());
  }

  // The index file only assigns `window.searchIndex`, so it does not depend on
  // elasticlunr having loaded first and the two can share one round trip.
  function loadIndex() {
    if (indexPromise) {
      return indexPromise;
    }
    indexPromise = Promise.all([
      loadScript(dialog.dataset.searchLib),
      loadScript(dialog.dataset.searchIndex),
    ])
      .then(loadStemmers)
      .then(function () {
        index = window.elasticlunr.Index.load(window.searchIndex);
        return index;
      });
    indexPromise.catch(function () {
      indexPromise = null; // let the next attempt retry a failed download
    });
    return indexPromise;
  }

  // A document's id is its permalink, built from `base_url` at build time.
  // `zola serve` rewrites that base URL in rendered HTML but not in the search
  // index, so results would send a reader previewing locally off to the
  // deployed site. Re-root them on wherever the index itself was served from,
  // which is the site the reader is actually looking at.
  var configuredBase = (dialog.dataset.searchBase || "").replace(/\/$/, "");
  var indexUrl = dialog.dataset.searchIndex;
  var servedBase = indexUrl.slice(0, indexUrl.lastIndexOf("/"));

  function hrefFor(ref) {
    if (configuredBase && ref.lastIndexOf(configuredBase, 0) === 0) {
      return servedBase + ref.slice(configuredBase.length);
    }
    return ref;
  }

  function termsOf(query) {
    var seen = Object.create(null);
    var terms = [];
    query
      .toLowerCase()
      .split(/\s+/)
      .forEach(function (term) {
        if (term && !seen[term]) {
          seen[term] = true;
          terms.push(term);
        }
      });
    // Longest first so "search" wins over "sea" when both would match here.
    return terms.sort(function (a, b) {
      return b.length - a.length;
    });
  }

  function highlighterFor(terms) {
    if (!terms.length) {
      return null;
    }
    var alternation = terms
      .map(function (term) {
        return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("|");
    return new RegExp(alternation, "gi");
  }

  // Builds text nodes and <mark> elements rather than an HTML string: page
  // titles and body text are untrusted input as far as this code is concerned.
  function appendHighlighted(parent, text) {
    if (!highlighter) {
      parent.appendChild(document.createTextNode(text));
      return;
    }
    highlighter.lastIndex = 0;
    var cursor = 0;
    var match;
    while ((match = highlighter.exec(text)) !== null) {
      if (match.index > cursor) {
        parent.appendChild(
          document.createTextNode(text.slice(cursor, match.index))
        );
      }
      var mark = document.createElement("mark");
      mark.textContent = match[0];
      parent.appendChild(mark);
      cursor = match.index + match[0].length;
    }
    if (cursor < text.length) {
      parent.appendChild(document.createTextNode(text.slice(cursor)));
    }
  }

  // A window of body text around the earliest term hit, snapped outwards to
  // whole words so the snippet never starts or ends mid-word.
  function snippetFor(body, terms) {
    if (!body) {
      return "";
    }
    var haystack = body.toLowerCase();
    var hit = -1;
    terms.forEach(function (term) {
      var at = haystack.indexOf(term);
      if (at !== -1 && (hit === -1 || at < hit)) {
        hit = at;
      }
    });
    if (hit === -1) {
      hit = 0; // matched on the title, or only after stemming: show the opening
    }

    var start = Math.max(0, hit - SNIPPET_LEAD);
    var end = Math.min(body.length, start + SNIPPET_LENGTH);
    if (start > 0) {
      var wordStart = body.indexOf(" ", start);
      start = wordStart === -1 || wordStart >= hit ? start : wordStart + 1;
    }
    if (end < body.length) {
      var wordEnd = body.lastIndexOf(" ", end);
      end = wordEnd <= hit ? end : wordEnd;
    }

    return (
      (start > 0 ? "\u2026" : "") +
      body.slice(start, end).trim() +
      (end < body.length ? "\u2026" : "")
    );
  }

  function setActive(next) {
    var options = list.children;
    if (activeIndex >= 0 && activeIndex < options.length) {
      options[activeIndex].firstChild.setAttribute("aria-selected", "false");
    }
    activeIndex = next;
    if (activeIndex < 0 || activeIndex >= options.length) {
      input.removeAttribute("aria-activedescendant");
      return;
    }
    var link = options[activeIndex].firstChild;
    link.setAttribute("aria-selected", "true");
    input.setAttribute("aria-activedescendant", link.id);
    link.scrollIntoView({ block: "nearest" });
  }

  function moveActive(delta) {
    if (!results.length) {
      return;
    }
    var count = results.length;
    setActive((activeIndex + delta + count) % count);
  }

  function render(hits, terms) {
    results = hits;
    activeIndex = -1;
    highlighter = highlighterFor(terms);

    var fragment = document.createDocumentFragment();
    hits.forEach(function (hit, position) {
      var document_ = index.documentStore.getDoc(hit.ref);
      var url = hrefFor(hit.ref);
      var item = document.createElement("li");
      item.className = "c-search__item";
      item.setAttribute("role", "none");

      var link = document.createElement("a");
      link.className = "c-search__hit";
      link.href = url;
      link.id = "js-search-hit-" + position;
      link.setAttribute("role", "option");
      link.setAttribute("aria-selected", "false");
      link.tabIndex = -1;

      var title = document.createElement("span");
      title.className = "c-search__hit-title";
      appendHighlighted(title, document_.title || url);
      link.appendChild(title);

      var snippet = snippetFor(document_.body, terms);
      if (snippet) {
        var excerpt = document.createElement("span");
        excerpt.className = "c-search__hit-excerpt";
        appendHighlighted(excerpt, snippet);
        link.appendChild(excerpt);
      }

      item.appendChild(link);
      fragment.appendChild(item);
    });

    list.replaceChildren(fragment);
    input.setAttribute("aria-expanded", hits.length ? "true" : "false");
    input.removeAttribute("aria-activedescendant");
    if (hits.length) {
      setActive(0); // Enter should go somewhere sensible without arrowing first
    }
  }

  function clear(message) {
    results = [];
    activeIndex = -1;
    highlighter = null;
    list.replaceChildren();
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    status.textContent = message;
  }

  function update() {
    var query = input.value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      clear(query.length ? "Keep typing\u2026" : "");
      return;
    }

    loadIndex().then(
      function (loaded) {
        if (input.value.trim() !== query) {
          return; // a newer query is already on its way
        }
        var hits = loaded
          .search(query, {
            fields: { title: { boost: 2 }, body: { boost: 1 } },
            bool: "AND",
            expand: true, // prefix matching, so results appear mid-word
          })
          .slice(0, MAX_RESULTS);

        if (!hits.length) {
          clear("No results for \u201c" + query + "\u201d");
          return;
        }
        render(hits, termsOf(query));
        status.textContent =
          hits.length === 1 ? "1 result" : hits.length + " results";
      },
      function () {
        clear("Search is unavailable right now.");
      }
    );
  }

  function schedule() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(update, DEBOUNCE_MS);
  }

  function open() {
    if (dialog.open) {
      return;
    }
    loadIndex().catch(function () {
      /* reported by update() when the reader types */
    });
    document.documentElement.classList.add("is-search-open");
    dialog.showModal();
    input.select(); // reopening keeps the last query; typing replaces it
    if (input.value.trim()) {
      update();
    }
  }

  function close() {
    if (dialog.open) {
      dialog.close();
    }
  }

  trigger.addEventListener("click", open);
  closer.addEventListener("click", close);

  ["pointerenter", "focus"].forEach(function (event) {
    trigger.addEventListener(event, function () {
      loadIndex().catch(function () {
        /* retried when the dialog opens */
      });
    }, { once: true, passive: true });
  });

  input.addEventListener("input", schedule);

  input.addEventListener("keydown", function (event) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        if (results.length) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (results.length) {
          event.preventDefault();
          setActive(results.length - 1);
        }
        break;
      case "Enter":
        if (activeIndex >= 0) {
          event.preventDefault();
          list.children[activeIndex].firstChild.click();
        }
        break;
      case "Escape":
        // Pre-empt the browser's "clear the search field" default so Escape
        // always means the same thing: close the dialog.
        event.preventDefault();
        close();
        break;
    }
  });

  // A click that lands on the dialog itself is a click on the backdrop; the
  // panel fills the dialog's box, so anything inside it hits a child instead.
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) {
      close();
    }
  });

  dialog.addEventListener("close", function () {
    document.documentElement.classList.remove("is-search-open");
    clearTimeout(debounceTimer);
    trigger.focus();
  });

  document.addEventListener("keydown", function (event) {
    if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (dialog.open) {
        close();
      } else {
        open();
      }
      return;
    }
    if (event.key === "/" && !dialog.open && !isTyping(event.target)) {
      event.preventDefault();
      open();
    }
  });

  function isTyping(target) {
    if (!target || !target.tagName) {
      return false;
    }
    var tag = target.tagName.toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      target.isContentEditable
    );
  }
})();
