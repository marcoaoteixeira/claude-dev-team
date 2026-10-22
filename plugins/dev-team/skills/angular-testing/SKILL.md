---
name: angular-testing
description: Angular unit-testing conventions with Vitest 4 (Angular's @angular/build:unit-test runner), Angular Testing Library, HttpTestingController and TDD. Use whenever writing, fixing or reviewing *.spec.ts files in an Angular project, or working test-first on Angular code — consulted by frontend-developer-angular, frontend-reviewer-angular and qa-engineer. The project's own testing conventions (README Testing section, ADRs, existing specs) always win over these defaults.
---

# Angular Testing (Vitest 4)

Tests describe behavior a user or caller can observe. They are written
first, run fast, and fail for one reason.

## 0. Detect before writing

1. **Project conventions win.** Read the frontend `README.md` (Testing,
   Accessibility, Conventions sections), testing ADRs, and the **nearest
   existing spec of the same kind** (component / service / guard / pure
   logic). Mirror its structure, helpers and naming.
2. **Runner.** `angular.json` → `architect.test.builder`:
   - `@angular/build:unit-test` → Vitest (this skill). Note `setupFiles`
     (globals such as jest-dom matchers live there).
   - `@angular-builders/jest` / `jest-preset-angular` → Jest — same
     principles, swap the API (`jest.fn`, `jest.spyOn`, `jest.useFakeTimers`).
   - Karma/Jasmine → legacy; follow the existing specs, do not migrate.
3. **Libraries** in `package.json`: `@testing-library/angular`,
   `@testing-library/user-event`, `@testing-library/jest-dom`, `ng-mocks`,
   `jest-axe`. Use what is there; never add a competing library.
4. **Zone or zoneless.** `zone.js` absent from dependencies/polyfills →
   zoneless: no automatic change detection after async work.
5. **Commands** from `package.json` scripts (`pnpm test`,
   `pnpm test:coverage`). Single file:
   `pnpm ng test --watch=false --include "src/app/path/to/file.spec.ts"`.
   A **git worktree** has no `node_modules` of its own: install fresh from
   the lockfile (`pnpm install --frozen-lockfile` / `npm ci`) — never link
   another checkout's `node_modules`. Read-only roles (reviewer, QA) do not
   install: they call the CLI directly, since the package manager may try
   to install first:
   `node node_modules/@angular/cli/bin/ng.js test --watch=false --include "<spec>"`.
   Note any enforced coverage threshold.

## 1. TDD loop

1. **Red** — write one spec for one behavior through the public surface
   (DOM, public method, emitted value, HTTP request). Run it. It must fail
   **for the expected reason** (assertion, not a typo or missing import —
   create an empty stub so it compiles if needed).
2. **Green** — the smallest implementation that passes. Run the file.
3. **Refactor** — clean code and test; keep green. Run the file again.
4. Repeat per behavior: happy path, then edge and failure cases (see §5).
5. Per file: the single spec + lint on it. Before declaring the **task**
   done: the whole suite + lint + coverage (if a threshold is enforced) —
   once, not per file.

Never write the implementation first and back-fill tests.

**Existing code without tests** (characterization) is the one exception:
there is no honest red. Write the tests from the public behavior, then
prove they are not vacuous — temporarily break the code each test guards
(flip a value, drop a call, swap a mapping), confirm the test fails, and
restore the code. A test that stays green against broken code is deleted
or rewritten.

## 2. What to use for what

| Unit | Approach |
|---|---|
| Pure logic (`*.logic.ts`, mappers, validators) | Plain function calls. No TestBed. `it.each` for tables of cases. |
| Constants / config modules | Assert the documented contract or invariant (shape, "> 0", "A larger than B"), not tuning values that are expected to change. No contract worth stating → no spec. |
| Component that is a thin view over a signal service | Use the **real** lightweight service and mock only its collaborators (HTTP, notifications) — the delegation is the behavior under test. |
| Service with HTTP | `TestBed` with `provideHttpClient()` + `provideHttpClientTesting()` (in that order); `HttpTestingController`: `expectOne` → assert method/URL/body → `flush` / `error`; `httpMock.verify()` in `afterEach`. |
| Service without HTTP | `TestBed.inject` with mocked collaborators (`MockProvider` or `{ provide, useValue }`). |
| Component | Angular Testing Library `render(Component, { inputs, providers })`, query with `screen`, interact with `userEvent.setup()`. |
| Functional guard / resolver / interceptor | `TestBed.runInInjectionContext(() => guard(route, state))`; interceptors via `provideHttpClient(withInterceptors([...]))` + `HttpTestingController`. |
| Directive / pipe | Render a tiny host template (`render('<div appX></div>', { imports: [X] })`); pure pipes can be called directly. |

## 3. Components with Testing Library

- Query like a user: `getByRole('button', { name: /save/i })` >
  `getByLabelText` > `getByText` > `getByTestId`. If the project has a
  `data-testid` convention, testid queries are fine — never derive a testid
  from display text.
- `getBy*` for present now, `queryBy*` to assert absence, `await findBy*`
  for appears-after-async.
- Interactions: `const user = userEvent.setup(); await user.click(...)`,
  `await user.type(...)`, `await user.keyboard('{Tab}')` — not
  `fireEvent`, not calling component methods.
- Inputs: `render(C, { inputs: { product } })`. Signal inputs work the same.
- Changing state after render (signals, inputs): `rerender({ inputs })` or
  set the signal, then `await fixture.whenStable()` / `findBy*` — zoneless
  apps do not re-render on their own.
- Mock injected services (`MockProvider(Service, { method: () => of(x) })`
  or `{ provide, useValue }`). Do not shallow-mock child components unless
  they are heavy or need unavailable infrastructure.
- If the project has an accessibility assertion helper (e.g.
  `expectNoA11yViolations`), call it in every spec file that renders a
  component — some projects enforce it with a lint rule. A component
  rendered on its own has no page landmark: disable only the landmark rule
  (`region`) for it, following the project's existing precedent.
- Design-system components often need injection tokens (icon sprites,
  config) to construct in a bare render. Copy the providers from the
  nearest spec that renders the same DS component instead of guessing.
- Lint the spec too: strict type-aware rules reject defensive code such as
  `textContent?.trim()` on a non-nullable value.

## 4. Async, time and observables

- **No `fakeAsync`, `tick`, `flush` (zone testing), `waitForAsync`** — they
  need zone.js and do not work under Vitest/zoneless.
- Timers: `vi.useFakeTimers()` → `await vi.advanceTimersByTimeAsync(ms)` →
  `vi.useRealTimers()` in `afterEach`.
- Promises/rendering: `await fixture.whenStable()`, `await screen.findBy*`.
- Observables: `await firstValueFrom(obs$)`, or subscribe and assert after
  `flush`. Use `TestScheduler` only where the project already does.
- Never `await new Promise(r => setTimeout(r, 100))` to "let things settle".

## 5. Cases worth a test (and only those)

Derive from the acceptance criteria, then add the realistic failures:

- **HTTP failures** — `error(new ProgressEvent('error'))` (network down /
  status 0), `flush(body, { status: 500, statusText: 'Server Error' })`,
  401/403/404 where the code branches on them, timeouts if a timeout
  operator exists, retries if a retry interceptor exists (assert the
  number of requests).
- **States** — loading, empty, error, partial data.
- **Input edges** — empty strings, missing optional fields, boundary values
  the code branches on.
- **User paths** — keyboard operation, disabled actions, unsaved changes.

Skip what adds no confidence: framework behavior, private methods,
trivial getters, snapshot tests, asserting CSS classes as a proxy for
behavior (unless the class *is* the contract).

## 6. Vitest specifics

- `vi.fn()`, `vi.spyOn(obj, 'method')`, `vi.mocked(fn)`; restore with
  `vi.restoreAllMocks()` in `afterEach` when spying on shared objects.
- `vi.mock('module')` only for modules you cannot inject (rare in Angular —
  prefer DI).
- jest-dom matchers (`toBeVisible`, `toHaveTextContent`, `toBeDisabled`)
  are available when the setup file imports `@testing-library/jest-dom/vitest`.
- `describe` per unit, `it('<does something> when <condition>')` in plain
  language; Arrange / Act / Assert visible in the body.
- One spec file next to the file under test: `x.ts` → `x.spec.ts`.

## 7. Skeletons

**Service with HTTP**
```ts
describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('returns the products from the API', async () => {
    const result = firstValueFrom(service.list());

    const req = httpMock.expectOne(apiUrl('/products'));
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1', name: 'A' }]);

    expect(await result).toEqual([{ id: '1', name: 'A' }]);
  });

  it('surfaces a server error to the caller', async () => {
    const result = firstValueFrom(service.list());

    httpMock.expectOne(apiUrl('/products')).flush('boom', { status: 500, statusText: 'Server Error' });

    await expect(result).rejects.toMatchObject({ status: 500 });
  });
});
```

**Component**
```ts
describe('ProductCard', () => {
  it('emits the product id when the user opens it', async () => {
    const open = vi.fn();
    const user = userEvent.setup();
    await render(ProductCard, {
      inputs: { product: { id: '42', name: 'Widget' } },
      on: { open },
    });

    await user.click(screen.getByRole('button', { name: /open widget/i }));

    expect(open).toHaveBeenCalledWith('42');
  });
});
```

**Functional guard**
```ts
it('redirects to /no-access when the user has no access', () => {
  TestBed.configureTestingModule({
    providers: [MockProvider(AuthService, { hasAccess: () => false })],
  });

  const result = TestBed.runInInjectionContext(() => accessGuard({} as never, {} as never));

  expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/no-access');
});
```
