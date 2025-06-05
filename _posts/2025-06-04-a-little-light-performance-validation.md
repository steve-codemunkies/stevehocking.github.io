---
layout: 	post
title:  	"A little light performance validation"
description:  "Is this a string value, or... Never mind!"
date:   	2025-06-04 16:00:00
categories: dotnet8 benchmarkdotnet list switch performance-testing string int
comments: false
page-type: article
hero-image: /assets/2021-05-03-web-dev.jpg
tile-image: /assets/2021-05-03-web-dev-tile.jpg
---

**Demo source**: [dotnet-list-contain](https://github.com/steve-codemunkies/dotnet-list-contain)

Recently I was talking with a developer and remarked that newing up a `List<string>` with the same values each time a function was called was not the most performant way of doing things. The developer asked me what the right way is, to which I replied "elevate it to a class field and declare it as `private static readonly List<string>`.

## Why does this work?

As per [Static Classes and Static Class Members](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-classes-and-static-class-members#static-members):

* Static fields exist even when no instances of the class exist
* Only one copy of the static field exists
* Static members (including fields) are initialised before the static constructor is called

By declaring the field [`readonly`](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/readonly) we stop class methods and functions changing the `List<Tstring>`, though because it is an object it is possible to use _methods or functions_ on the object to effect internal changes.

## How to measure the impact of the change?

A popular way of benchmarking code in the dotnet universe is [BenchmarkDotNet](https://benchmarkdotnet.org/).

Of course running _reliable_ benchmarks is hard. You need to be running as close to the metal as possible, you need as much other software as possible disabled, and you need to make sure that you are measuring what you _think_ you're measuring. This blog post _is not_ a tutorial on any of that.

Initially I wanted to keep things simple, so I setup a [simple benchmark](https://github.com/steve-codemunkies/dotnet-list-contain/blob/24c667e9118680fbe652f60278d3d06196924ad0/BenchmarkListCheck/ListIntContains.cs) between a function local `List<int>` and `private static readonly` class field:

```csharp
public class ListIntContains
{
    private static readonly Random _random = new Random();
    private static readonly List<int> _list = [ 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96 ];

    [Benchmark(Baseline = true)]
    public bool LocalListContainsInt()
    {
        var list = new List<int> { 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98 };
        return list.Contains(_random.Next(1, 100));
    }

    [Benchmark]
    public bool StaticReadonlyListContainsInt()
    {
        return _list.Contains(_random.Next(1, 100));
    }
}
```

Clearly there are better ways of checking if a number is even or not, but that wouldn't tell us how fast the code is, or indeed how much memory is used:

| Method                        | Mean     | Error    | StdDev   | Ratio | Gen0   | Allocated | Alloc Ratio |
|------------------------------ |---------:|---------:|---------:|------:|-------:|----------:|------------:|
| LocalListContainsInt          | 97.57 ns | 0.963 ns | 0.804 ns |  1.00 | 0.0516 |     648 B |        1.00 |
| StaticReadonlyListContainsInt | 10.31 ns | 0.121 ns | 0.113 ns |  0.11 |      - |         - |        0.00 |

The version that uses a static `List<int>` in a field is 9.46 times faster. Not bad at all.

## Too simple

The problem with the sample code is that it is a little bit unrealistic. Sure from time to time you will get a numeric code, but you're more likely to encounter string based codes.

## Case-sensitive comparisson

The next step is to setup a more realistic comparison using `List<string>`:

```csharp
public class ListStringCaseSensitiveContains
{
    private static readonly string[] _codesArray = [
        "Ab12",
        "Gh56Ij",
        "Mn90Op12",
        "St34Uv56",
        "Yz78Ab90Cd",
        "Ef12Gh34",
        "Kl56Mn78Op",
        "Qr90St12Uv",
        "Wx34Yz56Ab",
        "Cd78Ef90"
    ];
    private static readonly List<string> _codesList = new(_codesArray);
    private static readonly string[] _testArray = [.. _codesArray,
        "1a2B3c4D",
        "6F7g8H9i0",
        "1k2L3m4N5",
        "6P7q8R9s0T",
        "1u2V3w4X5y",
        "6Z7a8b9c0d",
        "1E2f3G4h5I",
        "6J7k8L9m0N",
        "1O2p3Q4r5S",
        "6T7u8V9w0X"
    ];
    private Random _random = new();

    [Benchmark(Baseline = true)]
    public bool LocalListContainsStringCaseSensitive()
    {
        var list = new List<string>(_codesArray);
        return list.Contains(_testArray[_random.Next(0, _testArray.Length)]);
    }

    [Benchmark]
    public bool StaticReadonlyListContainsStringCaseSensitive()
    {
        return _codesList.Contains(_testArray[_random.Next(0, _testArray.Length)]);
    }
}
```

But whilst I was researching this post I came across [Steven Toub's excellent essay on .net 8.0 performance improvements](https://devblogs.microsoft.com/dotnet/performance-improvements-in-net-8/#frozen-collections), and I read with great interest the section on Frozen Collections and in particular using switch statements, rather than a list.

So I added a benchmark to compare `List<string>().Contains(string)` and `switch string`:

```csharp
public class ListStringCaseSensitiveContains
{
    private static readonly string[] _codesArray = [
        "Ab12",
        "Gh56Ij",
        "Mn90Op12",
        "St34Uv56",
        "Yz78Ab90Cd",
        "Ef12Gh34",
        "Kl56Mn78Op",
        "Qr90St12Uv",
        "Wx34Yz56Ab",
        "Cd78Ef90"
    ];
    private static readonly List<string> _codesList = new(_codesArray);
    private static readonly string[] _testArray = [.. _codesArray,
        "1a2B3c4D",
        "6F7g8H9i0",
        "1k2L3m4N5",
        "6P7q8R9s0T",
        "1u2V3w4X5y",
        "6Z7a8b9c0d",
        "1E2f3G4h5I",
        "6J7k8L9m0N",
        "1O2p3Q4r5S",
        "6T7u8V9w0X"
    ];
    private Random _random = new();

    [Benchmark(Baseline = true)]
    public bool LocalListContainsStringCaseSensitive()
    {
        var list = new List<string>(_codesArray);
        return list.Contains(_testArray[_random.Next(0, _testArray.Length)]);
    }

    [Benchmark]
    public bool StaticReadonlyListContainsStringCaseSensitive()
    {
        return _codesList.Contains(_testArray[_random.Next(0, _testArray.Length)]);
    }

    [Benchmark]
    public bool SwitchContainsStringCaseSensitive()
    {
        var testValue = _testArray[_random.Next(0, _testArray.Length)];
        return testValue switch
        {
            "Ab12" => true,
            "Gh56Ij" => true,
            "Mn90Op12" => true,
            "St34Uv56" => true,
            "Yz78Ab90Cd" => true,
            "Ef12Gh34" => true,
            "Kl56Mn78Op" => true,
            "Qr90St12Uv" => true,
            "Wx34Yz56Ab" => true,
            "Cd78Ef90" => true,
            _ => false
        };
    }
}
```

| Method                                        | Mean     | Error    | StdDev   | Ratio | RatioSD | Gen0   | Allocated | Alloc Ratio |
|---------------------------------------------- |---------:|---------:|---------:|------:|--------:|-------:|----------:|------------:|
| LocalListContainsStringCaseSensitive          | 59.03 ns | 1.105 ns | 1.034 ns |  1.00 |    0.02 | 0.0107 |     136 B |        1.00 |
| StaticReadonlyListContainsStringCaseSensitive | 32.31 ns | 0.562 ns | 0.525 ns |  0.55 |    0.01 |      - |         - |        0.00 |
| SwitchContainsStringCaseSensitive             | 14.42 ns | 0.064 ns | 0.050 ns |  0.24 |    0.00 |      - |         - |        0.00 |

As expected (from the previous test) the `private static readonly List<string>` performs better than the local `List<string>`, but the real eye opener (for me) is the speed of the switch statement. Based on the article we can suppose from this sample that because the lengths are different the incoming string is first tested for length, and then the starting letter, before finally comparing. But the speed improvement is still impressive. In the time it took to run one `.Contains()` on the local `List<string>` you can get four `switch` executions.

## Good, but how about when we need to be a little more robust?

The [robustness principal](https://en.wikipedia.org/wiki/Robustness_principle) states:

> be conservative in what you do, be liberal in what you accept from others

This was originally formulated by [Jon Postel](https://en.wikipedia.org/wiki/Jon_Postel) in relation to the original TCP specs. However it still applies now, and is a good principal to apply to systems that validate and process incoming data. Another way of thinking of this is:

> Be strict with outputs, but liberal with inputs

In otherwords for incoming data we can't necessarily expect case to be respected.

> [!Important]
> Sometimes it's not possible to to ignore case on incoming strings, especially on legacy systems were every bit mattered.

On this basis I wanted to understand the impact of normalising incoming data by changing it to lowercase. To do that I created the following [benchmark](https://github.com/steve-codemunkies/dotnet-list-contain/blob/main/BenchmarkListCheck/ListStringCaseInsensitiveContains.cs):

```csharp
public class ListStringCaseInsensitiveContains
{
    private static readonly string[] _codesArray = [
        "Ab12",
        "Gh56Ij",
        "Mn90Op12",
        "St34Uv56",
        "Yz78Ab90Cd",
        "Ef12Gh34",
        "Kl56Mn78Op",
        "Qr90St12Uv",
        "Wx34Yz56Ab",
        "Cd78Ef90"
    ];
    private static readonly List<string> _codesList = new(_codesArray);
    private static readonly string[] _testArray = [
        "AB12",
        "gh56ij",
        "MN90OP12",
        "st34uv56",
        "YZ78AB90CD",
        "eF12gH34",
        "kl56mn78Op",
        "qR90sT12uV",
        "wX34yZ56aB",
        "cd78ef90",
        "1A2B3C4D",
        "6f7g8h9i0",
        "1K2l3M4n5",
        "6P7q8R9s0T",
        "1u2V3w4X5y",
        "6Z7A8B9C0D",
        "1E2f3G4h5I",
        "6J7k8L9m0N",
        "1O2p3Q4r5S",
        "6T7u8V9w0X"
    ];
    private Random _random = new();

    [Benchmark(Baseline = true)]
    public bool LocalListContainsStringCaseInvariantCulture()
    {
        var list = new List<string>(_codesArray);
        return list.Contains(_testArray[_random.Next(0, _testArray.Length)], StringComparer.InvariantCultureIgnoreCase);
    }

    [Benchmark]
    public bool StaticReadonlyListContainsStringCaseInvariantCulture()
    {
        return _codesList.Contains(_testArray[_random.Next(0, _testArray.Length)], StringComparer.InvariantCultureIgnoreCase);
    }

    [Benchmark]
    public bool SwitchContainsStringCaseInsensitive()
    {
        var testValue = _testArray[_random.Next(0, _testArray.Length)].ToLowerInvariant();
        return testValue switch
        {
            "ab12" => true,
            "gh56ij" => true,
            "mn90op12" => true,
            "st34uv56" => true,
            "yz78ab90cd" => true,
            "ef12gh34" => true,
            "kl56mn78op" => true,
            "qr90st12uv" => true,
            "wx34yz56ab" => true,
            "cd78ef90" => true,
            _ => false
        };
    }
}
```

The initial run produces these results:

| Method                                               | Mean      | Error    | StdDev   | Ratio | Gen0   | Allocated | Alloc Ratio |
|----------------------------------------------------- |----------:|---------:|---------:|------:|-------:|----------:|------------:|
| LocalListContainsStringCaseInvariantCulture          | 248.19 ns | 1.800 ns | 1.684 ns |  1.00 | 0.0138 |     176 B |        1.00 |
| StaticReadonlyListContainsStringCaseInvariantCulture | 204.34 ns | 0.970 ns | 0.908 ns |  0.82 | 0.0031 |      40 B |        0.23 |
| SwitchContainsStringCaseInsensitive                  |  24.41 ns | 0.078 ns | 0.069 ns |  0.10 | 0.0029 |      36 B |        0.20 |

But in looking again at the [performance essay](https://devblogs.microsoft.com/dotnet/performance-improvements-in-net-8/#frozen-collections) I can see that Steven is using `OrdinalIgnoreCase`. Now I wasn't 100% sure, but couldn't help but think this also may impact performance, so added tests some further tests:

```csharp
public class ListStringCaseInsensitiveContains
{
    private static readonly string[] _codesArray = [
        "Ab12",
        "Gh56Ij",
        "Mn90Op12",
        "St34Uv56",
        "Yz78Ab90Cd",
        "Ef12Gh34",
        "Kl56Mn78Op",
        "Qr90St12Uv",
        "Wx34Yz56Ab",
        "Cd78Ef90"
    ];
    private static readonly List<string> _codesList = new(_codesArray);
    private static readonly string[] _testArray = [
        "AB12",
        "gh56ij",
        "MN90OP12",
        "st34uv56",
        "YZ78AB90CD",
        "eF12gH34",
        "kl56mn78Op",
        "qR90sT12uV",
        "wX34yZ56aB",
        "cd78ef90",
        "1A2B3C4D",
        "6f7g8h9i0",
        "1K2l3M4n5",
        "6P7q8R9s0T",
        "1u2V3w4X5y",
        "6Z7A8B9C0D",
        "1E2f3G4h5I",
        "6J7k8L9m0N",
        "1O2p3Q4r5S",
        "6T7u8V9w0X"
    ];
    private Random _random = new();

    [Benchmark(Baseline = true)]
    public bool LocalListContainsStringCaseInvariantCulture()
    {
        var list = new List<string>(_codesArray);
        return list.Contains(_testArray[_random.Next(0, _testArray.Length)], StringComparer.InvariantCultureIgnoreCase);
    }

    [Benchmark]
    public bool StaticReadonlyListContainsStringCaseInvariantCulture()
    {
        return _codesList.Contains(_testArray[_random.Next(0, _testArray.Length)], StringComparer.InvariantCultureIgnoreCase);
    }

    [Benchmark]
    public bool LocalListContainsStringCaseOrdinal()
    {
        var list = new List<string>(_codesArray);
        return list.Contains(_testArray[_random.Next(0, _testArray.Length)], StringComparer.OrdinalIgnoreCase);
    }

    [Benchmark]
    public bool StaticReadonlyListContainsStringCaseOrdinal()
    {
        return _codesList.Contains(_testArray[_random.Next(0, _testArray.Length)], StringComparer.InvariantCultureIgnoreCase);
    }

    [Benchmark]
    public bool SwitchContainsStringCaseInsensitive()
    {
        var testValue = _testArray[_random.Next(0, _testArray.Length)].ToLowerInvariant();
        return testValue switch
        {
            "ab12" => true,
            "gh56ij" => true,
            "mn90op12" => true,
            "st34uv56" => true,
            "yz78ab90cd" => true,
            "ef12gh34" => true,
            "kl56mn78op" => true,
            "qr90st12uv" => true,
            "wx34yz56ab" => true,
            "cd78ef90" => true,
            _ => false
        };
    }
}
```

And these are the results that come out:

| Method                                               | Mean      | Error    | StdDev   | Ratio | Gen0   | Allocated | Alloc Ratio |
|----------------------------------------------------- |----------:|---------:|---------:|------:|-------:|----------:|------------:|
| LocalListContainsStringCaseInvariantCulture          | 248.19 ns | 1.800 ns | 1.684 ns |  1.00 | 0.0138 |     176 B |        1.00 |
| StaticReadonlyListContainsStringCaseInvariantCulture | 204.34 ns | 0.970 ns | 0.908 ns |  0.82 | 0.0031 |      40 B |        0.23 |
| LocalListContainsStringCaseOrdinal                   |  94.95 ns | 0.679 ns | 0.602 ns |  0.38 | 0.0139 |     176 B |        1.00 |
| StaticReadonlyListContainsStringCaseOrdinal          | 204.29 ns | 1.126 ns | 0.940 ns |  0.82 | 0.0031 |      40 B |        0.23 |
| SwitchContainsStringCaseInsensitive                  |  24.41 ns | 0.078 ns | 0.069 ns |  0.10 | 0.0029 |      36 B |        0.20 |

Let me re-organise them:

| Method                                               | Mean      | Error    | StdDev   | Ratio | Gen0   | Allocated | Alloc Ratio |
|----------------------------------------------------- |----------:|---------:|---------:|------:|-------:|----------:|------------:|
| LocalListContainsStringCaseInvariantCulture          | 248.19 ns | 1.800 ns | 1.684 ns |  1.00 | 0.0138 |     176 B |        1.00 |
| StaticReadonlyListContainsStringCaseInvariantCulture | 204.34 ns | 0.970 ns | 0.908 ns |  0.82 | 0.0031 |      40 B |        0.23 |
| StaticReadonlyListContainsStringCaseOrdinal          | 204.29 ns | 1.126 ns | 0.940 ns |  0.82 | 0.0031 |      40 B |        0.23 |
| LocalListContainsStringCaseOrdinal                   |  94.95 ns | 0.679 ns | 0.602 ns |  0.38 | 0.0139 |     176 B |        1.00 |
| SwitchContainsStringCaseInsensitive                  |  24.41 ns | 0.078 ns | 0.069 ns |  0.10 | 0.0029 |      36 B |        0.20 |

Using a switch statement is still the most performant way to compare a string to a known list of strings, but if you need to compare to a list of values _that you don't know at compile time_ then strongly consider using a local `List<string>` passing `StringComparer.OrdinalIgnoreCase` to the `.Contains()` function.

It's also worth noting that all versions of the code incur some memory allocation, the reason for this is that both are lower-casing strings to enable a real comparisson.

## Bonus: does switch bring the same improvements for `int`?

One last thing that occurred to me was that I hadn't tried a switch statement for `int` list. So I updated the [benchmark code](https://github.com/steve-codemunkies/dotnet-list-contain/blob/main/BenchmarkListCheck/ListIntContains.cs):

```csharp
public class ListIntContains
{
    private static readonly Random _random = new Random();
    private static readonly List<int> _list = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96];

    [Benchmark(Baseline = true)]
    public bool LocalListContainsInt()
    {
        var list = new List<int> { 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98 };
        return list.Contains(_random.Next(1, 100));
    }

    [Benchmark]
    public bool StaticReadonlyListContainsInt()
    {
        return _list.Contains(_random.Next(1, 100));
    }

    [Benchmark]
    public bool SwitchContainsInt()
    {
        return _random.Next(1, 100) switch
        {
            2 => true,
            4 => true,
            6 => true,
            8 => true,
            10 => true,
            12 => true,
            14 => true,
            16 => true,
            18 => true,
            20 => true,
            22 => true,
            24 => true,
            26 => true,
            28 => true,
            30 => true,
            32 => true,
            34 => true,
            36 => true,
            38 => true,
            40 => true,
            42 => true,
            44 => true,
            46 => true,
            48 => true,
            50 => true,
            52 => true,
            54 => true,
            56 => true,
            58 => true,
            60 => true,
            62 => true,
            64 => true,
            66 => true,
            68 => true,
            70 => true,
            72 => true,
            74 => true,
            76 => true,
            78 => true,
            80 => true,
            82 => true,
            84 => true,
            86 => true,
            88 => true,
            90 => true,
            92 => true,
            94 => true,
            _ => false
        };
    }

    [Benchmark]
    public bool CalculateContains()
    {
        var value = _random.Next(1, 100);

        if (value < 1 || value > 99)
        {
            return false;
        }

        return value % 2 == 0;
    }
}
```

As you can see I also decided to test the calculation route (for this case only). And these are the results:

| Method                        | Mean       | Error     | StdDev    | Ratio | RatioSD | Gen0   | Allocated | Alloc Ratio |
|------------------------------ |-----------:|----------:|----------:|------:|--------:|-------:|----------:|------------:|
| LocalListContainsInt          | 99.6789 ns | 1.9879 ns | 3.6847 ns | 1.001 |    0.05 | 0.0516 |     648 B |        1.00 |
| StaticReadonlyListContainsInt | 10.8329 ns | 0.2273 ns | 0.2126 ns | 0.109 |    0.00 |      - |         - |        0.00 |
| SwitchContainsInt             |  6.8804 ns | 0.0422 ns | 0.0394 ns | 0.069 |    0.00 |      - |         - |        0.00 |
| CalculateContains             |  0.7428 ns | 0.0186 ns | 0.0174 ns | 0.007 |    0.00 |      - |         - |        0.00 |

The `private static readonly` is much more performant than the local `List<int>` - taking just over one tenth of the time of the local list. However despite my expectations using a switch is faster than doing a `.Contains` against the `private static readonly List<int>`, the difference isn't massive, but if this code is running millions of times a day it may make a difference. I didn't think there was much optimisation possible, but probably you don't need to do any optimisation when you're comparing some bytes.

The real winner though is the calculation. The criteria is simple (is the value an even number greater than 0 and less than 100?) and can easily be written as code. This kind of straightforward calculation is a CPUs bread and butter, and is optimised within a (micro)milimetre of it's life.

## But why does it matter?

So really, why does any of this matter? None of these search and compare methods are even taking milliseconds, at worst they're taking a few hundred nanoseconds.

The answer is in the tables above, the quicker you find the data the less processing you are doing. Additionally if you're not allocating memory (or, in the case-insensitive comparisons, allocating less memory) then you don't need as much memory allocating to your execution environment.

If you're running in a colo facility your servers may not need to be as massively specified, or can be used more efficiently.

If you're running in the cloud, it's a similar story, your function or app server may not need to be as beefily specified. Additionally if you're paying on an execution time basis you'll need to pay for fewer cpu cycles.

Of course, making these changes in one place won't have the expected impact, you'll need to make the changes _everywhere_.

## Actionable recommendations

* Do you really need to compare the value to a list, can you do a calculation to validate the value instead?
* Do you know your list of values at compile time? If you do strongly consider using a switch statement, beyond calculating a result this is the fastest way to check if a value (especially a string) is in a set of values.
* Can you load the list of values at the start of runtime? Are they a slowly evolving or infrequently changing list of values? In this case load the values into `private static readonly` once at startup, and consider periodically refreshing the list. Remember, the `static` does not need to be local to the checking code, simply available to it.
* Unless you really can't, avoide `new`ing up a structure and checking against, unless you are doing this extremely infrequently. Think - CPU and Memory === 💸💸💸.