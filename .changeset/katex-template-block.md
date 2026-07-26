---
"zola-pickles": patch
---

**feature**: the KaTeX assets in the page head are now wrapped in a `katex` template block, so sites can replace the default math setup with a small template override instead of copying the whole base template.

For example, switching to KaTeX's [auto-render extension](https://katex.org/docs/autorender.html) to typeset `$$...$$` directly is a short `templates/index.html` in your site; see the README recipe.
To support exactly that, the theme now ships `auto-render.min.js`, version-locked to the bundled KaTeX; the file lands in every site's output (about 3.5 kB) whether or not the block is overridden.
Default rendering behavior is unchanged.
