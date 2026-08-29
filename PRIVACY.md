# Nomi Downloader Privacy Policy

_Last updated: 2026-06-30_

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

The only data that can leave your browser is a **bug report**, and only when you
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

Reports are sent to the developer via `https://nomi.zar.mx` and are used solely
to diagnose and fix bugs. They are not sold, shared with advertisers, or used
for any other purpose.

## Permissions

- **Access to nomi.ai**: to read your content for export, using your existing
  login session.
- **Access to nomi.zar.mx**: only to deliver an error report you choose to send.
- **downloads**: to save exported files to your device.
- **tabs, storage, offscreen**: to operate the popup, remember your settings,
  and build the zip / HTML files locally.

## Contact

Questions or requests: dacks@zar.mx
