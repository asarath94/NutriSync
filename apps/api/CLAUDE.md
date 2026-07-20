# apps/api

## Auth

- Password hashing: bcryptjs, cost factor 12. Hash is stored on `User.passwordHash`
  (`select: false` — never returned by a default Mongoose query) and is never
  included in any API response.
- Session: a single JWT access token, HS256, signed with `JWT_SECRET`.
  `jwt.verify` explicitly allowlists `["HS256"]` — it does not trust the
  algorithm embedded in the token. The app fails to boot if `JWT_SECRET` is
  unset (`assertJwtSecretConfigured` in `src/lib/jwt.ts`).
- Token lives in an httpOnly, `sameSite: "lax"` cookie (`access_token`),
  `secure` in production only, TTL 24h.
- No refresh-token flow. A single moderately-short-lived token was chosen
  over access+refresh rotation because this is a personal/family app — the
  rotation/revocation-store machinery isn't worth it here. Re-login after
  24h. Revisit if that proves annoying in practice.
- `User.tokenVersion` gives logout real teeth despite there being no
  server-side token blocklist: it's embedded in the JWT payload at sign
  time, and `requireAuth` (`src/middleware/require-auth.ts`) rejects any
  token whose `tokenVersion` doesn't match the current DB value. Logout
  bumps it. (Bumping it anywhere invalidates every outstanding token for
  that user, so "log out everywhere" is just "bump tokenVersion" if it's
  ever needed as its own endpoint — not built yet, nothing asked for it.)
- Ownership checks return `404`, not `403`, on another user's resource —
  existence isn't leaked to a caller who doesn't own it.
- Goals have an owner-controlled `isShared` flag: `false` keeps a goal
  strictly self-only (same 404-to-everyone-else behavior as before);
  `true` makes it read-only visible to other members of the owner's
  `familyGroupId`. Toggling it is a PATCH, and PATCH/DELETE stay
  owner-only regardless of `isShared` — sharing only ever grants read
  access, never write.
- `POST /api/auth/register` and `POST /api/auth/login` are each
  independently rate-limited (`express-rate-limit`, 10 requests / 15 min /
  IP per route — separate counters, so hammering one doesn't burn the
  other's budget).

## API surface

| Route                     | Auth         | Notes                                                                                                                                                                                                                                            |
| ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/auth/register` | rate-limited | body: `{ email, password, name, familyGroupId? }`. Omit `familyGroupId` to create a new `FamilyGroup` and become its `owner`; provide an existing one to join as `member` (404 if it doesn't exist). `role` is never read from the request body. |
| `POST /api/auth/login`    | rate-limited | body: `{ email, password }`                                                                                                                                                                                                                      |
| `POST /api/auth/logout`   | required     | bumps `tokenVersion`, clears cookie                                                                                                                                                                                                              |
| `GET /api/me`             | required     |                                                                                                                                                                                                                                                  |
| `GET /api/goals`          | required     | own goals + any `isShared` goals from the caller's family group, each item flagged `isOwner`                                                                                                                                                     |
| `POST /api/goals`         | required     | creates the caller's own goals doc (409 if one already exists — one per user); body may set `isShared`, defaults `false`                                                                                                                         |
| `GET /api/goals/:id`      | required     | 404 unless owned, or `isShared` and same `familyGroupId` as the owner                                                                                                                                                                            |
| `PATCH /api/goals/:id`    | required     | partial update incl. `isShared`; owner-only, 404 for anyone else regardless of `isShared`                                                                                                                                                        |
| `DELETE /api/goals/:id`   | required     | owner-only, 404 for anyone else regardless of `isShared`                                                                                                                                                                                         |

Request/response shapes are Zod schemas in `packages/shared` (`user.ts`,
`family-group.ts`, `goals.ts`, `auth.ts`) — imported here, never redefined.

## Known v1 gaps (accepted, not bugs)

- No invite-code/approval flow for joining a family group — anyone who has
  (or guesses) a `familyGroupId` can join as a member at registration.
  ObjectIds aren't practically guessable, and this is a personal-use app,
  so this wasn't built. Revisit if NutriSync ever has untrusted users.
  Revisit trigger: this is low-risk only because a `familyGroupId` is
  currently shared out-of-band by the user themselves — the moment any UI
  surfaces it somewhere shareable (a "join family" screen, a copyable
  invite code, a QR code, etc.), it needs real access control.
- No refresh-token rotation (see above).

Sharing model: isShared boolean, owner-controlled, family-group-scoped
read access. Established in Goals (Phase 2 follow-up); reuse the same
pattern for food/exercise logs when built.

List responses use a flat array with an isOwner boolean per item, not
separate own/family arrays — chosen because logs will need chronological
family-feed sorting, which a flat shape supports naturally.
