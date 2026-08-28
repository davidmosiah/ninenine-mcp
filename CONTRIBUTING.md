# Contributing

1. Keep the default read-only. Money tools stay behind `NINENINE_ALLOW_MUTATIONS` **and** `explicit_user_intent`.
2. Tests must import shipped handlers from `dist/services/handlers.js`, not a reimplementation.
3. Do not add live 99 credentials to fixtures.
4. Ship only consumer paths that live-probe as JSON 200/400/401. Do not invent 403 PATH_NOT_ALLOWED routes.
5. Run `npm test` before opening a PR.
