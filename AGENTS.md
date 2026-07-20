<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## PR Checklist

Before opening or merging a pull request, verify:

- [ ] `npm ci` — clean install dependencies
- [ ] `npm run snapshot` — snapshot generation succeeds
- [ ] `npm test` — all tests pass
- [ ] `npm run lint` — no errors
- [ ] `npm run typecheck` — no TypeScript errors
- [ ] `npm run build` — production build succeeds
- [ ] Generated snapshot passes integrity validation (covered by `npm test`)

The CI workflow (`.github/workflows/ci.yml`) runs all of these automatically on
every pull request to `main`. Run them locally before pushing to save time.
