---
"zola-pickles": minor
---

**Breaking**: the theme now requires Zola 0.23. That release removed shortcodes and moved to Tera 2, and neither change is backwards compatible.

Shortcodes are now Tera components, defined together in `templates/components.html`. Call sites change from `{% figure(src="x") %}...{% end %}` to `{% <figure src="x"> %}...{% </figure> %}`, non-string arguments are braced as in `block={true}`, and the bodyless form becomes self-closing: `{{ vimeo(id="x") }}` is now `{{ <vimeo id="x" /> }}`.

`post_macros.html` is gone. Tera 2 removed macros entirely, so the post title markup is now a `post_title` component that templates call as `{{ <post_title page /> }}`.

Two filter changes come from Tera 2: `linebreaksbr` is now `newlines_to_br`, and the `%+` date shorthand is rejected, so feed and post timestamps are formatted with an explicit `%Y-%m-%dT%H:%M:%S%:z`. The feed also stops emitting a `<updated>` element built from a `default`-filtered value, because Tera 2's `default` tests presence rather than truthiness and would pass a null through to `date`.

The example site configuration is now `zola.toml`, the name Zola 0.23 prefers, and the base template reads `config.generate_feeds` rather than the deprecated `config.generate_feed` alias. Rendered output is unchanged by both.
