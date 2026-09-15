<h1 align="center">
    🥒<br>
    zola-pickes
</h1>
<div align="center">
    <strong>Pickles is a clean, responsive blog theme for <a href="https://www.getzola.org/">Zola</a> based on the <a href="https://github.com/mismith0227/hugo_theme_pickles">Hugo theme</a> with the same name.</strong>
</div>
<br>
<div align="center">
  <a href="https://zola-pickles.pages.dev/">
    <img src="https://img.shields.io/badge/demo-website-forestgreen" alt="demo website"></a>
  <a href="https://github.com/lukehsiao/zola-pickles/blob/main/LICENSE.md">
    <img src="https://img.shields.io/badge/license-BlueOak--1.0.0-blue" alt="License">
  </a>
</div>
<br>

![pickles screenshot](https://github.com/lukehsiao/zola-pickles/blob/main/screenshot.png?raw=true)

## Installation

Requires Zola 0.23 or newer.

First download this theme to your `themes` directory:

```bash
$ cd themes
$ git clone https://github.com/lukehsiao/zola-pickles.git
```
and then enable it in your `zola.toml`:

```toml
theme = "zola-pickles"
```

The theme requires putting the posts in the root of the `content` folder and to enable pagination, for example in `content/_index.md`.

```
+++
paginate_by = 5
sort_by = "date"
insert_anchor_links = "right"
+++
```

## Reference guides

## Configuration Options

```toml
[extra]
# A line to display underneath the main title
subtitle = "Example subtitle"

# Text to display in the footer of the page
copyright = "Copyright authors year"

# Your Google Analytics ID
analytics = ""

# See below
katex_enable = false

# See below
instantpage_enable = false

# Only needed for search in a language other than English. See below.
search_stemmers = []
```

A full example configuration is included in zola.toml.

Note how pickles also expects `title` and `description` to also be set in the Zola configuration.

### KaTeX math formula support

This theme contains math formula support using [KaTeX](https://katex.org/), which can be enabled by setting `katex_enable = true` in the `extra` section of `zola.toml`.

After enabling this extension, the `katex` component can be used in documents:
* `{% <katex block={true}> %}\KaTeX{% </katex> %}` to typeset a block of math formulas,
  similar to `$$...$$` in LaTeX

#### Customizing math rendering

The KaTeX assets are wrapped in a `katex` template block, so a site can replace the default setup without copying the whole base template.
(To merely add scripts after it, use the `extra_head` block instead.)
The theme's other templates extend `index.html` by its bare name, so one site-level override applies to every page.

For example, to drop the `math/tex` script-tag renderer and use KaTeX's [auto-render extension](https://katex.org/docs/autorender.html), which typesets `$$...$$` in your markdown directly, create `templates/index.html` in your site containing:

```html
{% extends "zola-pickles/templates/index.html" %}

{% block katex %}
{% if config.extra.katex_enable %}
<link rel="stylesheet" href="{{ get_url(path="css/katex.min.css") }}">
<script defer src="{{ get_url(path="js/katex.min.js") }}"></script>
<script defer src="{{ get_url(path="js/auto-render.min.js") }}"
    onload="renderMathInElement(document.body, {throwOnError: false});"></script>
{% endif %}
{% endblock katex %}
```

The theme ships `auto-render.min.js` version-locked to its bundled KaTeX, so there is nothing else to vendor.
Note that raw TeX written in markdown passes through the markdown parser before KaTeX sees it: `\\` row separators and expressions like `$a*b$` get mangled on the way.
The `katex` component bypasses the markdown parser entirely, which makes it the robust choice for multiline environments like `align`, but it is rendered by `mathtex-script-type.min.js`.
The recipe above drops that renderer, silently disabling the component; keep its `<script>` line alongside auto-render if you want both.

### Figure Component

The figure component is convenient for captioning figures.

```
{% <figure link="https://www.example.com/" src="https://www.example.com/img.jpeg" alt="sample alt text"> %}
Your caption here.
{% </figure> %}
```

### Table Component

The table component is convenient for making mobile-friendly tables (centered with overflow scrollbar).

```
{% <table> %}
| Item         | Price | # In stock |
| :----------- | ----: | ---------: |
| Juicy Apples |  1.99 |        739 |
| Bananas      |  1.89 |          6 |
{% </table> %}
```

### Search

The theme renders a search dialog on top of Zola's built-in [search index](https://www.getzola.org/documentation/content/search/).
There is no separate theme option: the UI appears when the index exists.

```toml
# Must stay in the root table, above the first `[table]` header. TOML assigns
# a bare key to whichever table precedes it, so a line below `[slugify]` or
# `[search]` silently does nothing.
build_search_index = true

[search]
# The theme reads the elasticlunr JavaScript index, which is Zola's default.
# The `fuse_*` and `*_json` formats will not work with it.
index_format = "elasticlunr_javascript"
```

The trigger is a single magnifying glass in the top right of the content column, deliberately quiet so it does not compete with the site title, and it stays there at every width.
`Ctrl`/`Cmd`+`K` or `/` opens it, `Esc` closes it, the arrow keys walk the results, and `Enter` opens the highlighted one.
Results update as you type, with the matched words marked in the title and in an excerpt of the page.

Neither elasticlunr nor the index is requested until you hover, focus, or open the search control, so readers who never search download nothing but the dialog's own JavaScript: 14 kB unminified, about 4.5 kB over the wire once the server compresses it.
The index itself holds the full text of every page and grows accordingly.
On a large site, `truncate_content_length` in `[search]` cuts it down, but understand what you are buying: Zola truncates each page before indexing it, so words past the cutoff are not merely missing from the excerpt, they are missing from the index and can never be found.

#### Languages other than English

Zola indexes each language separately, and `build_search_index` is read per language, so search follows whichever languages you turn it on for:

```toml
build_search_index = true # the default language

[languages.fr]
build_search_index = true
```

A non-English index is built with that language's analysis pipeline, and elasticlunr refuses to load an index whose pipeline functions it does not know.
Such a site has to supply the matching stemmer files, in dependency order:

```toml
[extra]
search_stemmers = ["js/lunr.stemmer.support.js", "js/lunr.fr.js"]
```

Take those files from [weixsong/lunr-languages](https://github.com/weixsong/lunr-languages), the fork Zola's own documentation points at, and drop them in your site's `static/js`.
The `lunr-languages` package on npm is a different project and will not work here: its language files call `lunr.generateStopWordFilter`, which elasticlunr does not implement, so they throw part way through and leave the stopword filter unregistered.
The theme loads whatever you list after elasticlunr and before the index is parsed, which is the window those files need.

### Fontawesome

This theme includes fontawesome, so that fontawesome icons can be directly used.

### Instant.page

The theme contains instant.page prefetching. This can be enabled by setting `instantpage_enable = true` in the `extra` section of `zola.toml`.

## Showing article summaries

By default, the theme will use the first 280 characters of your post as a summary, if a proper [page summary](https://www.getzola.org/documentation/content/page/#summary) using `<!-- more -->` is not provided.
For more sensible summaries, we recommend using the manual more indicator.
