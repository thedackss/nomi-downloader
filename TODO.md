# TODO

Tracks `rework` against [FEATURES.md](FEATURES.md).
Baseline = published `main` (v0.3.5). `rework` should reach parity before the
user requests at the bottom.

Legend: [x] done · [~] partial · [ ] missing

## Configuration

- [x] Selfies per zip — "Images per zip" setting (0 = auto), layered on top of the 750 MB byte cap
- [x] Max messages (0 = uncap) — keep only the last N; BETA flag dropped (deterministic)
- [x] Image type (WEBP / PNG) — present as HD/SD
- [x] Separate download buttons — dropped; superseded by the split-button select (first option = default "Download")
- [x] Include selfies on chat — toggle (embedded vs text-only)
- [x] Enable folderization
- [x] Show Stats — daily-usage card in the empty "No Nomi selected" state (sent / received / selfies today)
- [x] Debug mode — toggle that enables verbose console logging at runtime

**Configuration section complete.**

## Single Nomi Download

- [x] Album download (HD or SD)
- [x] Chat download as HTML — with/without images via the Include selfies toggle
- [x] Mind map download as HTML _(new)_
- [x] Download All _(new)_ — default split-button action; runs album → chat → mind → JSON in sequence
- [x] Shared Notes as HTML _(new)_ — accordion export via offscreen render
- [x] JSON _(new)_ — structured export (shared notes, image settings, mind map, chat) + "raw data" toggle for full API responses
- [x] Markdown _(new)_ — same data as JSON, rendered as readable Markdown (Nomi info, shared notes, image settings, mind map, chat log)
- [x] Advanced Download mode _(new)_ — per-type toggles select which types appear on the button; off = one-click album + chat + shared notes
- [x] Prompt files _(new)_ — save Art / edited-photo prompts alongside the image (sidecar .txt, PNG metadata, or both; off by default)

**Single Nomi Download section complete.**

## Group Download

- [x] Chat download as HTML (with/without images) — paginates `/group-chats/:id/messages`, renders via the shared chat document with per-speaker name labels
- [x] Chat info _(new)_ — group facts (type, created, image style, members) shown as a card atop the chat HTML, and as JSON/Markdown exports
- [x] JSON / Markdown _(new)_ — group facts + chat log; offered via the advanced-mode select button (alongside Chat)

**Group Download section complete.**

## New features — user requests (after parity with `main`)

Ordered roughly by demand.

- [x] **Album range / offset** — "Most recent N photos" + "Start at photo #N" (oldest = #1)
      in Album settings; they compose (skip to #N, then keep the recent N). Applied after
      the chronological sort, before chunking. (Mark, Kyo-Kun, Jymm, solcuerda)
- [x] **Chat message range (X→Y)** — explicit From→To range (1-based, inclusive) in Chat
      settings; overrides the last-N "Max messages" when set. Shared `applyMessageRange`
      helper used by both the single and group chat HTML exports. (Bagman, Joe)
- [x] **Incremental download (BETA)** — opt-in "Only new since last" toggle (off by default).
      Album / single chat / group downloads fetch only content newer than the last
      successful run, tracked per Nomi/group by newest timestamp in `chrome.storage.local`
      (needs the `storage` permission). A "Reset history" button forgets everything.
      Composes with the range filters (incremental narrows first, then range).
      (solcuerda, Kyo-Kun)
- [x] **Generation prompts saved with media** — the "Prompt files" feature attaches each
      item's prompt (sidecar `.txt`, PNG metadata embed, or both). Coverage by type:
      Art → `artPrompt`, edited photo → `textPrompt`, video → `textPrompt` (sidecar only,
      since embed writes PNG iTXt). (macbiff)
      - Plain selfies (`Photo`) have **no prompt field** in the medias API. The "selfie
        description" you see in a chat export is a separate *hidden chat message*, not a
        property of the selfie — it lives in the chat stream, never in the album. Attaching
        it to album selfies would need a fuzzy timestamp-adjacency join between the hidden
        message and the `SelfieRequest`; no hard FK exists. Low-confidence, deferred.
- [ ] ~~**Group chat image prompts**~~ — not doable: the group messages endpoint doesn't
      expose them. `GroupSelfieRequest`/`GroupSelfie` carry only IDs + `nsfwScore`, no
      prompt/caption. (Per-member `artPrompt` is still reachable by downloading each
      member's individual album — but the group chat itself has no prompt to surface.) (Joe)
- [ ] ~~**Convert old `.webp` videos to `.mp4`**~~ — out of scope: in-browser transcoding
      needs FFmpeg.wasm (~30–50 MB) with heavy perf/memory cost. The downloader already
      fetches `.mp4` when the backend offers it. (astropol)
