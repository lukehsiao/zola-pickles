---
"zola-pickles": patch
---

**feat**: the theme now renders a search dialog when `build_search_index = true`.

The trigger is a lone magnifying glass in the top right of the content column, kept quiet on purpose so it does not compete with the site title, and it opens with `Ctrl`/`Cmd`+`K` or `/`.
Results appear as you type, with the matched words marked in the page title and in an excerpt drawn from the body.

This reads Zola's own elasticlunr index rather than vendoring a search engine, which is what keeps it cheap: the query walks a prebuilt inverted index instead of scanning every page, and nothing is fetched until a reader hovers or opens the control.
A reader who never searches pays for the dialog's 14 kB of JavaScript, about 4.5 kB compressed, and no index at all.
The cost of that choice is that only `index_format = "elasticlunr_javascript"` (Zola's default) works.

`build_search_index` is the only switch, and Zola reports it per language, so the markup, the script tag and the index all appear and disappear together for whichever languages you enable.
Search in a language other than English additionally needs that language's elasticlunr pipeline functions, which sites now list in `extra.search_stemmers`; the theme loads them after elasticlunr and before parsing the index.
Take those files from weixsong/lunr-languages rather than the npm package of the same name, which calls a lunr API elasticlunr does not implement and dies half way through registering.

The one wrinkle worth knowing is that `zola serve` rewrites the base URL in rendered HTML but not inside the search index, so result links would otherwise send you to the deployed site while you preview locally.
The theme re-roots them onto whatever origin served the index.
