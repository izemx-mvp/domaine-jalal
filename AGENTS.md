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

## Project rules

- Demo data lives in `src/data/seed.ts` and all state flows through `src/store/app-store.tsx` (React context + localStorage keys `domaine-jalal-data-v1` / `domaine-jalal-session-v1`) — the app has no backend, so one store is the single source of truth.
- Derived numbers (totals, statuses, per-entity stats, chart series) belong in `src/data/selectors.ts`, never inline in routes, so figures stay consistent across pages.
- App pages are children of the pathless `src/routes/_shell.tsx` layout, which owns navigation, page title and the global farm/period filters.
- `tsconfig.json` keeps `strict` but disables `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `noPropertyAccessFromIndexSignature`: the large generated demo dataset makes those flags pure noise here.
- New data slices (worker skills, `vetEvents`) are seeded in `src/data/seed-extras.ts`, whose `upgradeData()` backfills older localStorage saves — so existing demo sessions gain new features without a reset.
