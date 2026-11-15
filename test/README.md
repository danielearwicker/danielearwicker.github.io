# Math Baseline Regression Tests

This folder contains regression tests for build-time LaTeX math rendering (`_plugins/math.rb`, `_plugins/math_macros.rb`, `bin/render-math`, and `_sass/_math.scss`), with a focus on vertical baseline alignment of inline math expressions.

It is listed under `exclude:` in `_config.yml` so Jekyll never deploys it to `_site/`.

## Running the tests

From the repository root (on the host or inside the Docker container):

```sh
ruby test/math_baseline_test.rb
```

To check that all math SVGs across the site are cached and contain valid baseline metadata:

```sh
bin/render-math --check
```

To render any missing or invalidated math SVGs:

```sh
bin/render-math
```

## How inline math baseline alignment works

1. **LaTeX compilation (`_plugins/math.rb`)**:
   Each inline expression `` `$...$` `` is set inside `\setbox0=\hbox{$...$}` in a `12pt` `article` document with a `dvisvgm` raw special at the start of the math box:
   ```tex
   \setbox0=\hbox{$\special{dvisvgm:raw <desc>BASELINE={?y}</desc>}...$}%
   \box0
   ```
   Using `dvisvgm:raw` (rather than `dvisvgm:message`) is critical because the Docker container (`Dockerfile` / `al-folio-tikz:local`) runs Debian's `dvisvgm 3.0.3`, which does not support `dvisvgm:message` (added in `dvisvgm 3.2`).

2. **Depth calculation**:
   `dvisvgm --no-fonts --exact-bbox` crops the output SVG to the tight ink bounding box (`viewBox="min_x min_y width height"` in TeX/PostScript points, `bp`).
   - The bottom of the SVG image is at `y = min_y + height`.
   - The TeX baseline is at `y = baseline_y` (from `<desc>BASELINE=...</desc>`).
   - The distance from the TeX baseline to the bottom of the SVG is:
     ```
     depth_pt = (min_y + height) - baseline_y
     ```
   - `MathRender.compile` strips the temporary `<desc>BASELINE=...</desc>` element and writes `data-baseline="<depth_pt>"` onto the root `<svg>` element. If `data-baseline` cannot be extracted for an inline expression, `MathRender.compile` raises `MathRender::CompileError`.

3. **HTML & CSS positioning**:
   `MathRender.img_tag` converts `depth_pt` from points (`1pt = 1/72 in`) to CSS pixels (`1px = 1/96 in`, so `px = pt * 4 / 3`) and emits:
   ```html
   <img class="math math-inline" ... style="vertical-align: -<depth_px>px">
   ```
   This shifts the bottom edge of the `<img>` down by `depth_px` below the surrounding text baseline, pinning `y = baseline_y` inside the SVG directly onto the text baseline.
   - Note: Bootstrap/MDB (`mdb.min.css`) sets `img, svg { vertical-align: middle; }` globally. If `style="vertical-align: ..."` is ever missing on an `<img>`, the browser vertically centers the image instead of aligning its baseline, which pushes tall superscript expressions like `` `$\vec{i}^2 = -1$` `` below the baseline and pulls descender expressions like `` `$q$` `` or `` `$yz$` `` above the baseline.

## How `math_baseline_test.rb` verifies alignment

Rather than trusting `MathRender`'s own calculation, `MathBaselineTest#inspect_alignment` inspects the generated SVG and HTML `<img>` independently:
- In `dvisvgm --no-fonts` output, every font glyph `<path id="g..." d="..."/>` in `<defs>` is defined in font coordinates where `y = 0` is the font baseline, and every `<use x="..." y="Y_use" xlink:href="#g..."/>` in `<g id="page1">` places that glyph's baseline at `y = Y_use`.
- Similarly, TikZ macros (`\ket`, `\bra`, `\braket` in `_plugins/math_macros.rb`) use `[baseline=0pt]`, which emits `transform="matrix(.996264 0 0 -.996264 X_origin Y_origin)"` with `Y_origin` at the math baseline.
- Combining `viewBox="min_x min_y width height"` with the `<img>`'s `vertical-align: Vpx`, a glyph at `Y_use` lands at:
  ```
  offset_px = ((min_y + height) - Y_use) * (4.0 / 3.0) + V
  ```
  relative to the surrounding HTML text baseline (`0px`).
- The test suite verifies that:
  1. Main-line glyphs sit at `0.0px` relative to the text baseline.
  2. Each expression in `BASELINE_CASES` matches its expected TeX depth (`0.0pt` for flat-bottomed glyphs like `1`, `4`, `\vec{i}`, `\vec{i}^2 = -1`; `~0.12pt–0.25pt` for curved-bottom glyphs like `x`, `r`, `r^{-1}`, `90^\circ`; `~2.3pt–2.44pt` for descenders like `p`, `q`, `y`, `\vec{j}`; `~3.0pt` for `()`, `/`; `~3.26pt` for `\ket{0}`).
  3. Adding tall superscripts, subscripts, or descenders next to `\vec{i}` never shifts `\vec{i}` off the baseline.
  4. Every inline expression in `_posts/2026-11-15-qm25.md` and every cached inline SVG across all posts in `_posts/` has valid baseline metadata.

## Adding new regression test cases

Add new `[tex, expected_depth_pt, description]` entries to `BASELINE_CASES` in `test/math_baseline_test.rb` and run `ruby test/math_baseline_test.rb`.
