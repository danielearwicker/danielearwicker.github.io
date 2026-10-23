# frozen_string_literal: true

# Shared LaTeX definitions for \ket, \bra and \braket.
#
# The fences (|, \langle, \rangle) are drawn directly as TikZ lines rather than
# typeset from the maths fonts, so the coloured background and the black fence
# strokes share the same coordinates and line up exactly (the font glyphs carry
# side bearings that otherwise make the fill bleed past the strokes).
#
# The fences have the natural delimiter size as a minimum height/depth (measured
# from \vert at preamble time), so short labels like \alpha still get a full
# fence consistent with taller ones like \beta.
module KetMacros
  LATEX = <<~'LATEX'.freeze
    \definecolor{ketbg}{HTML}{EEEEFF}
    \definecolor{brabg}{HTML}{EEFFEE}
    \newdimen\ketslant \ketslant=2.4pt
    \newdimen\braslant \braslant=2.4pt
    \newdimen\ketsep \ketsep=2.0pt
    \newdimen\ketstroke \ketstroke=0.55pt
    \newdimen\ketmid
    \newdimen\keth
    \newdimen\ketd
    \newdimen\ketw
    \newdimen\ketwB
    \newdimen\ketminheight
    \newdimen\ketmindepth
    \newbox\ketbox
    \newbox\ketboxB
    \newbox\ketboxC
    \setbox\ketboxC=\hbox{$\vert$}\ketminheight=\ht\ketboxC\ketmindepth=\dp\ketboxC
    \newcommand{\ket}[1]{\mathinner{\setbox\ketbox=\hbox{$#1$}\keth=\ht\ketbox\ifdim\keth<\ketminheight\keth=\ketminheight\fi\ketd=\dp\ketbox\ifdim\ketd<\ketmindepth\ketd=\ketmindepth\fi\ketmid=\keth\advance\ketmid by -\ketd\divide\ketmid by 2\begin{tikzpicture}[baseline=0pt]\fill[ketbg](0,-\ketd)--(\wd\ketbox+\ketsep+\ketsep,-\ketd)--(\wd\ketbox+\ketsep+\ketsep+\ketslant,\ketmid)--(\wd\ketbox+\ketsep+\ketsep,\keth)--(0,\keth)--cycle;\draw[line width=\ketstroke, solid, -](0,-\ketd)--(0,\keth);\draw[line width=\ketstroke, solid, -](\wd\ketbox+\ketsep+\ketsep,-\ketd)--(\wd\ketbox+\ketsep+\ketsep+\ketslant,\ketmid)--(\wd\ketbox+\ketsep+\ketsep,\keth);\node[anchor=base west,inner sep=0pt,outer sep=0pt]at(\ketsep,0){\box\ketbox};\end{tikzpicture}}}
    \newcommand{\bra}[1]{\mathinner{\setbox\ketbox=\hbox{$#1$}\keth=\ht\ketbox\ifdim\keth<\ketminheight\keth=\ketminheight\fi\ketd=\dp\ketbox\ifdim\ketd<\ketmindepth\ketd=\ketmindepth\fi\ketmid=\keth\advance\ketmid by -\ketd\divide\ketmid by 2\begin{tikzpicture}[baseline=0pt]\fill[brabg](-\ketsep-\braslant,\ketmid)--(-\ketsep,\keth)--(\wd\ketbox+\ketsep,\keth)--(\wd\ketbox+\ketsep,-\ketd)--(-\ketsep,-\ketd)--cycle;\draw[line width=\ketstroke, solid, -](\wd\ketbox+\ketsep,-\ketd)--(\wd\ketbox+\ketsep,\keth);\draw[line width=\ketstroke, solid, -](-\ketsep-\braslant,\ketmid)--(-\ketsep,\keth);\draw[line width=\ketstroke, solid, -](-\ketsep-\braslant,\ketmid)--(-\ketsep,-\ketd);\node[anchor=base west,inner sep=0pt,outer sep=0pt]at(0,0){\box\ketbox};\end{tikzpicture}}}
    \newcommand{\braket}[2]{\mathinner{\setbox\ketbox=\hbox{$#1$}\ketw=\wd\ketbox\setbox\ketboxB=\hbox{$#2$}\ketwB=\wd\ketboxB\setbox\ketboxC=\hbox{$#1#2$}\keth=\ht\ketboxC\ifdim\keth<\ketminheight\keth=\ketminheight\fi\ketd=\dp\ketboxC\ifdim\ketd<\ketmindepth\ketd=\ketmindepth\fi\ketmid=\keth\advance\ketmid by -\ketd\divide\ketmid by 2\begin{tikzpicture}[baseline=0pt]\fill[brabg](-\ketsep-\braslant,\ketmid)--(-\ketsep,\keth)--(\ketw+\ketsep,\keth)--(\ketw+\ketsep,-\ketd)--(-\ketsep,-\ketd)--cycle;\fill[ketbg](\ketw+\ketsep,-\ketd)--(\ketw+\ketwB+\ketsep+\ketsep+\ketsep,-\ketd)--(\ketw+\ketwB+\ketsep+\ketsep+\ketsep+\ketslant,\ketmid)--(\ketw+\ketwB+\ketsep+\ketsep+\ketsep,\keth)--(\ketw+\ketsep,\keth)--cycle;\draw[line width=\ketstroke, solid, -](-\ketsep-\braslant,\ketmid)--(-\ketsep,\keth);\draw[line width=\ketstroke, solid, -](-\ketsep-\braslant,\ketmid)--(-\ketsep,-\ketd);\draw[line width=\ketstroke, solid, -](\ketw+\ketsep,-\ketd)--(\ketw+\ketsep,\keth);\draw[line width=\ketstroke, solid, -](\ketw+\ketwB+\ketsep+\ketsep+\ketsep,-\ketd)--(\ketw+\ketwB+\ketsep+\ketsep+\ketsep+\ketslant,\ketmid)--(\ketw+\ketwB+\ketsep+\ketsep+\ketsep,\keth);\node[anchor=base west,inner sep=0pt,outer sep=0pt]at(0,0){\box\ketbox};\node[anchor=base west,inner sep=0pt,outer sep=0pt]at(\ketw+\ketsep+\ketsep,0){\box\ketboxB};\end{tikzpicture}}}
  LATEX
end
