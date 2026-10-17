# Presentation questionnaire

## Links

- Audience: https://www.primarycaretree.online/participate/tree-talk
- Projector: https://www.primarycaretree.online/participate/tree-talk/wall
- Rehearsal form: https://www.primarycaretree.online/participate/rehearsal
- Rehearsal wall: https://www.primarycaretree.online/participate/rehearsal/wall

The wall generates a downloadable QR code pointing to the questionnaire on its own origin. Open the production wall when downloading the QR for your slides. The wall checks for updates every three seconds while visible, and backs off during connection failures. Pause stops display updates only, not submissions. Close the wall after the event to stop polling and conserve free compute.

## Database setup

Run `db/participation.sql` once in the Neon SQL Editor. It creates separate live and rehearsal sessions without touching provider data or testimonials. Configure `DATABASE_URL` as a server-only secret in the hosting environment. Never commit credentials. For local development, use a git-ignored `.env.local`.

Only tree and city are required; story and name are optional. There is no place question. Responses publish immediately; the submit notice explains public display. Limits: tree/city 100 characters, place 160, story 500, name 80. Requests are bounded to 8 KB, and a shared database counter accepts up to 120 new attempts per session per minute. This is a basic event-level limit, not comprehensive anti-bot protection. Retry UUIDs prevent duplicate saves after interrupted responses. Public output excludes hidden entries.

## Presenter controls

The wall has pause/resume, fullscreen, QR download, and older/newer pages. Moderation and closing a session are currently managed in the Neon SQL Editor (there is no admin UI in this first version).

Close submissions after your presentation:

```sql
UPDATE participation_sessions SET is_open = false WHERE slug = 'tree-talk';
```

Reopen by setting `is_open = true`. View recent entries to find an ID:

```sql
SELECT id, tree, city, story FROM tree_responses
WHERE session_slug = 'tree-talk' ORDER BY created_at DESC;
```

Hide a response without deleting it:

```sql
UPDATE tree_responses SET hidden = true
WHERE session_slug = 'tree-talk' AND id = 'REPLACE-WITH-RESPONSE-UUID';
```

Restore by setting `hidden = false`. A paused wall applies these changes on resume. Keep rehearsal entries in the rehearsal session.

## Checks

Run `node tests/participation-validation.cjs` and `npm run build`. After deployment, submit in rehearsal and open the rehearsal wall on a separate browser tab/device. Check persistence after reload and confirm the real event stays empty. QR codes using localhost cannot be used by audience phones.
