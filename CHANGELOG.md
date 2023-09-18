## [0.3.1] - 2023-09-18

### Documentation
- (CHANGELOG) Remove unused link to unreleased
- (README) Give the README a little more styling

### Features
- Use page's summary as meta description

### Styling
- Make headers and figure captions darker
- Make blockquotes lighter
- Increase size of subtitle and post meta

[0.3.1]: https://github.com/lukehsiao/zola-pickles/compare/v0.3.1...v0.3.1

## [0.3.0] - 2023-09-12

### Bug Fixes
- (index) Use lang variable instead of config.default_language
- (fonts) Include multiple weights
- Match base font-size with the one used by articles
- Update theme for zola 0.17.1 (#10)

### Build and Dependencies
- (deps) Update to KaTeX v0.16.3
- Add justfile for convenience

### CI/CD
- Add netlify configuration

### Features
- Add webring block for pages
- (tables) Add table shortcode and style like booktabs

### Miscellaneous Tasks
- Increase copyright footer font size to 1.4rem
- Match config.toml with the demo site
- Relicense to `BlueOak-1.0.0`

### Refactor
- (font) Switch body font to Atkinson Hyperlegible
    - **BREAKING**: If a user was using the SourceSansPro or SanFrancisco
      variables before, they will be broken now. But, this way, the
      variable names are more general.
- Allow zooming and scaling

### Styling
- (templates/index) Remove unnecessary newline
- Adopt `selenized-white` color scheme and naming
    - **BREAKING**: The variables for colors are renamed, so if customization was
      done based on those names, they will need to be updated.

[0.3.0]: https://github.com/lukehsiao/zola-pickles/compare/v0.3.0...v0.3.0

## [0.2.0] - 2021-01-09

This update relies on zola v0.13.0 features.

### Removed

- [@lukehsiao]: Removed "polish" macro in favor of built-in emojify support.

## [0.1.1] - 2020-07-07

### Added

- [@lukehsiao]: Enhanced markdown substitutions (dashes, emojis).
- [@lukehsiao]: Enhanced youtube and vimeo shortcodes.
- [@lukehsiao]: Include instant.page prefetching

### Changed

- [@lukehsiao]: Switch to Atom 1.0 feed as default.
- [@lukehsiao]: Show the first 280 chars of page in place of summary if
  summary is missing.
- [@lukehsiao]: Skip meta description if config.description is missing.

### Fixed

- [@urbanslug]: Fix KaTeX shortcode to properly escape characters.
- [@rminderhoud]: Fix template crash when subtitle is missing.

## [0.1.0] - 2020-02-06

Initial release on GitHub.

[@lukehsiao]: https://github.com/lukehsiao
[@rminderhoud]: https://github.com/rminderhoud
[@urbanslug]: https://github.com/urbanslug

[0.2.0]: https://github.com/lukehsiao/zola-pickles/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/lukehsiao/zola-pickles/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/lukehsiao/zola-pickles/releases/tag/v0.1.0
