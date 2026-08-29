# Nomi Downloader Privacy Policy

_Last updated: 2026-08-29_

## Summary

Nomi Downloader runs entirely in your browser. It uses your existing nomi.ai
session to export **your own** content (albums, chats, memories and shared
notes) to files on your device. It contains no analytics or tracking, and
sends nothing to any server during normal use.

## Your content stays on your device

Exports are generated locally and saved through your browser's downloads. The
content of your Nomis (images, conversations, memories, notes) is **never
uploaded anywhere** by the extension.

## Error reports (opt-in)

The only personal data that can leave your browser is a **bug report**, and only when you
explicitly choose to send one.

When the extension hits an unexpected error, it shows a dialog. You can expand
**"What gets sent"** to read the exact text first. Nothing is transmitted unless
you click **Send report**; choosing **Not now** sends nothing.

A bug report contains:

- the error message and stack trace;
- the extension version;
- your browser's user-agent string (browser and operating system);
- up to the 50 most recent internal diagnostic log lines (context about what the
  extension was doing).

Before sending, the report is automatically scrubbed to remove session cookies,
authorization headers, and long token-like strings.

Each report also carries a random per-install id (so a developer reply can
reach your extension without identifying you) and, unless you untick the
checkbox in the form, your Nomi account email, shown to you before sending.
Unticking it makes the report send-and-forget.

Reports are sent to the developer via `https://nomi.zar.mx` and are used solely
to diagnose and fix bugs. They are not sold, shared with advertisers, or used
for any other purpose.

## Developer replies

If you sent a report, the popup asks `https://nomi.zar.mx/api/bugs/replies`
whether the developer answered, sending only the random ids of the reports
this install created. Replies show inside the extension, where you can also
send follow-up messages on your own reports; those go to the same place as
the report itself. If you never sent a report, none of this happens.

## Stats sync (opt-in)

Off by default. When you turn on "Sync stats" in settings, the extension
sends your daily usage counters (messages sent, received, selfies) to
`https://nomi.zar.mx/api/stats`, keyed by your account's public id, so your
history survives reinstalls. Counters only, never content. Turning it off
stops the sends; deleting is one request away and removes everything stored.

## Update check

When you open the popup, the extension asks `https://nomi.zar.mx/api/version`
for the latest published version number, so it can tell you when an update is
available. The request carries the installed version number and **no personal
data**: no identifiers, no account information, nothing about your Nomis. The
server keeps only anonymous daily totals per version.

## Permissions

- **Access to nomi.ai**: to read your content for export, using your existing
  login session.
- **Access to nomi.zar.mx**: to deliver an error report you choose to send,
  fetch developer replies to it, check the latest published version, and (only
  if you opt in) sync your usage counters.
- **downloads**: to save exported files to your device.
- **tabs, storage, offscreen**: to operate the popup, remember your settings,
  and build the zip / HTML files locally.

## Contact

Questions or requests: nomi@zar.mx
