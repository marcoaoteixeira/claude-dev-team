---
name: xunit
description: Get best practices for XUnit unit testing, including data-driven tests
---

# XUnit Best Practices

Goal: Write effective unit tests with XUnit, cover both standard and data-driven.

## Project Setup

- Use separate test project. Name convention `[ProjectName].Tests`
- Reference packages: `xunit.v3`, `xunit.runner.visualstudio` 3.x, `Microsoft.NET.Test.Sdk`
- Use .NET SDK test commands: `dotnet test`

## Test Structure

- Mirror classes: `CatDoor` -> `CatDoorTests`.
- Name tests using the pattern `MethodName_Scenario_ExpectedBehavior`
- Use **public instance** classes; avoid **static** fields.
- No branching/conditionals inside tests.
- No class attribute; use `[Fact]`
- Parameterized tests: `[Theory]` with `[InlineData]`
- Setup/teardown: constructor and `IDisposable`
- Follow the Arrange-Act-Assert (AAA) pattern
- Use `IClassFixture<T>` for shared context between tests in a class
- Use `ICollectionFixture<T>` for shared context between multiple test classes
- **Parallelism gotcha:** xUnit runs test classes in different collections in
  parallel by default. If a fixture wraps a resource that isn't safe for
  concurrent use (a shared database, a shared file, static state), put every
  test class that touches it into the same `[Collection("Name")]` — that
  disables parallel execution across just those classes, not the whole suite.
- When testing async methods that needs `CancellationToken`, use `TestContext.Current.CancellationToken`

## Standard Tests

- Keep tests focused on a single behavior
- Avoid testing multiple behaviors in one test method
- Use clear assertions that express intent
- Include only the assertions needed to verify the test case
- Make tests independent and idempotent
- Avoid test interdependencies
- Avoid disk I/O; if needed, randomize paths, don't clean up, log file locations.
- Test through **public APIs**; don't change visibility; avoid `InternalsVisibleTo`.

## Data-Driven Tests

- Use `[Theory]` combined with data source attributes
- Use `[InlineData]` for inline test data
- Use `[MemberData]` for method-based test data
- Use `[ClassData]` for class-based test data
- Create custom data attributes by implementing `DataAttribute`
- Use meaningful parameter names

## Assertions

- Use `Assert.Equal` for value equality
- Use `Assert.Same` for reference equality
- Use `Assert.True`/`Assert.False` for boolean conditions
- Use `Assert.Contains`/`Assert.DoesNotContain` for collections
- Use `Assert.Matches`/`Assert.DoesNotMatch` for regex pattern matching
- Use `Assert.Throws<T>` or `await Assert.ThrowsAsync<T>` to test exceptions

## Mocking and Isolation

- Mock dependencies to isolate units under test
- Use interfaces to facilitate mocking
- Consider using a DI container for complex test setups

## Test Organization

- Group tests by feature or component
- Categorize tests with `[Trait("Category", "...")]`; filter with
  `dotnet test --filter "Category=..."`
- Use collection fixtures to group tests with shared dependencies — see the
  parallelism gotcha above when the shared resource isn't concurrency-safe
- Consider output helpers (`ITestOutputHelper`) for test diagnostics
- Skip tests conditionally with `Skip = "reason"` in fact/theory attributes

## Core Patterns

### Basic Test

```csharp
using Xunit;

public class CalculatorTests
{
    private readonly Calculator _calc = new();

    [Fact]
    public void Add_TwoPositiveNumbers_ReturnsSum()
    {
        Assert.Equal(5, _calc.Add(2, 3));
    }

    [Fact]
    public void Divide_ByZero_ThrowsException()
    {
        Assert.Throws<DivideByZeroException>(() => _calc.Divide(10, 0));
    }
}
```

### Theory (Parameterized)

```csharp
[Theory]
[InlineData(2, 3, 5)]
[InlineData(-1, 1, 0)]
[InlineData(0, 0, 0)]
public void Add_ReturnsCorrectSum(int a, int b, int expected)
{
    Assert.Equal(expected, _calc.Add(a, b));
}

[Theory]
[MemberData(nameof(GetTestData))]
public void Add_WithMemberData(int a, int b, int expected)
{
    Assert.Equal(expected, _calc.Add(a, b));
}

public static IEnumerable<object[]> GetTestData()
{
    yield return new object[] { 1, 2, 3 };
    yield return new object[] { -1, -1, -2 };
}

[Theory]
[ClassData(typeof(CalculatorTestData))]
public void Add_WithClassData(int a, int b, int expected)
{
    Assert.Equal(expected, _calc.Add(a, b));
}
```

### Assertions

```csharp
Assert.Equal(expected, actual);
Assert.NotEqual(unexpected, actual);
Assert.True(condition);
Assert.False(condition);
Assert.Null(obj);
Assert.NotNull(obj);
Assert.Contains("sub", str);
Assert.DoesNotContain("x", str);
Assert.Empty(collection);
Assert.Single(collection);
Assert.Collection(list,
    item => Assert.Equal("first", item),
    item => Assert.Equal("second", item));
Assert.IsType<MyClass>(obj);
var ex = Record.Exception(() => Method());
var exFromAsync = await Record.ExceptionAsync(async () => await MethodAsync());
Assert.Equal("message", ex.Message);
Assert.InRange(value, 1, 10);
```

### Shared Context (IClassFixture)

```csharp
public class DatabaseFixture : IDisposable
{
    public DbConnection Connection { get; }
    public DatabaseFixture() { Connection = new DbConnection("test"); }
    public void Dispose() { Connection.Close(); }
}

public class UserTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;
    public UserTests(DatabaseFixture fixture) { _fixture = fixture; }

    [Fact]
    public void GetUser_ReturnsUser()
    {
        var user = _fixture.Connection.Query<User>("SELECT * FROM Users LIMIT 1");
        Assert.NotNull(user);
    }
}
```

### Shared Context Across Classes (ICollectionFixture)

```csharp
[CollectionDefinition("Database collection")]
public class DatabaseCollection : ICollectionFixture<DatabaseFixture> { }

[Collection("Database collection")]
public class UserTests
{
    private readonly DatabaseFixture _fixture;
    public UserTests(DatabaseFixture fixture) { _fixture = fixture; }

    [Fact]
    public void GetUser_ReturnsUser()
    {
        var user = _fixture.Connection.Query<User>("SELECT * FROM Users LIMIT 1");
        Assert.NotNull(user);
    }
}

[Collection("Database collection")]
public class OrderTests
{
    // Runs sequentially with UserTests because both are in "Database
    // collection" — safe for the shared, non-thread-safe DatabaseFixture
    // connection. Test classes in a different (or no) collection would
    // still run in parallel with these two.
}
```

### Constructor/Dispose (Per-Test Setup)

```csharp
public class MyTests : IDisposable
{
    private readonly MyService _service;
    public MyTests() { _service = new MyService(); }   // SetUp
    public void Dispose() { _service.Cleanup(); }       // TearDown

    [Fact]
    public void TestSomething() { Assert.True(_service.IsReady); }
}
```

### Anti-Patterns

| Bad | Good | Why |
|-----|------|-----|
| `[Fact]` with parameters | `[Theory]` + `[InlineData]` | xUnit convention |
| Static state | `IClassFixture` | Test isolation |
| No `IDisposable` | Implement for cleanup | Resource management |
| Shared resource, no `[Collection]` | Group into a `[Collection]` | Avoid parallel-run races |

## Run: `dotnet test` or `dotnet test --filter "Category=UnitTest"`
