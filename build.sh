#!/usr/bin/env bash
# The build command for the demo site, which this repository doubles as.
set -euo pipefail

zola build

# Pagefind indexes the rendered HTML, so it has to run after Zola on every
# build, CI included: the search field's own component bundle is written by this
# step too, so skipping it leaves the site with no search at all. mise provides
# the binary locally; hosts that build for us have no mise, so fall back to npx,
# which pulls the same latest release that mise.toml tracks.
if command -v pagefind > /dev/null 2>&1; then
    pagefind --site public
else
    npm_config_yes=true npx pagefind@latest --site public
fi
