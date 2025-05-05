---
layout: 	post
title:  	"Comparing the performance of string search in dotnet 8"
description:  "Is this a string value, or... Never mind!"
date:   	2025-05-05 15:30:00
categories: dotnet8 benchmarkdotnet list performance-testing string
comments: false
page-type: article
hero-image: /assets/2021-05-03-web-dev.jpg
tile-image: /assets/2021-05-03-web-dev-tile.jpg
---

**Demo source**: [dotnet-string-list-performance](https://github.com/steve-codemunkies/dotnet-string-list-performance)

Previously ([Measuring the performance of List in dotnet 8](https://www.codemunki.es/2025/05/02/dotnet-list-performance/)) I discussed how you might store a list of values in a class designed to perform validation, how to verify the performance profile of your choice, and as a bonus why you shouldn't use exceptions to exit normal validation scenarios.

## Too simple

The problem with the sample code that I supplied for the previous blog post is that it is a little but unrealistic, too simple. Sure from time to time you will get a numeric code, but you're more likely to encounter string based codes.

## Access times

As previously discussed when creating performace tests or comparisons it's important to understand _what_ it is that you are testing. Part of the reason for using lists of integers in my previous post is that generating a random integer is reasonably cheap in the grand scheme of things.

However now we to perform three discrete operations:

1. Get the number of items in the source set
2. Generate a new random number
3. Retrieve the item from the source set

To understand the impact of my changes I created a [benchmark](https://github.com/steve-codemunkies/dotnet-string-list-performance/blob/main/StringListBenchmark/AccessBenchmark.cs) (ofc):

```csharp
[MemoryDiagnoser, RPlotExporter]
public class AccessBenchmark
{
    private static readonly string[] _codesArray = [
        "Ab12",
        ...,
        "6T7u8V9w0X"
    ];
    private static readonly List<string> _codesList = new(_codesArray);
    private Random _random = new();

    [Benchmark(Baseline = true)]
    public string ListAccess() => _codesList[_random.Next(0, _codesList.Count)];

    [Benchmark]
    public string ArrayAccess() => _codesArray[_random.Next(0, _codesArray.Length)];
}
```

Running the code produces these results:

| Method      | Mean      | Error     | StdDev    | Ratio | RatioSD | Allocated | Alloc Ratio |
|------------ |----------:|----------:|----------:|------:|--------:|----------:|------------:|
| ListAccess  | 0.9695 ns | 0.0286 ns | 0.0267 ns |  1.00 |    0.04 |         - |          NA |
| ArrayAccess | 0.6109 ns | 0.0574 ns | 0.0537 ns |  0.63 |    0.06 |         - |          NA |

The difference isn't that marked, (1 nano second is one billionth of a second), but pulling the test string from an array will have less impact.

## Case-sensitive comparisson

Whilst I was looking into writing the previous article I came across [Sten Toub's excellent essay on .net 8.0 performance improvements](https://devblogs.microsoft.com/dotnet/performance-improvements-in-net-8/#frozen-collections) I read with great interest the section on Frozen Collections and in particular using switch statements, rather than a list, for example.

So I set about creating a benchmark to compare `List<string>().Contains(string)` and `switch string`:

```csharp
[MemoryDiagnoser, RPlotExporter]
public class CaseSensitiveStringListValidation
{
    private static readonly string[] _codesArray = [
        "Ab12",
        ...,
        "Cd78Ef90"
    ];
    private static readonly List<string> _codesList = new(_codesArray);
    private static readonly string[] _testArray = [.. _codesArray,
        "1a2B3c4D",
        ...
        "6T7u8V9w0X"
    ];
    private Random _random = new();

    [Benchmark(Baseline = true)]
    public bool ListContains() => _codesList.Contains(_testArray[_random.Next(0, _testArray.Length)]);

    [Benchmark]
    public bool SwitchContains()
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

So what are the performance characteristics of this code?

| Method         | Mean     | Error    | StdDev   | Ratio | Allocated | Alloc Ratio |
|--------------- |---------:|---------:|---------:|------:|----------:|------------:|
| ListContains   | 32.89 ns | 0.106 ns | 0.089 ns |  1.00 |         - |          NA |
| SwitchContains | 15.38 ns | 0.324 ns | 0.464 ns |  0.47 |         - |          NA |

From my previous article using the `Contains()` method of the list was only taking ~7ns, as we can see from the result above using `Contains(string)` on a `List<string>` is over four times more expensive at ~32ns, and the complexity comes from the fact that we're now comparing strings.

However if you can generate a `switch` statement, then there is a real performance win available, with my example taking ~16ns on average.

## Being more robust (or liberal with inputs)

The [robustness principal](https://en.wikipedia.org/wiki/Robustness_principle) states:

> be conservative in what you do, be liberal in what you accept from others

This was originally formulated by [Jon Postel](https://en.wikipedia.org/wiki/Jon_Postel) in relation to the original TCP specs. However it still applies now, and is a good principal to apply to systems that validate and process incoming data. Another way of thinking of this is:

> Be strict with outputs, but liberal with inputs

In otherwords for incoming data don't necessarily expect case to be respected.

> [!Important]
> Sometimes it's not possible to to ignore case on incoming strings, especially on legacy systems were every bit mattered.

On this basis I wanted to understand the impact of normailising incoming data by changing it to lowercase. To do that I created the following [benchmark](https://github.com/steve-codemunkies/dotnet-string-list-performance/blob/main/StringListBenchmark/CaseInsensitiveStringListValidation.cs):

```csharp
[MemoryDiagnoser, RPlotExporter]
public class CaseInsensitiveStringListValidation
{
    private static readonly string[] _codesArray = [
        "Ab12",
        "Gh56Ij",
        ...
        "Wx34Yz56Ab",
        "Cd78Ef90"
    ];
    private static readonly List<string> _codesList = new(_codesArray);
    private static readonly string[] _testArray = [
        "AB12",
        "gh56ij",
        "MN90OP12",
        "st34uv56",
        ...
        "6J7k8L9m0N",
        "1O2p3Q4r5S",
        "6T7u8V9w0X"
    ];
    private Random _random = new();

    [Benchmark(Baseline = true)]
    public bool ListContains() => _codesList.Contains(_testArray[_random.Next(0, _testArray.Length)], StringComparer.InvariantCultureIgnoreCase);

    [Benchmark]
    public bool SwitchContains()
    {
        var testValue = _testArray[_random.Next(0, _testArray.Length)];
        return testValue.ToLowerInvariant() switch
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

For the purposes of these benchmarks I'm using the invariant culture comparisson/lower casing (`StringComparer.InvariantCultureIgnoreCase` and `.ToLowerInvariant()`). The reason for doing this is to ensure that it works on any system regardless of local culture settings. When you're comparing strings that aren't natural language these are probably the best choices.

So what is the outcome of testing these two approaches:

| Method         | Mean      | Error    | StdDev   | Ratio | RatioSD | Gen0   | Allocated | Alloc Ratio |
|--------------- |----------:|---------:|---------:|------:|--------:|-------:|----------:|------------:|
| ListContains   | 237.94 ns | 4.734 ns | 9.986 ns |  1.00 |    0.06 | 0.0031 |      40 B |        1.00 |
| SwitchContains |  27.42 ns | 0.169 ns | 0.158 ns |  0.12 |    0.00 | 0.0029 |      36 B |        0.90 |

The `List<string>.Contains(string, StringComparer.InvariantCultureIgnoreCase)` method takes ~238ns to complete, or put another way can be completed ~4.2 million times per second. However, the `switch` version including lower-casing the test string only takes ~28ns, or can be done 35.7 million times per second, or eight and a half times more than the `List<string>` version!

It's also worth noting that both versions of the code incur some memory allocation, the reason for this is that both are lower-casing strings to enable a real comparisson.

## But why does it matter?

So really, why does any of this matter? None of these search and compare methods are even taking milliseconds, at worst they're taking a few hundred nanoseconds. The answer is in the paragraph above, where I calculate how many times the operations can (on average) be carried out per second. Let's restate the above results:

| Method         | Mean      | Ratio | Executions per second |
|--------------- |----------:|------:|----------------------:|
| ListContains   | 237.94 ns |  1.00 |    4,201,680  |
| SwitchContains |  27.42 ns |  0.12 |    35,714,285  |

Another way of thinking about it is that the less time your code spends executing, the quicker your client (whoever or whatever that be) gets a response, and the less you pay for your resources.
