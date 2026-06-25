# TODO

Tracks `rework` against [FEATURES.md](FEATURES.md).
Baseline = published `main` (v0.3.5). `rework` should reach parity before the
user requests at the bottom.

Legend: [x] done · [~] partial · [ ] missing

## Configuration

- [x] Selfies per zip — "Images per zip" setting (0 = auto), layered on top of the 750 MB byte cap
- [ ] Max messages (BETA, 0 = uncap) — missing in `rework`
- [x] Image type (WEBP / PNG) — present as HD/SD
- [x] Separate download buttons — dropped; superseded by the split-button select (first option = default "Download")
- [x] Include selfies on chat — toggle (embedded vs text-only)
- [x] Enable folderization
- [ ] Show Stats — daily usage counts / user info, missing
- [x] Debug mode — toggle that enables verbose console logging at runtime

## Single Nomi Download

- [x] Album download (HD or SD)
- [x] Chat download as HTML — with/without images via the Include selfies toggle
- [x] Mind map download as HTML *(new)*
- [ ] Shared Notes as HTML *(new)* — `DOWNLOAD_BACKSTORY` is a stub
- [~] JSON *(new)* — only `/nomis/{id}` data; should include all Nomi info (decide JSON vs markdown)

## Group Download

- [ ] Chat download as HTML (with/without images) — `main` has it; `rework` button is a no-op
- [ ] Chat info download *(new)*

## New features — user requests (after parity with `main`)

Ordered roughly by demand.

- [ ] **Album range / offset** — only the last N photos, or start at photo #N
      (Mark, Kyo-Kun, Jymm, solcuerda)
- [ ] **Incremental download** — remember what was already downloaded per Nomi, fetch only new content
      (solcuerda, Kyo-Kun)
- [ ] **Chat message range (X→Y)** — explicit start/end, beyond the last-N "Max messages" setting
      (Bagman; Joe's "last 50" is covered once Max messages is restored)
- [ ] **Create-art prompts in chat/full export** — include art-request prompts, not just text + selfie images
      (data exists in the medias API: `artPrompt`, `textPrompt`) (macbiff)
- [ ] **Group chat image prompts** — once group download is back, capture image prompts like individual chats
      (Joe)
- [ ] **Convert old `.webp` videos to `.mp4`** — research in-browser conversion for pre-update videos
      (astropol)
