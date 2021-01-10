# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/lukehsiao/zola-pickles/compare/v0.2.0...master
[0.2.0]: https://github.com/lukehsiao/zola-pickles/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/lukehsiao/zola-pickles/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/lukehsiao/zola-pickles/releases/tag/v0.1.0
