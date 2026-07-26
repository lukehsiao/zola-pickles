# just manual: https://github.com/casey/just

_default:
    @just --list

# Install release tooling
[group('build')]
install:
    pnpm install

# Update all dependencies
[group('build')]
upgrade:
    pnpm up --recursive
    pnpm install

# Interactively create a changeset.
[group('release')]
changeset *args:
    pnpm changeset {{ args }}

# Append git-stats to the latest CHANGELOG entry
_append-git-stats:
    #!/usr/bin/env bash
    set -euo pipefail

    version=$(jaq -r '.version' package.json)
    prev_tag=$(git describe --tags --abbrev=0 2>/dev/null || true)

    if [ -z "$prev_tag" ]; then
        echo "No previous tag found, skipping git-stats"
        exit 0
    fi

    if ! command -v git-stats &> /dev/null; then
        echo "Warning: git-stats not found, skipping"
        exit 0
    fi

    if ! grep -q "^## ${version}$" CHANGELOG.md; then
        echo "Warning: '## ${version}' not found in CHANGELOG.md, skipping"
        exit 0
    fi

    stats=$(git-stats "${prev_tag}..HEAD")

    # Find the new version header line number
    version_line=$(grep -n "^## ${version}$" CHANGELOG.md | head -1 | cut -d: -f1)

    # Find the next section boundary (## or ---) after it
    next_section=$(tail -n "+$((version_line + 1))" CHANGELOG.md \
        | grep -n "^## \|^---$" \
        | head -1 \
        | cut -d: -f1)

    if [ -n "$next_section" ]; then
        insert_at=$((version_line + next_section - 1))
    else
        insert_at=$(wc -l < CHANGELOG.md)
    fi

    # Build the stats block (HTML pre tag survives changesets processing)
    stats_block=$(printf '<pre>\n$ git-stats %s..v%s\n%s\n</pre>' "$prev_tag" "$version" "$stats")

    # Insert into CHANGELOG.md
    {
        head -n "$insert_at" CHANGELOG.md
        echo "$stats_block"
        echo
        tail -n "+$((insert_at + 1))" CHANGELOG.md
    } > CHANGELOG.md.tmp
    mv CHANGELOG.md.tmp CHANGELOG.md

    echo "Added git-stats to CHANGELOG.md for v${version}"

# Create a version bump
[group('release')]
version *args:
    pnpm changeset version {{ args }}
    just _append-git-stats

# Tag a new version
[group('release')]
publish:
    pnpm changeset publish

# Show pending changesets and expected version bumps.
[group('release')]
status *args:
    pnpm changeset status {{ args }}
