# Patent Register maintenance

## Source and recheck policy

- Prefer Google Patents when the exact publication record is available.
- Use a verified Justia page as the fallback for a U.S. publication, and
  verified official or J-GLOBAL records for foreign publications and grants.
- During each monthly patent audit, inspect all non-Google patent links in
  `content.md`, including Justia and J-GLOBAL links. Replace a link with Google
  Patents only after the exact publication or grant number and kind code,
  title, and inventor metadata match. An HTTP 200 response alone is
  insufficient.
- Do not add a family member based only on fuzzy search results or an
  aggregator's similarity link. Verify the official publication metadata and
  the claimed priority link first.

## Open rechecks

- [ ] Find an official publication link for EP4760490A1, currently linked
  under US20260169719A1. The EPO gazette priority link is already verified.
  A matching secondary record is available at
  [PatSnap](https://eureka.patsnap.com/patent/EP4760490A1); verify an official
  EPO publication link before replacing the current link.
- [ ] Verify JP2026104789A, currently linked under US20260169719A1. Confirm
  its inventor metadata and claimed priority to US18/979,755
  (US20260169719A1) from an authoritative record. Prioritize this check
  because the publication is already listed.
- [ ] Recheck JP2026085868A as a possible member of the US20260133957A1
  Atomicity family. Keep it unlisted unless an authoritative record confirms
  the publication, inventor metadata, and priority to US18/946,821
  (US20260133957A1).
- [ ] Recheck Google Patents for JP7910639 and migrate its J-GLOBAL link only
  after verifying the exact grant record, kind code, and metadata. The grant
  is already listed; this follow-up only concerns the link destination.
  Confirm the kind code against the official grant gazette or JPO authority
  record.
