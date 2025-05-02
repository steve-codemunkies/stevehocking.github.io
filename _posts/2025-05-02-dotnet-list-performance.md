---
layout: 	post
title:  	"Measuring the performance of List in dotnet 8"
description:  "Proving that newing up that list hurtful, and how to fix it. Plus bonus 'Exceptions?!?'"
date:   	2025-05-02 14:45:00
categories: dotnet8 benchmarkdotnet list performance-testing
comments: false
page-type: article
hero-image: /assets/2021-05-03-web-dev.jpg
tile-image: /assets/2021-05-03-web-dev-tile.jpg
---

**Demo source**: [dotnet-list-performance](https://github.com/steve-codemunkies/dotnet-list-performance)

Recently I was talking with a dev and remarked that newing up a `List<T>` with the same values each time a function was called was not performant. The dev asked me what the right way is, to which I replied "elevate it to the class field and declare it as `private static readonly List<T>`.

## Why does this work?

As per [Static Classes and Static Class Members](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-classes-and-static-class-members#static-members):
* Static fields exist even when no instances of the class exist
* Only one copy of the static field exists
* Static members (including fields) are initialised before the static onstructor is called

By declaring the field [`readonly`](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/readonly) we stop class methods and functions changing the `List<T>`, though because it is an object it is possible to use _methods or functions_ on the object to effect internal changes.

## How to measure the impact of the change?

A popular way of benchmarking code in the dotnet universe is [BenchmarkDotNet](https://benchmarkdotnet.org/).

Of course running _reliable_ benchmarks is hard. You need to be running as close to the metal as possible, you need as much other software as possible disabled, and you need to make sure that you are measuring what you _think_ you're measuring. This blog post _is not_ a tutorial on any of that.

To create my benchmarks I first created a simple class:

```charp
public class ListValidator
{
    private static readonly List<int> _list = [3, 6, 9];

    public bool ValidateIsInNewList(int value)
    {
        List<int> list = [3, 6, 9];
        return list.Contains(value);
    }

    public static bool ValidateIsInLocalStaticList(int value)
    {
        List<int> list = [3, 6, 9];
        return list.Contains(value);
    }

    public bool ValidateIsInReadOnlyList(int value)
    {
        return _list.Contains(value);
    }
}
```

I then created a class in my benchmark project to expose these methods to the benchmarking framework:

```csharp
[MemoryDiagnoser, RPlotExporter]
public class BenchmarkListValidator
{
    private ListValidator _listValidator = new ListValidator();
    private Random _random = new Random();

    [Benchmark]
    public bool NewList() => _listValidator.ValidateIsInNewList(_random.Next(0, 10));

    [Benchmark]
    public bool LocalStatic() => ListValidator.ValidateIsInLocalStaticList(_random.Next(0, 10));

    [Benchmark]
    public bool ReadOnly() => _listValidator.ValidateIsInReadOnlyList(_random.Next(0, 10));
}
```

And it takes one line of code to run the benchmark:

```csharp
var summary = BenchmarkRunner.Run<BenchmarkListValidator>();
```

## Results

The following results have been obtained on my Dell Inspiron 14 with an Intel Core Ultra 7 155H with 16Gb of RAM. When I ran the tests I was running on battery, which is important because Windows limits speed to prefer longer battery life.

| Method               | Mean         | Error      | StdDev      | Gen0   | Allocated |
|--------------------- |-------------:|-----------:|------------:|-------:|----------:|
| NewList              |    16.784 ns |  0.3415 ns |   0.3795 ns | 0.0057 |      72 B |
| LocalStatic          |    15.480 ns |  0.3118 ns |   0.4268 ns | 0.0057 |      72 B |
| ReadOnly             |     7.737 ns |  0.1797 ns |   0.2459 ns |      - |         - |

1 ns = 1 nanosecond, which equals 1 billionth of a second.

You can see from the table that using the `static readonly List<T>` is about half the time of the other two methods. As a bonus no memory is allocated during the call that uses the `static readonly List<T>`.

## Exceptions...?!

Looking even further in older code I found repeatedly a pattern that looks very much like this:

```csharp
public void ValidateIsInReadOnlyListException(int value)
{
    if(!_list.Contains(value))
    {
        throw new ArgumentException($"Value {value} is not in the list.");
    }
}
```

I extended the benchmark class out like this to test all three scenarios:

```csharp
[MemoryDiagnoser, RPlotExporter]
public class BenchmarkListValidator
{
    private ListValidator _listValidator = new ListValidator();
    private Random _random = new Random();

    [Benchmark]
    public bool NewList() => _listValidator.ValidateIsInNewList(_random.Next(0, 10));

    [Benchmark]
    public bool LocalStatic() => ListValidator.ValidateIsInLocalStaticList(_random.Next(0, 10));

    [Benchmark]
    public bool ReadOnly() => _listValidator.ValidateIsInReadOnlyList(_random.Next(0, 10));

    [Benchmark]
    public bool NewListException()
    {
        try
        { 
            _listValidator.ValidateIsInNewListException(_random.Next(0, 10));
            return true;
        }
        catch (ArgumentException)
        { 
            return false;
        };
    }

    [Benchmark]
    public bool LocalStaticException()
    {
        try
        { 
            ListValidator.ValidateIsInLocalStaticListException(_random.Next(0, 10));
            return true;
        }
        catch (ArgumentException)
        { 
            return false;
        };
    }

    [Benchmark]
    public bool ReadOnlyException()
    {
        try
        { 
            _listValidator.ValidateIsInReadOnlyListException(_random.Next(0, 10));
            return true;
        }
        catch (ArgumentException)
        { 
            return false;
        };
    }
}
```

Running the benchmarks show how inefficient using an `Exception()` to exit a method is:

| Method               | Mean         | Error      | StdDev      | Gen0   | Allocated |
|--------------------- |-------------:|-----------:|------------:|-------:|----------:|
| NewList              |    16.784 ns |  0.3415 ns |   0.3795 ns | 0.0057 |      72 B |
| LocalStatic          |    15.480 ns |  0.3118 ns |   0.4268 ns | 0.0057 |      72 B |
| ReadOnly             |     7.737 ns |  0.1797 ns |   0.2459 ns |      - |         - |
| NewListException     | 2,848.507 ns | 54.6339 ns |  67.0954 ns | 0.0267 |     375 B |
| LocalStaticException | 2,966.634 ns | 59.2027 ns | 134.8345 ns | 0.0267 |     374 B |
| ReadOnlyException    | 2,730.663 ns | 30.0810 ns |  25.1190 ns | 0.0229 |     302 B |

This doesn't mean that you shouldn't be using exceptions in your code, it just means that you should use them sensibly, and indicating that an item isn't in a list isn't the sensible option.
