---
name: android-testing
description: Android/Kotlin testing conventions — JUnit 5 or 4, MockK, Turbine for Flow, Jetpack Compose UI tests, Robolectric/instrumented tests. Use whenever writing, fixing or reviewing test files in an Android app, or working test-first on Android code — consulted by kotlin-android-developer, kotlin-android-reviewer and qa-engineer. The project's own testing conventions (README Testing section, ADRs, existing tests) always win over these defaults.
---

# Android Testing

Tests describe behavior a user or caller can observe — a Compose screen's
rendered state, a ViewModel's exposed `StateFlow`, a repository's contract
— not internals. Written first, run fast, fail for one reason.

## 0. Detect before writing

1. **Project conventions win.** Read the app module `README.md` (Testing
   section), ADRs, `build.gradle.kts` test dependencies, and the **nearest
   existing test of the same kind** (ViewModel / Composable / repository).
   Mirror its structure, helpers and naming.
2. **Two test source sets**: `src/test` (local JVM, Robolectric or pure
   Kotlin — fast, run on every change) and `src/androidTest` (instrumented,
   runs on a device/emulator — reserve for what genuinely needs the
   Android framework: real `Context`, real Compose rendering pipeline,
   navigation). Default to local tests; instrumented only when the project
   already relies on them or the behavior cannot be verified otherwise.
3. **Runner**: JUnit 4 (`@RunWith(AndroidJUnit4::class)`) is still the
   Android norm even in Kotlin-first projects because of tooling support;
   JUnit 5 appears in pure-Kotlin modules without Android dependencies —
   follow what's already configured.
4. **Mocking**: MockK (handles coroutines, `final` classes natively).
5. **Coroutines/Flow**: `kotlinx-coroutines-test` (`runTest`,
   `TestDispatcher`) and Turbine (`flow.test { awaitItem() }`) for
   asserting `StateFlow`/`SharedFlow` emissions — the idiomatic pair for
   ViewModel tests.
6. **Compose UI tests**: `createComposeRule()` (unit-level, no Activity) or
   `createAndroidComposeRule<MainActivity>()` (needs an Activity/NavHost).
   Prefer the former unless the test needs navigation or Activity-scoped
   state.
7. **DI**: if the project uses Hilt, `@HiltAndroidTest` +
   `HiltAndroidRule` for instrumented tests needing the real graph; for
   ViewModel unit tests, construct the ViewModel directly with faked
   dependencies — don't spin up Hilt for a unit test.
8. **Commands**: `./gradlew testDebugUnitTest` (local), `./gradlew
   connectedDebugAndroidTest` (instrumented, needs a device/emulator —
   skip and say so if none is attached), single class with `--tests
   "com.example.FooTest"`. A **git worktree** has no Gradle cache of its
   own — the wrapper restores on first run. Read-only roles (reviewer, QA)
   run the same test tasks; no separate install step.

## 1. TDD loop

1. **Red** — one test for one behavior through the public surface (emitted
   `StateFlow` value, rendered Compose node, repository return/thrown
   value). Run it; it must fail for the expected reason.
2. **Green** — smallest change that passes.
3. **Refactor** — clean up code and test; stay green.
4. Next behavior: happy path, then edges and failures (below).
5. Run the module's local test task before reporting done; instrumented
   tests only when the project's CI/README says they gate the change and a
   device is available.

**Existing code without tests** (characterization): write from observed
behavior, then prove each test is not vacuous — break the guarded code
briefly, see it fail, restore it.

## 2. What to use for what

| Unit | Approach |
|---|---|
| Pure function / mapper / use case | Direct call, no framework. `@MethodSource`/parameterized for tables of cases. |
| ViewModel | Construct directly with faked/mocked dependencies (MockK); drive it by calling its public functions, assert on its exposed `StateFlow`/`State` with Turbine or `.value` after `runTest`. Don't reach into private fields. |
| Repository / data source | Fake the remote/local data source (interface + fake implementation, or MockK), assert the documented contract: caching behavior, error mapping, offline fallback. |
| Compose screen (stateless) | `createComposeRule()`, `setContent { MyScreen(state = …, onAction = …) }`, assert with `onNodeWithText` / `onNodeWithContentDescription` / `onNodeWithTag`, interact with `performClick()` / `performTextInput()`. |
| Compose screen (stateful, needs NavHost/Activity) | `createAndroidComposeRule<MainActivity>()` — instrumented only. |
| Navigation | `TestNavHostController` for unit-level nav assertions; full instrumented test only for flows the project already covers that way. |
| Coroutines/Flow timing | `runTest { }` with `TestDispatcher` injected (never a hardcoded `Dispatchers.IO`/`Main` inside the class under test — inject a `CoroutineDispatcher`). |

## 3. Compose UI test essentials

```kotlin
@get:Rule
val composeRule = createComposeRule()

@Test
fun showsErrorState_whenLoadFails() {
    composeRule.setContent {
        ProductScreen(state = ProductUiState.Error("Network unavailable"))
    }

    composeRule.onNodeWithText("Network unavailable").assertIsDisplayed()
    composeRule.onNodeWithText("Retry").assertHasClickAction()
}

@Test
fun emitsRetry_whenRetryClicked() {
    var retried = false
    composeRule.setContent {
        ProductScreen(state = ProductUiState.Error("x"), onRetry = { retried = true })
    }

    composeRule.onNodeWithText("Retry").performClick()

    assertTrue(retried)
}
```
Query like a user: `onNodeWithText` / `onNodeWithContentDescription` over
`onNodeWithTag` where there's accessible text — a `testTag` is a fallback
for nodes with no stable accessible label, not the default. Renaming an
existing `testTag` that an instrumented/E2E suite depends on → flag it.

## 4. ViewModel + Turbine

```kotlin
@Test
fun loadsProducts_onInit() = runTest {
    val repo = mockk<ProductRepository>()
    coEvery { repo.getProducts() } returns listOf(Product("1", "Widget"))

    val viewModel = ProductViewModel(repo, dispatcher = StandardTestDispatcher(testScheduler))

    viewModel.uiState.test {
        assertEquals(ProductUiState.Loading, awaitItem())
        assertEquals(ProductUiState.Success(listOf(Product("1", "Widget"))), awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}
```

## 5. Cases worth a test (and only those)

Derive from the acceptance criteria, then add the realistic failures:

- **States** — loading, empty, error, partial/offline data.
- **Network failures** — timeout, 4xx/5xx mapped to the UI state the
  screen branches on, no-connectivity path if the app has one.
- **Input edges** — empty/invalid form input, boundary values the code
  branches on.
- **Lifecycle/rotation** — only where the project's ViewModel/state
  survival is actually at risk (e.g. `SavedStateHandle` usage) — don't
  test configuration change for screens with no state to lose.
- **Accessibility** — content descriptions present on icon-only actions;
  touch targets reachable (project's existing a11y checks, if any).
- **Permissions** — a feature gated on a runtime permission: both granted
  and denied paths.

Skip what adds no confidence: the Compose framework itself, trivial
`data class` equality, private functions, snapshot tests of the whole
screen as a substitute for behavior assertions.

## 6. Anti-patterns

| Bad | Good | Why |
|---|---|---|
| `Thread.sleep()` / fixed delay in a test | `runTest` virtual time, Turbine's `awaitItem()` | Flaky, slow |
| Hardcoded `Dispatchers.IO` inside the class under test | Inject a `CoroutineDispatcher`, swap for `TestDispatcher` in tests | Untestable concurrency |
| Instrumented test for logic with no Android dependency | Local JVM test | 10–100x slower, needs a device |
| `onNodeWithTag` for everything | Query by accessible text/role first | Also exercises accessibility |
| Mocking the ViewModel to test the ViewModel | Test the real ViewModel with faked dependencies | Mocking the thing under test proves nothing |

## Run

Local: `./gradlew testDebugUnitTest` (module-scoped:
`./gradlew :app:testDebugUnitTest`), single class with `--tests
"com.example.FooTest"`. Instrumented (needs a device/emulator):
`./gradlew connectedDebugAndroidTest`.
