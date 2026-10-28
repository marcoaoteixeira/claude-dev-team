---
name: kotlin-testing
description: Kotlin/JVM backend testing conventions with JUnit 5, Kotest assertions, MockK and kotlinx-coroutines-test. Use whenever writing, fixing or reviewing test files in a Kotlin backend (Ktor, Spring Boot, plain JVM services), or working test-first on Kotlin code — consulted by kotlin-android-developer, kotlin-android-reviewer and qa-engineer. The project's own testing conventions (README Testing section, ADRs, existing tests) always win over these defaults.
---

# Kotlin Backend Testing

Tests describe behavior through the public surface — a function, an HTTP
route, a message handler — not implementation details. Written first, run
fast, fail for one reason.

## 0. Detect before writing

1. **Project conventions win.** Read the backend `README.md` (Testing
   section), ADRs, `build.gradle.kts`/`pom.xml` test dependencies, and the
   **nearest existing test of the same kind**. Mirror its structure,
   helpers and naming.
2. **Framework**: JUnit 5 (`org.junit.jupiter`) is the default runner.
   Assertions: Kotest (`io.kotest.assertions.core`) if present, otherwise
   plain `kotlin.test` / AssertJ — use whichever the project already has,
   never add a competing library.
3. **Mocking**: MockK (`io.mockk`) is idiomatic for Kotlin (handles
   `final` classes, coroutines, extension functions); project may use
   Mockito-Kotlin instead — follow it.
4. **Coroutines**: `kotlinx-coroutines-test` — `runTest { }` for suspend
   functions, `TestScope`/virtual time for delays, `StandardTestDispatcher`
   vs `UnconfinedTestDispatcher` per what the project already injects.
5. **Framework-specific integration**: Ktor → `testApplication { }` +
   `ApplicationTestBuilder` client; Spring Boot → `@SpringBootTest` /
   `@WebMvcTest` + `MockMvc` or `WebTestClient`; neither → plain
   constructor injection with faked collaborators.
6. **Commands** from `build.gradle.kts` tasks: `./gradlew test` (or
   `gradlew.bat test` on Windows), a single class/method with
   `--tests "com.example.FooTest"` or `--tests "com.example.FooTest.aMethod"`.
   A **git worktree** has no Gradle cache of its own — the wrapper restores
   dependencies on first run; never point it at another checkout's
   `.gradle`. Read-only roles (reviewer, QA) run the same `gradlew test`
   task — Gradle is a build tool, not a package manager that mutates
   source; no separate "install" step is needed.

## 1. TDD loop

1. **Red** — one test for one behavior through the public surface (a
   function's return/thrown value, an HTTP response, a persisted
   record). Run it; it must fail for the expected reason (assertion, not
   a compile error — add an empty stub if needed).
2. **Green** — smallest change that passes.
3. **Refactor** — clean up code and test; stay green.
4. Next behavior: happy path, then edges and failures (below).
5. Run the full module's test task before reporting done, not just the
   file touched.

**Existing code without tests** (characterization): write the tests from
observed behavior, then prove each is not vacuous — break the guarded code
briefly, see the test fail, restore it.

## 2. What to use for what

| Unit | Approach |
|---|---|
| Pure function / mapper / validator | Direct call, no framework ceremony. `@ParameterizedTest` + `@MethodSource` (or Kotest `forAll`) for tables of cases. |
| Class with collaborators | Constructor injection with MockK (`mockk<T>()`, `every { … } returns …`, `coEvery { … } returns …` for suspend functions); verify with `verify { … }` / `coVerify { … }` only for interactions that matter, not every call. |
| Suspend function / coroutine flow | `runTest { }`; `Flow` assertions via `.toList()` on a finite flow, or Turbine (`flow.test { awaitItem(); awaitComplete() }`) if the project has it. |
| HTTP route (Ktor) | `testApplication { application { module() }; val client = createClient { } }`; assert status, headers, deserialized body. |
| HTTP route (Spring) | `@WebMvcTest` + `MockMvc.perform(...)`, or `@SpringBootTest(webEnvironment = RANDOM_PORT)` + `WebTestClient` for a fuller slice. |
| Repository / data access | Prefer a real test database (Testcontainers) over mocking the persistence layer for anything beyond trivial mapping — mocked repositories hide real query/mapping bugs. |
| Message/event handler | Fake the broker client; assert the handler's documented behavior (ack/nack, retry, idempotent re-delivery) rather than its internals. |

## 3. Assertions

Kotest style (if present):
```kotlin
result shouldBe expected
result.shouldNotBeNull()
exception.shouldBeInstanceOf<IllegalArgumentException>()
list shouldContainExactly listOf(1, 2, 3)
```
JUnit 5 / kotlin.test fallback:
```kotlin
assertEquals(expected, result)
assertNotNull(result)
assertThrows<IllegalArgumentException> { service.doThing() }
assertTrue(result.isEmpty())
```

## 4. MockK essentials

```kotlin
val repo = mockk<UserRepository>()
every { repo.findById(1) } returns User(1, "Ada")
coEvery { repo.findByIdAsync(1) } returns User(1, "Ada")

every { repo.findById(99) } throws NoSuchElementException()

verify(exactly = 1) { repo.findById(1) }
coVerify { repo.save(any()) }

val slot = slot<User>()
every { repo.save(capture(slot)) } returns Unit
// slot.captured — the argument passed
```
Relaxed mocks (`mockk<T>(relaxed = true)`) only when most calls genuinely
don't matter for the test — don't reach for them to avoid stubbing a call
the test actually depends on.

## 5. Cases worth a test (and only those)

Derive from the acceptance criteria, then add the realistic failures
**where the code has a branch or a promise to keep** for them:

- **Boundary/validation** — invalid, missing, oversized input → the
  documented error/exception/status code.
- **Authorization** — unauthenticated → 401, authenticated but not
  allowed → 403, another tenant's data → not visible.
- **Data** — not found, empty result, duplicates, optimistic-lock /
  version conflict, idempotent re-delivery for message handlers.
- **Dependencies failing** — database unavailable, downstream HTTP
  timeout/5xx, broker down: assert the behavior the code promises (retry
  count, mapped status, logged and rethrown, message not acknowledged).
- **Coroutine cancellation** where the code is cancellable and the
  contract says what happens on cancellation (cleanup, no partial write).

Skip what adds no confidence: the framework itself, private functions,
trivial `data class` equality, a coverage number for its own sake.

## 6. Anti-patterns

| Bad | Good | Why |
|---|---|---|
| `Thread.sleep()` to wait for async work | `runTest { }` + virtual time, or await the real signal | Flaky, slow |
| Mocking a repository for a query-correctness test | Testcontainers / an in-memory real DB | Mocks can't catch a wrong query |
| `relaxed = true` on every mock | Stub only what the test needs | Hides missing-stub bugs, weakens the test |
| Testing a `private` function via reflection | Test through the public method that calls it | Tests implementation, not behavior |
| One giant test asserting the whole object graph | One behavior per test, precise assertions | Failure doesn't say what broke |

## Run

`./gradlew test` (module-scoped: `./gradlew :module:test`), single test:
`./gradlew test --tests "FullyQualifiedName"`.
