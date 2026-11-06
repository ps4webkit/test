# MCFORT9669 v11.2 — firmware routes

The main page detects the PS4 firmware from the console User-Agent and uses an exact firmware allowlist from firmware-map.js. Unsupported
versions stop without starting a kernel chain. Existing 13.02/13.04/13.50/13.52
and 14.00 modules remain unchanged.

| Firmware | Local module | Source |
| --- | --- | --- |
| 5.05/5.07, 6.71/6.72, listed 7.xx–10.xx, 11.02/11.52 | webkitty/ | ArabPixel/WebKitty, AGPL-3.0-or-later |
| 11.00, 11.50, 12.00, 12.02 | rawgame4/ Lapse | rawgame4/rawgame4.github.io, MIT port plus third-party components |
| 12.50, 12.52, 13.00 | rawgame4/ Poops | rawgame4/rawgame4.github.io |
| 13.02, 13.04, 13.50, 13.52 | engine/ | Original host / raw13g |
| 14.00 | afterglow/ | well0nez/afterglow-web, AGPL-3.0-or-later |

Firmware support is based on each upstream project's published support table;
the new routes have not been verified on hardware in this package. 10.01 in
RawGame4 is explicitly untested, so it routes to WebKitty. The early WebKitty
module maintains its own firmware-specific offline cache after opening. Root
statistics do not count launches in separate modules because their success
cannot be confirmed by the root page. Keep upstream license and attribution
files when redistributing this archive.

Upstreams:
https://github.com/ArabPixel/WebKitty
https://github.com/rawgame4/rawgame4.github.io
https://github.com/raw13g/raw13g.github.io
https://github.com/well0nez/afterglow-web

## Error reports in v11.1

The shared error-report.js shows firmware, module, last stage, and error text.
The last active stage is stored on the console and presented on the next main-page
visit if the browser or console exits before a result. This is a diagnostic clue,
not a kernel crash log or proof of the crash cause. The RawGame4 launch pages
consume a one-time session token to prevent a restored page rerunning the exploit.


## Version badge in v11.2

The root GoldHEN badge names the actual bundled file for each route: RawGame4
payload.bin matches WebKitty goldhen_v2.4b18.10.bin byte for byte; the
original/Afterglow route uses 2.4b18.13. WebKitty starts with 2.4b18.13
and permits a saved user selection or a different HEN flavor. The root badge
reads that saved choice. GoldHEN builds support several firmwares each.
The firmware allowlist intersects the upstream WebKit chain and the supplied
GoldHEN v2.4b18.13 README firmware list; 6.70 is excluded because GoldHEN
is not listed for it.

## v11.4 — RawGame4 report

The report no longer treats the intermediate `REPAIRED -- tearing down...` state as a completed failure. RawGame4 reports now retain the earlier `STEP4D-FAILED` or proof error instead of merely showing a later summary. On 11.00, a safe completed failure offers a link to the bundled WebKitty module. Exploit primitives and firmware offsets were not changed; actual reliability needs console test.

## v11.5 — firmware 11.00 trial route

FW 11.00 uses bundled WebKitty by default. On the first v11.5 launch it selects CSSFontFace + Netctrl and GoldHEN v2.4b18.13; later selections within WebKitty are respected. The user may choose the existing RawGame4 Lapse route in Settings. This changes only routing and UI, not the kernel exploits. Neither route can be claimed more reliable without actual hardware test; reports should include the selected route. Other firmware routes remain unchanged.

## v11.6 — FW 11.00 Netctrl field report

A tester reported five failures with WebKitty CSSFontFace + Netctrl at `Unable to leak kqueue`. This is inside the kernel chain before GoldHEN; in `netctrl.js`, leak_kqueue exhausts its kqueue attempts. An issue in the original CSSFontFace project (#32) reports Netctrl instability on a PS4 Pro 11.00 and better results with Lapse. First v11.6 launch now sets CSSFontFace + Lapse (chain 4) for FW 11.00; later choices within WebKitty are respected. No kernel offsets, race timings, or exploit primitives were changed. Hardware verification is pending.

## v11.7 — tester feedback

The tester confirmed successful WebKitty CSSFontFace + Lapse runs on 11.00 (3 success, 4 power-offs in an early sample). The shared custom error overlay is disabled; a stale interrupted report is cleared on the next visit and prior failure is removed after success. WebKitty 11.00 now requires a manual start; auto-retry, auto-launch and reload-after-success are disabled to prevent unrequested consecutive exploit attempts. The underlying exploit and payload are unchanged. The PS4 native low-memory dialog is controlled by the console, not this host. Hardware success-rate improvement is not established.

## v11.8 — restore tested retry flow

FW 11.00 v11.7 disabled WebKitty auto-retry and persisted that disabled value. This prevented the tester’s previously working reload/retry sequence after a PS4 memory error. The upstream retry behavior has been restored; a one-time migration re-enables the setting without triggering a retry on initial page load. WebKitty intentionally keeps `user.blockJailbreak` set after a click, so same-page clicks do not rerun the exploit. The custom report dialog remains removed. No kernel exploit or payload bytes changed.

## v11.9 — experimental unified UI on FW 11.00

The default WebKitty route is embedded in an offscreen full-size iframe and relays CSSFontFace/Lapse progress and completion to the main host screen. WebKitty's own caching and retry are preserved. This changes the browser execution context; PS4 hardware validation is required before replacing the established v11.8 deployment. The RawGame4 alternate 11.00 route still uses its own screen.
