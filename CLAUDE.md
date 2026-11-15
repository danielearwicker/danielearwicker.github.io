# Repository Guide

This is a Jekyll blog (based on `al-folio`) with custom build-time LaTeX rendering for both math equations and TikZ diagrams.

## Build-Time Math & TikZ Rendering

Instead of client-side MathJax, math and TikZ are compiled at build time into static SVGs using real `latex` and `dvisvgm`, and cached in the repository so CI (which does not have TeX installed) can build the site directly from the committed SVGs:

- **Math plugin**: `_plugins/math.rb` and `_plugins/math_macros.rb` (defines `\ket`, `\bra`, `\braket` using TikZ).
  - Cached SVGs live in `assets/img/math/<hash>.svg`.
  - Batch CLI script: `bin/render-math` (`--force` to re-render all, `--prune` to delete unused SVGs, `--check` to verify all expressions have valid cached SVGs).
  - Inline math SVGs store their TeX depth in `<svg data-baseline="<depth_pt>" ...>`, which `MathRender.img_tag` converts into `style="vertical-align: -<depth_px>px"` on `<img class="math math-inline">`.
- **TikZ plugin**: `_plugins/tikz.rb`.
  - Cached SVGs live in `assets/img/tikz/<hash>.svg`.
  - Batch CLI script: `bin/render-tikz`.

## Regression Tests for Math Baseline Alignment

A regression test suite in [`test/`](test/README.md) (excluded from Jekyll deployment in `_config.yml`) validates that inline math expressions sit properly on the surrounding text baseline:

```sh
ruby test/math_baseline_test.rb
```

Always run `ruby test/math_baseline_test.rb` and `bin/render-math --check` after modifying `_plugins/math.rb`, `_plugins/math_macros.rb`, `_sass/_math.scss`, or adding new math-heavy posts.

## Important Pitfalls

1. **Host vs. Docker `dvisvgm` versions**:
   - Local development often runs `jekyll serve` inside Docker (`docker compose up`, image `al-folio-tikz:local` defined in `Dockerfile`), which installs Debian's `dvisvgm 3.0.3`.
   - The macOS host typically has a newer TeX Live `dvisvgm` (e.g. `3.2+`).
   - `_plugins/math.rb` uses `\special{dvisvgm:raw <desc>BASELINE={?y}</desc>}` because `dvisvgm:raw` works in both `dvisvgm 3.0.x` and `3.2+` (whereas `dvisvgm:message` only exists in `3.2+` and is silently ignored by `3.0.3`).
2. **Restarting Jekyll after plugin changes**:
   - Jekyll's `--watch` mode does not reload files in `_plugins/` or `_config.yml`. If the Docker container (`danielearwickergithubio-jekyll-1`) is running, restart it (`docker restart danielearwickergithubio-jekyll-1`) after changing `_plugins/math.rb` or `_config.yml`.
3. **Cache invalidation**:
   - Bump `PREAMBLE_VERSION` in `_plugins/math.rb` if you change the LaTeX preamble or macros in `_plugins/math_macros.rb`, then run `bin/render-math --prune`.
