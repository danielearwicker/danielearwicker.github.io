#!/usr/bin/env ruby
# frozen_string_literal: true

# Regression test suite for inline math SVG baseline alignment.
#
# Run with:
#   ruby test/math_baseline_test.rb

require "minitest/autorun"
require "tmpdir"
require "yaml"

ROOT = File.expand_path("..", __dir__)
require File.join(ROOT, "_plugins", "math")

class MathBaselineTest < Minitest::Test
  PT_TO_PX = 4.0 / 3.0

  # Parses an SVG and its rendered <img> tag to independently compute where
  # each glyph's baseline lands relative to the surrounding HTML text baseline.
  #
  # In dvisvgm's output:
  #   - viewBox="min_x min_y width height" is in TeX/PostScript points (bp).
  #   - The bottom edge of the SVG image is at y = min_y + height (in pt).
  #   - Each <path id="g..." d="..."/> in <defs> is defined with y = 0 at the
  #     font's baseline (negative y is above the baseline, positive y is below).
  #   - Each <use x="..." y="Y_use" xlink:href="#g..."/> places that glyph with
  #     its font baseline at y = Y_use in SVG coordinates.
  #   - Each TikZ picture with [baseline=0pt] (used by \ket, \bra, \braket)
  #     applies transform="matrix(.996264 0 0 -.996264 X_origin Y_origin)" where
  #     Y_origin is the math baseline in SVG coordinates.
  #
  # In the browser:
  #   - CSS `vertical-align: Vpx` shifts the bottom edge of the <img> by V px
  #     relative to the surrounding text baseline (0px).
  #   - If `style="vertical-align: ..."` is missing from <img>, Bootstrap/MDB's
  #     `img, svg { vertical-align: middle; }` centers the image against half the
  #     text x-height (~4px), placing the image bottom at (4 - height_px / 2) px.
  #   - Therefore, a glyph at SVG y = Y_use has its baseline at:
  #       offset_px = ((min_y + height) - Y_use) * (4/3) + effective_vertical_align_px
  #     relative to the surrounding text baseline (positive = too high, negative = too low).
  def inspect_alignment(tex, svg, html)
    vb_match = svg.match(/viewBox=['"]([^\s'"]+)\s+([^\s'"]+)\s+([^\s'"]+)\s+([^\s'"]+)['"]/)
    assert vb_match, "Expected viewBox in SVG for $#{tex}$"

    min_x, min_y, width_pt, height_pt = vb_match.captures.map(&:to_f)
    bottom_y = min_y + height_pt

    data_baseline_match = svg.match(/data-baseline="(-?[\d.]+)"/)
    data_baseline = data_baseline_match ? data_baseline_match[1].to_f : nil

    style_match = html.match(/style="vertical-align:\s*(-?[\d.]+)px"/)
    explicit_valign_px = style_match ? style_match[1].to_f : nil

    height_attr_match = html.match(/\bheight="(\d+)"/)
    height_px = height_attr_match ? height_attr_match[1].to_f : (height_pt * PT_TO_PX).round

    # Without an explicit inline vertical-align, mdb.min.css applies
    # `img, svg { vertical-align: middle }`, which aligns the vertical midpoint
    # of the image with the baseline + half the x-height (~4px for 16px body text).
    effective_valign_px = explicit_valign_px.nil? ? (4.0 - height_px / 2.0) : explicit_valign_px

    # Collect y-coordinates of top-level <use> elements and TikZ baseline origins.
    use_ys = svg.scan(/<use\b[^>]*?\by=['"]([\d.]+)['"]/).flatten.map(&:to_f)
    tikz_ys = svg.scan(/matrix\(\.996264 0 0 -\.996264 [\d.]+ ([\d.]+)\)/).flatten.map(&:to_f)
    anchor_ys = (use_ys + tikz_ys).uniq

    # For any glyph sitting on the main math baseline (y = Y_base), this is its
    # vertical offset (in px) from the surrounding HTML text baseline.
    glyph_offsets_px = anchor_ys.map do |y|
      (((bottom_y - y) * PT_TO_PX) + effective_valign_px).round(2)
    end

    {
      tex: tex,
      min_x: min_x,
      min_y: min_y,
      width_pt: width_pt,
      height_pt: height_pt,
      bottom_y: bottom_y,
      data_baseline: data_baseline,
      explicit_valign_px: explicit_valign_px,
      effective_valign_px: effective_valign_px,
      anchor_ys: anchor_ys,
      glyph_offsets_px: glyph_offsets_px,
    }
  end

  def render_cached_or_compile(tex)
    key = MathRender.cache_key(tex, false)
    path = MathRender.svg_absolute_path(key, ROOT)
    svg = File.exist?(path) ? File.read(path) : MathRender.compile(tex, false)
    html = MathRender.img_tag(key, tex, false, svg, "")
    inspect_alignment(tex, svg, html)
  end

  # Asserts that an inline math expression has valid baseline metadata and that
  # its main-line glyphs sit on the text baseline (0px offset) at the expected
  # vertical-align depth.
  def assert_on_baseline(info, expected_depth_pt: nil, tolerance_pt: 0.15)
    tex = info[:tex]

    refute_nil info[:data_baseline],
      "Inline math $#{tex}$ is missing data-baseline in its SVG " \
      "(causes browser to fall back to vertical-align: middle, shifting baseline to #{info[:glyph_offsets_px].inspect}px)"

    refute_nil info[:explicit_valign_px],
      "Inline math $#{tex}$ is missing style=\"vertical-align: ...\" on <img>"

    # At least one main-line glyph or TikZ origin in standard baseline expressions
    # should land at 0.0px relative to the surrounding text baseline.
    unless info[:anchor_ys].empty?
      closest_to_baseline = info[:glyph_offsets_px].min_by(&:abs)
      assert_in_delta 0.0, closest_to_baseline, 0.1,
        "Expected main-line glyph in $#{tex}$ to sit on the text baseline (0px), " \
        "but glyph baseline offsets were #{info[:glyph_offsets_px].inspect}px " \
        "(vertical-align: #{info[:effective_valign_px]}px, data-baseline: #{info[:data_baseline].inspect})"
    end

    if expected_depth_pt
      assert_in_delta expected_depth_pt, info[:data_baseline], tolerance_pt,
        "Expected TeX baseline depth for $#{tex}$ to be ~#{expected_depth_pt}pt, got #{info[:data_baseline]}pt"
    end
  end

  # ---------------------------------------------------------------------------
  # 1. Regression test for qm25: "It's just \vec{i}^2 = -1."
  # ---------------------------------------------------------------------------

  def test_qm25_vec_i_squared_equals_minus_one_sits_on_baseline
    info = render_cached_or_compile('\vec{i}^2 = -1')

    # \vec{i}^2 = -1 has a tall superscript (^2) making the image ~9.64pt (13px)
    # tall, but none of its characters (\mathbf{i}, ^2, =, -, 1) descend below
    # the baseline. Its depth is 0pt and vertical-align must be 0px.
    # When data-baseline was missing, vertical-align: middle pushed it down to -2.5px.
    assert_on_baseline(info, expected_depth_pt: 0.0, tolerance_pt: 0.05)
    assert_in_delta 0.0, info[:explicit_valign_px], 0.05,
      '\vec{i}^2 = -1 has no descenders and must have vertical-align: 0px'
  end

  # ---------------------------------------------------------------------------
  # 2. Curated regression table across baseline categories
  # ---------------------------------------------------------------------------

  BASELINE_CASES = [
    # [tex, expected_depth_pt, description]
    # Flat-bottomed glyphs on the baseline (depth = 0pt, vertical-align = 0px)
    ["1",                         0.0,    "digit 1 rests flat on baseline"],
    ["4",                         0.0,    "digit 4 rests flat on baseline"],
    ["-1",                        0.0,    "minus and digit 1 rest flat on baseline"],
    ['\vec{i}',                   0.0,    "bold i rests flat on baseline"],
    ['-\vec{i}',                  0.0,    "minus and bold i rest flat on baseline"],
    ['\vec{k}',                   0.0,    "bold k rests flat on baseline"],
    ['\vec{i}^2 = -1',            0.0,    "tall superscript with flat baseline glyphs"],

    # Curved-bottom glyphs with slight optical overshoot (~0.12pt to 0.25pt)
    ["x",                         0.12,   "italic x has slight curve overshoot"],
    ["w",                         0.12,   "italic w has slight curve overshoot"],
    ["c",                         0.12,   "italic c has slight curve overshoot"],
    ["z",                         0.12,   "italic z has slight curve overshoot"],
    ["s",                         0.12,   "italic s has slight curve overshoot"],
    ["i",                         0.12,   "italic i has slight curve overshoot"],
    ["r",                         0.12,   "italic r has slight curve overshoot"],
    ['\theta',                    0.12,   "theta has slight curve overshoot"],
    ["zx",                        0.12,   "zx has no descenders"],
    ['r^{-1}',                    0.12,   "r with tall superscript (-1) keeps r on baseline"],
    ['rr^{-1} = 1',               0.12,   "rr^{-1} = 1 keeps r and 1 on baseline"],
    ['r^*',                       0.12,   "r with asterisk superscript keeps r on baseline"],
    ["0",                         0.25,   "digit 0 has slight curve overshoot"],
    ["x=0",                       0.25,   "x=0 depth determined by digit 0"],
    ['90^\circ',                  0.25,   "90 degrees keeps 90 on baseline"],
    ['180^\circ',                 0.25,   "180 degrees keeps 180 on baseline"],

    # Plus sign extends ~0.92pt below the baseline
    ["1 + 0i = 1",                0.92,   "plus sign extends slightly below baseline"],
    ["0 + 1i = i",                0.92,   "plus sign extends slightly below baseline"],
    ["-1 + 0i",                   0.92,   "plus sign extends slightly below baseline"],

    # Subscripts hang below the baseline
    ['u_x \vec{i}',               1.87,   "subscript x hangs below baseline while u and i sit on it"],

    # Commas and descender letters (g, j, p, q, y) extend ~2.3pt-2.44pt below baseline
    ["w=1, x=0",                  2.31,   "comma descender hangs below baseline"],
    ["w=-1, x=0",                 2.31,   "comma descender hangs below baseline"],
    ["p",                         2.32,   "italic p descender hangs below baseline"],
    ["q",                         2.32,   "italic q descender hangs below baseline"],
    ['q^*',                       2.32,   "q^* has both superscript * and q descender"],
    ['\vec{j}',                   2.39,   "bold j descender hangs below baseline"],
    ['\vec{i}\vec{j} = \vec{k}',  2.39,   "bold j descender with flat i and k"],
    ['\vec{i}\vec{k} = -\vec{j}', 2.39,   "bold j descender at end of equation"],
    ['\vec{j}\vec{k}',            2.39,   "bold j descender next to bold k"],
    ["y",                         2.44,   "italic y descender hangs below baseline"],
    ["yz",                        2.44,   "italic y descender next to z"],
    ["xy",                        2.44,   "italic y descender after x"],
    ["jk",                        2.44,   "italic j descender next to k"],
    ["x = 0, y^2 + z^2 = 1",      2.44,   "tall superscripts + comma + y descender"],
    ['x \ne 0',                   2.58,   "not-equal slash extends below baseline"],

    # Parentheses and slashes extend ~3.0pt below baseline
    ["(x, y, z)",                 3.00,   "parentheses and commas extend ~3pt below baseline"],
    ["(w=-1, x=0, y=0, z=0)",     3.00,   "parentheses extend ~3pt below baseline"],
    ["1/2",                       2.99,   "slash extends ~3pt below baseline"],

    # TikZ bra-ket fences (\ket, \bra, \braket) extend ~3.26pt below baseline
    ['\ket{0}',                   3.26,   "ket fence extends below baseline while 0 sits on it"],
    ['\bra{\psi}',                3.26,   "bra fence extends below baseline"],
    ['\braket{\phi}{\psi}',       3.26,   "braket fence extends below baseline"],
  ].freeze

  BASELINE_CASES.each_with_index do |(tex, expected_depth, desc), idx|
    define_method("test_case_#{idx}_#{desc.tr('^a-zA-Z0-9', '_')}") do
      info = render_cached_or_compile(tex)
      assert_on_baseline(info, expected_depth_pt: expected_depth)
    end
  end

  # ---------------------------------------------------------------------------
  # 3. Check every inline math expression in post qm25
  # ---------------------------------------------------------------------------

  def test_all_qm25_inline_math_expressions_sit_on_baseline
    qm25_path = File.join(ROOT, "_posts", "2026-11-15-qm25.md")
    content = File.read(qm25_path)
    inline_exprs = MathRender.extract_from_markdown(content).reject { |_, display| display }.map(&:first).uniq

    refute_empty inline_exprs, "Expected inline math expressions in qm25.md"

    inline_exprs.each do |tex|
      info = render_cached_or_compile(tex)
      assert_on_baseline(info)
    end
  end

  # ---------------------------------------------------------------------------
  # 4. Check all cached inline math SVGs across the entire blog
  # ---------------------------------------------------------------------------

  def test_all_posts_cached_inline_math_have_valid_baseline
    posts = Dir.glob(File.join(ROOT, "_posts", "**", "*.{md,markdown,html}")).sort
    failures = []

    posts.each do |post|
      rel_post = post.sub("#{ROOT}/", "")
      MathRender.extract_from_markdown(File.read(post)).each do |tex, display|
        next if display

        key = MathRender.cache_key(tex, false)
        path = MathRender.svg_absolute_path(key, ROOT)
        unless File.exist?(path)
          failures << "#{rel_post}: missing cached SVG for $#{tex}$ (#{key}.svg)"
          next
        end

        svg = File.read(path)
        html = MathRender.img_tag(key, tex, false, svg, "")
        info = inspect_alignment(tex, svg, html)

        if info[:data_baseline].nil? || info[:explicit_valign_px].nil?
          failures << "#{rel_post}: $#{tex}$ (#{key}.svg) missing data-baseline " \
                      "(glyph offsets with middle fallback: #{info[:glyph_offsets_px].inspect}px)"
        end
      end
    end

    assert_empty failures, "Found inline math expressions with missing/invalid baseline:\n  #{failures.uniq.join("\n  ")}"
  end

  # ---------------------------------------------------------------------------
  # 5. Fresh compilation, Docker/dvisvgm 3.0 compatibility, and cache validation
  # ---------------------------------------------------------------------------

  def test_fresh_compile_extracts_baseline_and_strips_marker
    skip "TeX toolchain not available" unless MathRender.toolchain_available?

    %w[\vec{i}^2\ =\ -1 \vec{j} (x,\ y,\ z) 1/2 \ket{0} q^*].each do |tex|
      svg = MathRender.compile(tex, false)
      refute_includes svg, "<desc>BASELINE=", "Temporary baseline marker should be stripped from SVG"
      key = MathRender.cache_key(tex, false)
      html = MathRender.img_tag(key, tex, false, svg, "")
      info = inspect_alignment(tex, svg, html)
      assert_on_baseline(info)
    end
  end

  def test_vec_i_baseline_is_invariant_across_sibling_constructs
    skip "TeX toolchain not available" unless MathRender.toolchain_available?

    # Adding a tall superscript (^2), a descender (\vec{j}), a subscript (u_x),
    # or a minus sign must never shift the baseline of \vec{i} away from 0px.
    expressions = [
      '\vec{i}',
      '-\vec{i}',
      '\vec{i}^2 = -1',
      '\vec{i}\vec{j} = \vec{k}',
      '\vec{i}\vec{k} = -\vec{j}',
      'u_x \vec{i}',
    ]

    expressions.each do |tex|
      info = render_cached_or_compile(tex)
      assert_on_baseline(info)
      closest = info[:glyph_offsets_px].min_by(&:abs)
      assert_in_delta 0.0, closest, 0.05,
        "Expected \\vec{i} baseline in $#{tex}$ to stay pinned at 0px, got #{closest}px"
    end
  end

  def test_valid_cached_svg_rejects_inline_svg_without_data_baseline
    Dir.mktmpdir("math-test") do |dir|
      broken_svg = File.join(dir, "broken.svg")
      File.write(broken_svg, "<svg width='10pt' height='10pt' viewBox='0 0 10 10'></svg>")
      refute MathRender.valid_cached_svg?(broken_svg, false),
        "Inline math SVG without data-baseline must be treated as invalid"
      assert MathRender.valid_cached_svg?(broken_svg, true),
        "Display math SVG does not require data-baseline"

      valid_svg = File.join(dir, "valid.svg")
      File.write(valid_svg, '<svg data-baseline="0.0" width="10pt" height="10pt" viewBox="0 0 10 10"></svg>')
      assert MathRender.valid_cached_svg?(valid_svg, false),
        "Inline math SVG with data-baseline should be valid"
    end
  end

  def test_test_folder_is_excluded_from_jekyll_deploy
    config = YAML.load_file(File.join(ROOT, "_config.yml"))
    excluded = Array(config["exclude"])
    assert excluded.any? { |entry| entry.sub(%r{/\z}, "") == "test" },
      "Expected 'test/' to be listed under `exclude:` in _config.yml"
  end
end
