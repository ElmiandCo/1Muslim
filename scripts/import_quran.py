#!/usr/bin/env python3
"""Import a local, versioned Qur'an corpus. Run: python3 scripts/import_quran.py
Arabic: Tanzil Uthmani v1.1, verbatim. English: only from an explicitly
licensed/authorized verse-per-line file (chapter|verse|translation).
No AI generation or machine translation of Qur'an verses.
"""
import hashlib
import json
import os
import pathlib
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "public" / "quran-data"
SOURCE = "https://tanzil.net/pub/download/index.php"
COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6]
assert len(COUNTS) == 114 and sum(COUNTS) == 6236

def fetch_arabic():
    params = urllib.parse.urlencode({"quranType":"uthmani","outType":"txt-2","marks":"true","sajdah":"true","tatweel":"true","agree":"true"}).encode()
    req = urllib.request.Request(SOURCE,data=params,headers={"User-Agent":"1Muslim-Quran-Importer/1.0"})
    with urllib.request.urlopen(req,timeout=45) as response:
        return response.read().decode("utf-8-sig")

def main():
    raw = fetch_arabic()
    lines = [line for line in raw.splitlines() if line.strip() and not line.startswith("#")]
    verses = {}
    for line in lines:
        parts = line.split("|",2)
        if len(parts) != 3:
            raise ValueError("Unexpected Tanzil format; refusing to publish")
        chapter,ayah = int(parts[0]),int(parts[1])
        if chapter not in range(1,115) or ayah not in range(1,COUNTS[chapter-1]+1):
            raise ValueError("Invalid verse reference")
        key = f"{chapter}:{ayah}"
        if key in verses or not parts[2].strip():
            raise ValueError("Duplicate or blank verse")
        verses[key] = {"verse_key":key,"arabic":parts[2]}
    expected = {f"{chapter}:{ayah}" for chapter,count in enumerate(COUNTS,1) for ayah in range(1,count+1)}
    if set(verses) != expected:
        raise ValueError(f"Arabic verification failed: {len(verses)} / 6236")
    translation_file = os.environ.get("QURAN_ENGLISH_LICENSED_FILE")
    english = {}
    if translation_file:
        for line in pathlib.Path(translation_file).read_text(encoding="utf-8-sig").splitlines():
            if not line.strip() or line.startswith("#"):
                continue
            chapter,ayah,text = line.split("|",2)
            key=f"{int(chapter)}:{int(ayah)}"
            if key in english or key not in expected or not text.strip():
                raise ValueError("Invalid English translation entry")
            english[key] = text
        if set(english) != expected:
            raise ValueError("English translation must contain exactly 6236 verses")
    DEST.mkdir(parents=True,exist_ok=True)
    for chapter,count in enumerate(COUNTS,1):
        data=[dict(verses[f"{chapter}:{ayah}"],**({"english":english[f"{chapter}:{ayah}"]} if english else {})) for ayah in range(1,count+1)]
        (DEST/f"{chapter}.json").write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    manifest={"edition":"Tanzil Uthmani v1.1","source":"Tanzil Project","sourceUrl":"https://tanzil.net/","license":"CC BY 3.0, verbatim only; see ATTRIBUTION.md","chapters":114,"verses":6236,"arabicSha256":hashlib.sha256(raw.encode("utf-8").strip()).hexdigest(),"englishIncluded":bool(english)}
    (DEST/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    print("Verified and wrote 114 local Arabic chapter files.", "English included." if english else "English awaiting licensed source.")

if __name__=="__main__":
    main()
