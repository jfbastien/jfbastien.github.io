# Patent Register maintenance

## Source and recheck policy

- Prefer Google Patents when the exact publication record is available.
- When Google Patents is unavailable, use a verified official or secondary
  record, including Justia, J-GLOBAL, or PatSnap. Confirm the exact publication
  number and matching disclosure before replacing an existing link. A link
  repair does not establish family membership.
- During each monthly patent audit, inspect all non-Google patent links in
  `content.md`, including Justia, J-GLOBAL, and PatSnap links. Replace a link
  with Google Patents only after the exact publication or grant number and
  kind code, title, and inventor metadata match. An HTTP 200 response alone is
  insufficient.
- Do not add a family member based only on fuzzy search results or an
  aggregator's similarity link. Verify the official publication metadata,
  inventors, and claimed priority link first.

## Open rechecks

- [ ] Recheck Google Patents for EP4760490A1 and JP2026104789A, now linked to
  verified PatSnap records under US20260169719A1. The EPO gazette priority
  link for EP4760490A1 is already verified.
- [ ] Verify JP2026104789A, currently linked under US20260169719A1. Confirm
  its inventor metadata and claimed priority to US18/979,755
  (US20260169719A1) from an official record. Prioritize this check because
  the publication is already listed; the PatSnap record does not establish
  its inventors or priority.
- [ ] Recheck JP2026085868A as a possible member of the US20260133957A1
  Atomicity family. Keep it unlisted unless an authoritative record confirms
  the publication, inventor metadata, and priority to US18/946,821
  (US20260133957A1).
- [ ] Recheck Google Patents for JP7910639 and migrate its J-GLOBAL link only
  after verifying the exact grant record, kind code, and metadata. The grant
  is already listed; this follow-up only concerns the link destination.
  Confirm the kind code against the official grant gazette or JPO authority
  record.
