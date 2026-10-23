# frozen_string_literal: true

# Build-time rendering of TeX math to static SVG.
#
# Markdown sources write math in the usual MathJax style:
#
#   inline $x^2$ and display $$e^{i\pi} + 1 = 0$$
#
# but instead of shipping MathJax to the reader, each expression is compiled
# here with latex + dvisvgm and replaced by an <img> pointing at a static SVG
# under assets/img/math/.
#
# SVGs are cached by a hash of the expression and whether it is inline or
# display, so an expression is only compiled when it is new or has been edited.
# The cache is committed to the repository, so CI (which has no TeX) finds every
# SVG already present. Run bin/render-math on a machine with TeX to populate the
# cache locally, exactly like bin/render-tikz.
#
# Two things differ from the TikZ renderer:
#   - We intercept the *rendered HTML* (post_render), where kramdown has already
#     turned $$...$$ into \[...\]; inline $...$ is left as-is.
#   - We use the article class rather than standalone, because standalone's
#     preview cropping breaks display-math environments (\[ \], align*,
#     eqnarray*). Cropping is done by dvisvgm --exact-bbox instead.
#
# This file is loaded both by Jekyll (as a plugin) and by bin/render-math (as a
# plain library), so everything outside the `defined?(Jekyll)` guard at the
# bottom must stay free of Jekyll dependencies -- and Ruby 2.6 compatible.

require "digest"
require "fileutils"
require "open3"
require "tmpdir"

module MathRender
  CACHE_DIR = File.join("assets", "img", "math")

  # Scale applied by dvisvgm. TeX's natural sizing is tuned for print and comes
  # out noticeably small on screen; the article class is set to 12pt so that,
  # with no zoom, an em of math lands close to the ~16px body text.
  ZOOM = 1.0

  # Bump to invalidate every cached SVG, e.g. after changing the preamble below.
  PREAMBLE_VERSION = 2

  # Display math: kramdown turned $$...$$ into \[...\].
  DISPLAY_RE = /\\\[(.*?)\\\]/m

  # Inline math: $...$ with no dollar sign or newline inside, and not part of a
  # $$...$$ pair (so currency like "$$$" is left alone).
  INLINE_RE = /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/

  # Display math as it appears in raw markdown: $$...$$ (again not $$$).
  DISPLAY_MD_RE = /(?<!\$)\$\$(?!\$)(.*?)\$\$(?!\$)/m

  class CompileError < StandardError; end

  module_function

  # Identifies an expression by its source and display mode, so editing either
  # yields a new file and stale ones become detectable.
  def cache_key(tex, display)
    Digest::SHA256.hexdigest(
      [PREAMBLE_VERSION.to_s, ZOOM.to_s, display ? "1" : "0", tex.strip].join("\x00")
    )[0, 16]
  end

  def svg_relative_path(key)
    File.join(CACHE_DIR, "#{key}.svg")
  end

  def svg_absolute_path(key, root)
    File.join(root, svg_relative_path(key))
  end

  def toolchain_available?
    return @toolchain_available unless @toolchain_available.nil?
    @toolchain_available = %w[latex dvisvgm].all? do |tool|
      system("command -v #{tool} > /dev/null 2>&1")
    end
  end

  # Display-math environments that are self-contained and must NOT be wrapped in
  # \[...\] (unlike bmatrix/matrix/cases/aligned, which need to be inside math).
  DISPLAY_ENV_RE = /^\s*\\begin\{(?:align\*?|eqnarray\*?|gather\*?|multline\*?|flalign\*?|alignat\*?|equation\*?|displaymath)\}/

  # Builds a standalone document around a single math expression.
  def build_document(tex, display)
    # LaTeX treats newlines as whitespace; collapse them so a blank line inside
    # a single $$...$$ block (two equations separated by an empty line) doesn't
    # trigger "Missing $ inserted".
    tex = tex.gsub(/[\r\n]+/, " ")

    if display
      body = tex =~ DISPLAY_ENV_RE ? tex : "\\[#{tex}\\]"
      <<~TEX
        \\documentclass[12pt]{article}
        \\pagestyle{empty}
        \\usepackage{amsmath, amssymb, amsfonts}
        \\begin{document}
        #{body}
        \\end{document}
      TEX
    else
      # Set the math in a box and dump its metrics so we can align the baseline
      # of the resulting image with the surrounding text.
      <<~TEX
        \\documentclass[12pt]{article}
        \\pagestyle{empty}
        \\usepackage{amsmath, amssymb, amsfonts}
        \\newwrite\\mathmeta
        \\immediate\\openout\\mathmeta=\\jobname.meta
        \\begin{document}
        \\setbox0=\\hbox{$#{tex}$}%
        \\immediate\\write\\mathmeta{\\the\\ht0,\\the\\dp0,\\the\\wd0}%
        \\box0
        \\immediate\\closeout\\mathmeta
        \\end{document}
      TEX
    end
  end

  # Compiles an expression and returns the SVG as a string. Inline math gets a
  # data-baseline attribute carrying its TeX depth (in pt) so the browser can pin
  # the baseline of the image to the text baseline.
  def compile(tex, display)
    unless toolchain_available?
      raise CompileError, "latex and dvisvgm are required to render math"
    end

    Dir.mktmpdir("math") do |dir|
      file = File.join(dir, "math.tex")
      File.write(file, build_document(tex, display))

      out, _status = Open3.capture2e(
        "latex", "-interaction=nonstopmode", "-halt-on-error",
        "-output-directory=#{dir}", file
      )
      dvi = File.join(dir, "math.dvi")
      unless File.exist?(dvi)
        raise CompileError, "latex failed:\n#{tex_errors(out)}"
      end

      depth = display ? nil : read_depth(File.join(dir, "math.meta"))

      svg = File.join(dir, "math.svg")
      out, _status = Open3.capture2e(
        "dvisvgm", "--no-fonts", "--exact-bbox", "--optimize=all",
        "--zoom=#{ZOOM}", "--output=#{svg}", dvi
      )
      unless File.exist?(svg)
        raise CompileError, "dvisvgm failed:\n#{out}"
      end

      result = normalise(File.read(svg))
      result = result.sub("<svg ", %(<svg data-baseline="#{depth}" )) if depth
      result
    end
  end

  # dvisvgm stamps its own version into a comment; drop it so cached SVGs are
  # byte-identical whoever builds them.
  def normalise(svg)
    svg.sub(/^<!-- This file was generated by dvisvgm [^>]*-->\n/, "")
  end

  def tex_errors(log)
    lines = log.lines.select { |l| l.start_with?("!") || l =~ /^l\.\d+/ }
    lines = log.lines.last(15) if lines.empty?
    lines.join.strip
  end

  def ensure_svg(tex, display, root, force = false)
    key = cache_key(tex, display)
    path = svg_absolute_path(key, root)
    return key if File.exist?(path) && !force

    svg = compile(tex, display)
    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, svg)
    key
  end

  # dvisvgm reports the drawing's size in TeX points; browsers want px.
  def pixel_dimensions(svg)
    match = svg.match(/<svg[^>]*?\bwidth=['"]([\d.]+)pt['"][^>]*?\bheight=['"]([\d.]+)pt['"]/)
    return nil unless match
    [(match[1].to_f * 4.0 / 3.0).round, (match[2].to_f * 4.0 / 3.0).round]
  end

  # Reads the depth (in pt) written by the inline-math document to its .meta file.
  def read_depth(path)
    File.read(path).strip.split(",")[1].to_f
  end

  # Extracts the depth (in pt) embedded in an inline math SVG.
  def baseline_depth(svg)
    match = svg.match(/data-baseline="([\d.]+)"/)
    match ? match[1].to_f : nil
  end

  def escape_html(text)
    text.gsub("&", "&amp;").gsub("<", "&lt;").gsub(">", "&gt;").gsub('"', "&quot;")
  end

  def alt_text(tex)
    tex.gsub(/\s+/, " ").strip[0, 200]
  end

  # Kramdown HTML-escapes `<`, `>` and `&` inside inline $...$ before we see it;
  # restore them so the TeX matches what bin/render-math extracts from markdown.
  def unescape_tex(tex)
    tex.gsub("&amp;", "&").gsub("&lt;", "<").gsub("&gt;", ">")
  end

  def img_tag(key, tex, display, svg, url_prefix)
    dimensions = pixel_dimensions(svg)
    size = dimensions ? %( width="#{dimensions[0]}" height="#{dimensions[1]}") : ""
    src = "#{url_prefix}/#{svg_relative_path(key)}"
    cls = display ? "math math-display" : "math math-inline"
    style = ""
    if !display && (depth = baseline_depth(svg))
      # Pin the math baseline (depth pt above the image bottom) to the text
      # baseline. px = pt * 4/3, matching how the intrinsic size is displayed.
      style = %( style="vertical-align: -#{(depth * 4.0 / 3.0).round(2)}px")
    end
    %(<img class="#{cls}" src="#{src}" alt="#{escape_html(alt_text(tex))}"#{size}#{style} loading="lazy">)
  end

  # Removes fenced code blocks and inline code spans, so a diagram or math
  # expression quoted in prose is not mistaken for the real thing.
  def strip_code_regions(content)
    without_fences = content.gsub(/^[ \t]*(`{3,}|~{3,})[^\n]*\n.*?^[ \t]*\1[ \t]*$/m, "")
    without_fences.gsub(/(`+)(?:(?!\1)[\s\S])*\1/, "")
  end

  # Finds every inline and display expression in raw markdown (for bin/render-math).
  def extract_from_markdown(content)
    content = strip_code_regions(content)
    content = content.gsub(/<(script|pre|code)\b[^>]*>.*?<\/\1>/m, "")
    expressions = []
    content.gsub(DISPLAY_MD_RE) { expressions << [Regexp.last_match(1).strip, true] }
    content.gsub(INLINE_RE) { expressions << [Regexp.last_match(1).strip, false] }
    expressions
  end
end

if defined?(Jekyll)
  module MathRender
    def self.registered
      @registered ||= {}
    end

    def self.register_static_file(site, key)
      return if registered[key]
      registered[key] = true
      site.static_files << Jekyll::StaticFile.new(
        site, site.source, CACHE_DIR, "#{key}.svg"
      )
    end

    def self.substitute(html, site)
      # Keep the TeX source inside <script>/<pre>/<code> blocks (e.g. the TikZ
      # diagrams, which contain their own $...$) untouched.
      placeholders = {}
      html = html.gsub(/<(script|pre|code)\b[^>]*>.*?<\/\1>/m) do |block|
        key = "\u0000MATH#{placeholders.length}\u0000"
        placeholders[key] = block
        key
      end

      html = html.gsub(DISPLAY_RE) do
        tex = unescape_tex(Regexp.last_match(1).strip)
        render_one(tex, true, site) || Regexp.last_match(0)
      end
      html = html.gsub(INLINE_RE) do
        tex = unescape_tex(Regexp.last_match(1).strip)
        render_one(tex, false, site) || Regexp.last_match(0)
      end

      placeholders.each { |key, block| html = html.gsub(key, block) }
      html
    end

    def self.render_one(tex, display, site)
      key = cache_key(tex, display)
      path = svg_absolute_path(key, site.source)

      unless File.exist?(path)
        if toolchain_available?
          begin
            ensure_svg(tex, display, site.source)
          rescue CompileError => e
            return failure(site, "Math failed to compile: #{e.message}")
          end
        else
          return failure(
            site,
            "No SVG cached for math (expected #{svg_relative_path(key)}) " \
            "and no TeX toolchain available to build one. Run bin/render-math " \
            "on a machine with latex and dvisvgm, and commit the result."
          )
        end
        register_static_file(site, key)
      end

      img_tag(key, tex, display, File.read(path), site.baseurl.to_s)
    end

    def self.failure(site, message)
      if Jekyll.env == "production"
        raise message
      end
      Jekyll.logger.warn "Math:", message
      %(<span class="math-error">#{escape_html(message)}</span>)
    end
  end

  Jekyll::Hooks.register %i[posts pages documents], :post_render do |doc|
    output = doc.output
    next unless output.is_a?(String) && (output.include?("$") || output.include?("\\["))

    # Only ever touch real content. Jekyll also runs this hook on stylesheet
    # and script sources (e.g. the Font Awesome SCSS, which is full of `$var`
    # Sass variables that would otherwise be mistaken for math).
    path = doc.respond_to?(:path) ? doc.path.to_s : ""
    next if path =~ /\.(scss|sass|css|js|json|xml|svg|map)\z/

    doc.output = MathRender.substitute(output, doc.site)
  end
end
