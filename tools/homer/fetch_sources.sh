#!/usr/bin/env bash
# Downloads the Perseus Sources the Homer build reads into tools/homer/sources/ (not committed).
#   AGDT 2.1 treebank (Lemmas and Morphology), CC BY-SA 3.0: https://github.com/PerseusDL/treebank_data
#   LSJ (hints for hand glosses), CC BY-SA 4.0:              https://github.com/PerseusDL/lexica
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p sources/lsj
TB=https://raw.githubusercontent.com/PerseusDL/treebank_data/master/v2.1/Greek/texts
for f in tlg0012.tlg001.perseus-grc1.tb.xml tlg0012.tlg002.perseus-grc1.tb.xml; do
  [ -s "sources/$f" ] || curl -fsSL --retry 3 -o "sources/$f" "$TB/$f"
done
LSJ=https://raw.githubusercontent.com/PerseusDL/lexica/master/CTS_XML_TEI/perseus/pdllex/grc/lsj
for i in $(seq 1 27); do
  f=grc.lsj.perseus-eng$i.xml
  [ -s "sources/lsj/$f" ] || curl -fsSL --retry 3 -o "sources/lsj/$f" "$LSJ/$f"
done
echo "Sources are in $(pwd)/sources"
