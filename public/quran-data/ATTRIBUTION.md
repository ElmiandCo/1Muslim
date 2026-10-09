# 1Muslim local Qur'an corpus — provenance and license

Arabic text source: Tanzil Quran Text (Uthmani), Version 1.1.
Copyright (C) 2007–2021 Tanzil Project.
License: Creative Commons Attribution 3.0.

This copy of the Quran text is carefully produced, highly verified and continuously monitored by a group of specialists in Tanzil Project.

TERMS OF USE:
Permission is granted to copy and distribute verbatim copies of this text, but CHANGING IT IS NOT ALLOWED.
This Quran text can be used in any website or application, provided that its source (Tanzil Project) is clearly indicated, and a link is made to https://tanzil.net to enable users to keep track of changes.
This copyright notice shall be included in all verbatim copies of the text, and shall be reproduced appropriately in all files derived from or containing substantial portion of this text.
Please check updates at: https://tanzil.net/updates/

Importer: scripts/import_quran.py. It checks all 114 surahs and 6,236 verse references, rejects incomplete or duplicate records, and writes versioned static chapter JSON files. Do not modify Arabic verse strings.

English: **not yet included**. Provide a legally redistributable, properly attributed translation as a UTF-8 chapter|verse|text file and set QURAN_ENGLISH_LICENSED_FILE when running the importer. Verify the translation's permission and provenance before shipping it. The current Quran.com API translation must not be scraped and redistributed without permission.

The importer requires network access and has to be run once to generate public/quran-data/*.json. This commit alone does not yet store the verses.
