---
"zola-pickles": patch
---

**refactor**: site search is now [Pagefind](https://pagefind.app/) behind `extra.search_enable`, replacing the elasticlunr dialog that `build_search_index` used to switch on.

Pagefind indexes the built HTML instead of the Markdown sources, so it runs after Zola on every build, `pagefind --site public`, and that step has to be added to the build command on hosts that build for you.
In exchange, Zola's own search index can be turned off: on a blog of any size it was the single largest file the site shipped, and the theme no longer reads it.
`extra.search_stemmers` is gone with it, because Pagefind gets the language from `<html lang>` and ships that language's stemmer itself.
