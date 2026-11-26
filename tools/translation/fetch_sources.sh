#!/usr/bin/env bash
# Downloads the Perseus English translations the Translation build reads into tools/translation/sources/
# (not committed). All three are CC BY-SA 4.0. The commits are pinned so the credit can link to the exact
# version; to move to a newer Perseus version, change them here and in build_translation.py.
#   Murray, Iliad and Odyssey:  https://github.com/PerseusDL/canonical-greekLit
#   Williams, Aeneid:           https://github.com/PerseusDL/canonical-latinLit
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p sources
GREEK=https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/6d7829caf172d43a109e89f918dfb18fbf48e3d1/data/tlg0012
LATIN=https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/73723c273e0a3da6189d0fe09c0e6d724d87376b/data/phi0690
get() { [ -s "sources/$(basename "$1")" ] || curl -fsSL --retry 3 -o "sources/$(basename "$1")" "$1"; }
get "$GREEK/tlg001/tlg0012.tlg001.perseus-eng3.xml"
get "$GREEK/tlg002/tlg0012.tlg002.perseus-eng3.xml"
get "$LATIN/phi003/phi0690.phi003.perseus-eng2.xml"
echo "Sources are in $(pwd)/sources"
