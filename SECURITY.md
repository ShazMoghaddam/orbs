# Security policy

## Supported versions

| Package | Version | Supported |
| --- | --- | --- |
| Orbs (`@shazmoghaddam/orbs` on npm, and jsDelivr) | 1.x, latest release | Yes |
| Older 1.x releases | | Fixes go into the next release only |

Fixes go into the latest release. Script tags pinned to an exact version, such as `@1.7.0`, keep loading that version, so move the pin to pick up a fix.

## Reporting a vulnerability

Please report it privately, not in a public issue.

1. Open the [Security tab](https://github.com/ShazMoghaddam/orbs/security) and press **Report a vulnerability**, or go straight to [a new advisory](https://github.com/ShazMoghaddam/orbs/security/advisories/new).
2. Describe the problem, the version you tested, and the steps, markup or link that show it.

You'll get a reply within 7 days. Once the problem is confirmed, I'll agree a fix and a disclosure date with you, and credit you in the advisory and the changelog unless you'd rather stay anonymous.

## Scope

In scope:

- The library, `orb.js` and `orb.min.js`, for example an attribute or option that ends up running as script or markup in a page.
- The desk display, `display.html`, for example a link whose settings run script or load content from elsewhere. Every value in its link is checked against what it may be.
- The Studio and website in `index.html` and `site/`, for example a shared link that runs script.
- Sound: the microphone is only analysed in the browser. Anything that records it, plays it back or sends it anywhere is a bug.
- The release workflows in `.github/workflows/`.

Out of scope:

- Pages that pass untrusted HTML into Orbs by other means, such as setting `innerHTML` themselves.
- Audio from another site being silenced without CORS headers. That is the browser protecting the other site, as the README explains.
- Problems in third-party services such as jsDelivr or npm. Please report those to the service.
