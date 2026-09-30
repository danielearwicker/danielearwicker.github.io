# The al-folio image, plus a TeX installation for rendering TikZ diagrams.
#
# This builds on the published image rather than assembling the environment
# from scratch, so `docker compose up` on a fresh clone takes a couple of
# minutes rather than reinstalling every gem -- and, more to the point, it
# actually works: al-folio's from-scratch recipe currently fails to build the
# stringio native extension against Ruby 3.4. That original Dockerfile is in
# this repository's git history if it is ever needed again.
#
# TeX lives here, in the same image that serves the site, so that editing a
# diagram and reloading the page is all there is to it: _plugins/tikz.rb
# compiles any TikZ block that has no cached SVG yet.

FROM amirpourmand/al-folio:v0.14.4

LABEL description="al-folio with TeX, for build-time TikZ rendering"

ENV DEBIAN_FRONTEND=noninteractive

# texlive-latex-base   latex itself
# texlive-pictures     PGF/TikZ and its libraries
# texlive-latex-extra  standalone.cls, which crops the page to the picture
# texlive-fonts-*      the Computer Modern fonts the labels are set in
# dvisvgm              DVI -> SVG, with glyphs converted to paths
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        dvisvgm \
        texlive-fonts-recommended \
        texlive-latex-base \
        texlive-latex-extra \
        texlive-pictures && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*
# Note: deliberately not clearing /tmp here -- the base image's CMD is
# /tmp/entry_point.sh, and wiping it leaves the container unable to start.
