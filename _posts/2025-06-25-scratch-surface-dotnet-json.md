---
layout: 	post
title:  	"Lightly scratching the surface of JSON deserialization in dotnet"
description:  "Deep dives are so passé"
date:   	2025-06-25 10:45:00
categories: dotnet json deserialization
comments: false
page-type: article
hero-image: /assets/2021-05-03-web-dev.jpg
tile-image: /assets/2021-05-03-web-dev-tile.jpg
---

For reasons that may surface at some point in the future I have spent some time looking at the way [deserialization works in dotnet with `System.Text.Json`](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/deserialization).

For the longest time JSON was not a first class citizen within the dotnet multiverse, the preferred document encoding format was XML. This all changed with the introduction of dotnet core, where JSON was elevated, and preferred for configuration, etc. However the use and manipulation of JSON was still done through a third party library - [Newtonsoft JSON.NET](https://www.newtonsoft.com/json).

This changed with .NET Framework 4.6/dotnet core 3.0 where [System.Text.Json](https://learn.microsoft.com/en-us/dotnet/api/system.text.json) was introduced (in part by Microsoft bringing the creator of Newtonsoft JSON.NET in house).

## Start simple, start fast

It's been a little while since I wrangled Json in code and the first thing I wanted to try was deserializing to a [`JsonDocument`](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/use-dom#use-jsondocument), and this is [the code I cooked](https://github.com/steve-codemunkies/dotnet-json/blob/2ec9499cdd54082e47d4ba387a1d7f849bfc9099/DotnetJsonTests/BasicJsonTests.cs#L7-L20):

```csharp
[Fact]
public void JsonSerializer_DeserializesJsonToObject()
{
    // Arrange
    var json = "{\"Name\":\"John\",\"Age\":30}";


    // Act
    var personDocument = JsonDocument.Parse(json);


    // Assert
    Assert.IsType<JsonDocument>(personDocument);
    Assert.Equal("John", personDocument.RootElement.GetProperty("Name").GetString());
    Assert.Equal(30, personDocument.RootElement.GetProperty("Age").GetInt32());
}
```

And as you can see the deserialization itself is simple, and the data in the document is available. But accessing the data itself is... sub-optimal. So now we need to [deserialize to POCOs](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/deserialization) (**P**lain **O**ld **C**Sharp **O**bjects).

[POCO Definition](https://github.com/steve-codemunkies/dotnet-json/blob/73cad750684361e1cb11100a580f89536de161a0/DotnetJsonTests/Person.cs):

```csharp
public class Person
{
    public required string Name { get; set; }
    public int Age { get; set; }
}
```

And the [code to actually deserialize](https://github.com/steve-codemunkies/dotnet-json/blob/73cad750684361e1cb11100a580f89536de161a0/DotnetJsonTests/BasicJsonTests.cs#L22-L35):

```csharp
[Fact]
public void JsonSerializer_DeserializesJsonToPoco()
{
    // Arrange
    var json = "{\"Name\":\"John\",\"Age\":30}";


    // Act
    var person = JsonSerializer.Deserialize<Person>(json);


    // Assert
    Assert.NotNull(person);
    Assert.Equal("John", person.Name);
    Assert.Equal(30, person.Age);
}
```

And again, it's simple and straightforward, and now accessing the data itself is nice. But, oh! 😱 Look at the definition of `Name` in the POCO, it says `required`. So [what happens when it isn't supplied](https://github.com/steve-codemunkies/dotnet-json/blob/73cad750684361e1cb11100a580f89536de161a0/DotnetJsonTests/BasicJsonTests.cs#L37-L46)?

```csharp
[Fact]
public void JsonSerializer_DeserializesJsonToPocoFailsWhenRequiredParameterIsMissing()
{
    // Arrange
    var json = "{\"Age\":30}";


    // Act
    // Assert
    Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<Person>(json));
}
```

A `JsonException` is thrown.

## Building the layer cake

We can now deserialize to a POCO, but it's a bit simple, isn't it? What about a [more complicated object](https://github.com/steve-codemunkies/dotnet-json/blob/847400496773e62d1ace51a4c6a875d0f358f2af/DotnetJsonTests/Meeting.cs)?

```csharp
public class Meeting
{
    public required string Building { get; set; }
    public required string Room { get; set; }
    public required IList<Person> People { get; set; }
}
```

Well event this [isn't hard](https://github.com/steve-codemunkies/dotnet-json/blob/847400496773e62d1ace51a4c6a875d0f358f2af/DotnetJsonTests/BasicJsonTests.cs#L48-L76) to deal with:

```csharp
[Fact]
public void JsonSerializer_DeserializesComplexJsonToPoco()
{
    // Arrange
    var json = """
    {
        "Building": "Empire State Building",
        "Room": "Conference Room",
        "People": [
            {"Name": "John", "Age": 30},
            {"Name": "Alice", "Age": 28},
            {"Name": "Bob", "Age": 32}
        ]
    }
    """;


    // Act
    var meeting = JsonSerializer.Deserialize<Meeting>(json);
    
    // Assert
    Assert.NotNull(meeting);
    Assert.Equal("Empire State Building", meeting.Building);
    Assert.Equal("Conference Room", meeting.Room);
    Assert.NotNull(meeting.People);
    Assert.Equal(3, meeting.People.Count);
    Assert.Contains(meeting.People, p => p.Name == "John" && p.Age == 30);
    Assert.Contains(meeting.People, p => p.Name == "Alice" && p.Age == 28);
    Assert.Contains(meeting.People, p => p.Name == "Bob" && p.Age == 32);
}
```

Because all of the properties of the `Meeting` POCO have been marked as `required` we'd have a similar issue as we did in the last test, in that if that field isn't present an exception will be thrown. The other way to deal with this is to mark the the property as a [nullable type](https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references).

## Go big or go home

This is all fascinating stuff isn't it? But what I wanted to actually know about was how to [deal with polymorphism in my POCOs](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/polymorphism). So borrowing from the code I first created some POCOs:

[`WeatherForecastBase`](https://github.com/steve-codemunkies/dotnet-json/blob/c43c27591bb0efc9ae951a688b20128f0c73727c/DotnetJsonTests/WeatherForecastBase.cs):

```csharp
[JsonDerivedType(typeof(WeatherForecastBase), typeDiscriminator: "base")]
[JsonDerivedType(typeof(WeatherForecastWithCity), typeDiscriminator: "withCity")]
[JsonDerivedType(typeof(WeatherForecastWithDailyPrecipitation), typeDiscriminator: "withPrecipitation")]
public class WeatherForecastBase
{
    public DateTimeOffset Date { get; set; }
    public int TemperatureCelsius { get; set; }
    public string? Summary { get; set; }
}
```

[`WeatherForecastWithCity`](https://github.com/steve-codemunkies/dotnet-json/blob/c43c27591bb0efc9ae951a688b20128f0c73727c/DotnetJsonTests/WeatherForecastWithCity.cs):

```csharp
public class WeatherForecastWithCity : WeatherForecastBase
{
    public string? City { get; set; }
}
```

And lastly [`WeatherForecastWithDailyPrecipitation`](https://github.com/steve-codemunkies/dotnet-json/blob/c43c27591bb0efc9ae951a688b20128f0c73727c/DotnetJsonTests/WeatherForecastWithDailyPrecipitation.cs):

```csharp
public class WeatherForecastWithDailyPrecipitation : WeatherForecastBase
{
    public string? City { get; set; }
    public double? DailyPrecipitation { get; set; }
    public double? DailyPrecipitationProbability { get; set; }
}
```

The [code](https://github.com/steve-codemunkies/dotnet-json/blob/c43c27591bb0efc9ae951a688b20128f0c73727c/DotnetJsonTests/ComplexJsonTests.cs) that shows how this all works:

```csharp
[Fact]
public void JsonSerializer_DeserializesDerivedTypesToPocosUsingDiscriminators()
{
    // Arrange
    var json = """
    [
        {
            "$type" : "withCity",
            "City": "Milwaukee",
            "Date": "2022-09-26T00:00:00-05:00",
            "TemperatureCelsius": 15,
            "Summary": "Cool"
        },
        {
            "$type" : "withPrecipitation",
            "City": "Milwaukee",
            "Date": "2022-09-26T00:00:00-05:00",
            "TemperatureCelsius": 15,
            "Summary": "Cool",
            "DailyPrecipitation": 15.0,
            "DailyPrecipitationProbability": 0.5
        }
    ]
    """;


    // Act
    var weatherForecast = JsonSerializer.Deserialize<List<WeatherForecastBase>>(json);


    // Assert
    Assert.NotNull(weatherForecast);
    Assert.Equal(2, weatherForecast.Count);


    Assert.IsType<WeatherForecastWithCity>(weatherForecast[0]);
    Assert.Equal("Cool", weatherForecast[0].Summary);
    Assert.Equal(new DateTimeOffset(2022, 9, 26, 0, 0, 0, TimeSpan.FromHours(-5)), weatherForecast[0].Date);
    Assert.Equal(15, weatherForecast[0].TemperatureCelsius);
    Assert.Equal("Milwaukee", ((WeatherForecastWithCity)weatherForecast[0]).City);


    Assert.IsType<WeatherForecastWithDailyPrecipitation>(weatherForecast[1]);
    Assert.Equal("Cool", weatherForecast[1].Summary);
    Assert.Equal(new DateTimeOffset(2022, 9, 26, 0, 0, 0, TimeSpan.FromHours(-5)), weatherForecast[1].Date);
    Assert.Equal(15, weatherForecast[1].TemperatureCelsius);
    Assert.Equal("Milwaukee", ((WeatherForecastWithDailyPrecipitation)weatherForecast[1]).City);
    Assert.Equal(15.0, ((WeatherForecastWithDailyPrecipitation)weatherForecast[1]).DailyPrecipitation);
    Assert.Equal(0.5, ((WeatherForecastWithDailyPrecipitation)weatherForecast[1]).DailyPrecipitationProbability);
}
```

And again, it's really simple to deserialize the data. The heavy lifting is being done by the [`JsonDerivedType`](https://github.com/steve-codemunkies/dotnet-json/blob/c43c27591bb0efc9ae951a688b20128f0c73727c/DotnetJsonTests/WeatherForecastBase.cs#L6-L8) attribute, or more accurately the code within System.Text.Json that processes it.

Within the data the required type is indicated by the `$type` field. As noted in [polymorphic type discrimators](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/polymorphism#polymorphic-type-discriminators) the discriminator should usually be the first field. It is possible to configure the deserializer to use discriminators elsewhere within the object, but this risks increasing the processing time and memory requirements.

But the situation I was investigating meant that I would have no knowledge at build time of the derived types. My [base POCO would look like this](https://github.com/steve-codemunkies/dotnet-json/blob/3662cb9f31448293ab0c5efde0d976fbc315e573/DotnetJsonTests/WeatherForecastBase.cs):

```csharp
public class WeatherForecastBase
{
    public DateTimeOffset Date { get; set; }
    public int TemperatureCelsius { get; set; }
    public string? Summary { get; set; }
}
```

No attribute decoration! Putting the decorators on the derived classes doesn't work either, you're now heading into complex [contracts](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/polymorphism#configure-polymorphism-with-the-contract-model). After stripping out the decorators I creted a [`PolymorphicTypeResolver`](https://github.com/steve-codemunkies/dotnet-json/blob/3662cb9f31448293ab0c5efde0d976fbc315e573/DotnetJsonTests/PolymorphicTypeResolver.cs) based on the documentation:

```csharp
public class PolymorphicTypeResolver : DefaultJsonTypeInfoResolver
{
    private static readonly Type _baseWeatherforecastType = typeof(WeatherForecastBase);


    public override JsonTypeInfo GetTypeInfo(Type type, JsonSerializerOptions options)
    {
        JsonTypeInfo jsonTypeInfo = base.GetTypeInfo(type, options);


        if (jsonTypeInfo.Type == _baseWeatherforecastType)
        {
            jsonTypeInfo.PolymorphismOptions = new JsonPolymorphismOptions
            {
                TypeDiscriminatorPropertyName = "$type",
                IgnoreUnrecognizedTypeDiscriminators = false,
                UnknownDerivedTypeHandling = JsonUnknownDerivedTypeHandling.FailSerialization,
                DerivedTypes =
                {
                    new JsonDerivedType(typeof(WeatherForecastWithCity), "withCity"),
                    new JsonDerivedType(typeof(WeatherForecastWithDailyPrecipitation), "withPrecipitation")
                }
            };
        }


        return jsonTypeInfo;
    }
}
```

And this is really quite straightforward, it simply tells the deserilizer that we have a json document that may have polymorphic types in it, that the discrimator field will be `$type` and that if the type is unknown to fail deserialization. The [code to deserialize](https://github.com/steve-codemunkies/dotnet-json/blob/3662cb9f31448293ab0c5efde0d976fbc315e573/DotnetJsonTests/ComplexJsonTests.cs#L7-L57) now has to use a `JsonSerializerOptions` object to tell it what to do, but otherwise is largely the same:

```csharp
[Fact]
public void JsonSerializer_DeserializesDerivedTypesToPocosUsingDiscriminators()
{
    // Arrange
    var json = """
    [
        {
            "$type" : "withCity",
            "City": "Milwaukee",
            "Date": "2022-09-26T00:00:00-05:00",
            "TemperatureCelsius": 15,
            "Summary": "Cool"
        },
        {
            "$type" : "withPrecipitation",
            "City": "Milwaukee",
            "Date": "2022-09-26T00:00:00-05:00",
            "TemperatureCelsius": 15,
            "Summary": "Cool",
            "DailyPrecipitation": 15.0,
            "DailyPrecipitationProbability": 0.5
        }
    ]
    """;
    var options = new JsonSerializerOptions
    {


        TypeInfoResolver = new PolymorphicTypeResolver()
    };


    // Act
    var weatherForecast = JsonSerializer.Deserialize<List<WeatherForecastBase>>(json, options);


    // Assert
    Assert.NotNull(weatherForecast);
    Assert.Equal(2, weatherForecast.Count);


    Assert.IsType<WeatherForecastWithCity>(weatherForecast[0]);
    Assert.Equal("Cool", weatherForecast[0].Summary);
    Assert.Equal(new DateTimeOffset(2022, 9, 26, 0, 0, 0, TimeSpan.FromHours(-5)), weatherForecast[0].Date);
    Assert.Equal(15, weatherForecast[0].TemperatureCelsius);
    Assert.Equal("Milwaukee", ((WeatherForecastWithCity)weatherForecast[0]).City);


    Assert.IsType<WeatherForecastWithDailyPrecipitation>(weatherForecast[1]);
    Assert.Equal("Cool", weatherForecast[1].Summary);
    Assert.Equal(new DateTimeOffset(2022, 9, 26, 0, 0, 0, TimeSpan.FromHours(-5)), weatherForecast[1].Date);
    Assert.Equal(15, weatherForecast[1].TemperatureCelsius);
    Assert.Equal("Milwaukee", ((WeatherForecastWithDailyPrecipitation)weatherForecast[1]).City);
    Assert.Equal(15.0, ((WeatherForecastWithDailyPrecipitation)weatherForecast[1]).DailyPrecipitation);
    Assert.Equal(0.5, ((WeatherForecastWithDailyPrecipitation)weatherForecast[1]).DailyPrecipitationProbability);
}
```

But of course, what about that [unknown derived type setting](https://github.com/steve-codemunkies/dotnet-json/blob/3662cb9f31448293ab0c5efde0d976fbc315e573/DotnetJsonTests/ComplexJsonTests.cs#L59-L92)?

```csharp
[Fact]
public void JsonSerializer_FailsToDeserializeObjectsWithUnknownDiscriminators()
{
    // Arrange
    var json = """
    [
        {
            "$type" : "withCity",
            "City": "Milwaukee",
            "Date": "2022-09-26T00:00:00-05:00",
            "TemperatureCelsius": 15,
            "Summary": "Cool"
        },
        {
            "$type" : "withRandomType",
            "City": "Milwaukee",
            "Date": "2022-09-26T00:00:00-05:00",
            "TemperatureCelsius": 15,
            "Summary": "Cool",
            "DailyPrecipitation": 15.0,
            "DailyPrecipitationProbability": 0.5
        }
    ]
    """;
    var options = new JsonSerializerOptions
    {


        TypeInfoResolver = new PolymorphicTypeResolver()
    };


    // Act
    // Assert
    Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<List<WeatherForecastBase>>(json, options));
}
```

A `JsonException` is thrown telling you what went wrong 😁.

## More! *More!* **More!!!**

What I was _really_ interested in though, was how to control the _creation_ of the object itself. Can you have the object created by the Dependency Injection container, and then set values on it? Following the [documentation](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/converters-how-to) I created a custom converter, and configured it in:

```csharp
public class WeatherForecastWithCityConverterInternal : JsonConverter<WeatherForecastWithCity>
{
    public override WeatherForecastWithCity Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var weatherForecast = new WeatherForecastWithCity();
        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndObject)
            {
                return weatherForecast;
            }


            if (reader.TokenType == JsonTokenType.PropertyName)
            {
                var propertyName = reader.GetString();
                reader.Read();


                switch (propertyName)
                {
                    case "City":
                        var city = reader.GetString();
                        weatherForecast.City = !string.IsNullOrEmpty(city) &&
                            city.Equals("MCR", StringComparison.OrdinalIgnoreCase) ?
                                "Manchester" :
                                city;
                        break;
                    case "Date":
                        weatherForecast.Date = reader.GetDateTimeOffset();
                        break;
                    case "TemperatureCelsius":
                        weatherForecast.TemperatureCelsius = reader.GetInt32();
                        break;
                    case "Summary":
                        weatherForecast.Summary = reader.GetString();
                        break;
                }
            }
        }


        throw new JsonException("Invalid JSON format for WeatherForecastWithCity.");
    }


    public override void Write(Utf8JsonWriter writer, WeatherForecastWithCity value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("City", value.City);
        writer.WriteString("Date", value.Date);
        writer.WriteNumber("TemperatureCelsius", value.TemperatureCelsius);
        writer.WriteString("Summary", value.Summary);
        writer.WriteEndObject();
    }
}
```

And then it [failed](https://github.com/dotnet/runtime/issues/83148). As noted in the GitHub issue this is by design, if you've opted into polymorphism using the `JsonDerivedType` attribute or by setting the `PolymorphismOptions` on the `JsonTypeInfo` then you explicity _cannot_ use a type converter. So I created a [converter factory](https://github.com/steve-codemunkies/dotnet-json/blob/b9d385a8831ae128100601db7f3bb72830766393/DotnetJsonTests/WeatherForecastWithCityConverter.cs):

```csharp
public class WeatherForecastWithCityConverter : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert)
    {
        return typeToConvert == typeof(WeatherForecastWithCity);
    }


    public override JsonConverter? CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        return new WeatherForecastWithCityConverterInternal();
    }


    internal class WeatherForecastWithCityConverterInternal : JsonConverter<WeatherForecastWithCity>
    {
        public override WeatherForecastWithCity Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var weatherForecast = new WeatherForecastWithCity();
            while (reader.Read())
            {
                if (reader.TokenType == JsonTokenType.EndObject)
                {
                    return weatherForecast;
                }


                if (reader.TokenType == JsonTokenType.PropertyName)
                {
                    var propertyName = reader.GetString();
                    reader.Read();


                    switch (propertyName)
                    {
                        case "City":
                            var city = reader.GetString();
                            weatherForecast.City = !string.IsNullOrEmpty(city) &&
                                city.Equals("MCR", StringComparison.OrdinalIgnoreCase) ?
                                    "Manchester" :
                                    city;
                            break;
                        case "Date":
                            weatherForecast.Date = reader.GetDateTimeOffset();
                            break;
                        case "TemperatureCelsius":
                            weatherForecast.TemperatureCelsius = reader.GetInt32();
                            break;
                        case "Summary":
                            weatherForecast.Summary = reader.GetString();
                            break;
                    }
                }
            }


            throw new JsonException("Invalid JSON format for WeatherForecastWithCity.");
        }


        public override void Write(Utf8JsonWriter writer, WeatherForecastWithCity value, JsonSerializerOptions options)
        {
            writer.WriteStartObject();
            writer.WriteString("City", value.City);
            writer.WriteString("Date", value.Date);
            writer.WriteNumber("TemperatureCelsius", value.TemperatureCelsius);
            writer.WriteString("Summary", value.Summary);
            writer.WriteEndObject();
        }
    }
}
```

And then [configured this into the code](https://github.com/steve-codemunkies/dotnet-json/blob/b9d385a8831ae128100601db7f3bb72830766393/DotnetJsonTests/CustomConverterTests.cs):

```csharp
[Fact]
public void JsonSerializer_CanDeserializeComplexObjectNeedingAConverter()
{
    // Arrange
    var json = """
    [
        {
            "City": "Milwaukee",
            "Date": "2022-09-26T00:00:00-05:00",
            "TemperatureCelsius": 15,
            "Summary": "Cool"
        },
        {
            "City": "MCR",
            "Date": "2022-09-26T00:00:00-05:00",
            "TemperatureCelsius": 15,
            "Summary": "Cool"
        }
    ]
    """;


    var options = new JsonSerializerOptions
    {
        WriteIndented = true
    };
    options.Converters.Add(new WeatherForecastWithCityConverter());
    
    // Act
    var weatherForecast = JsonSerializer.Deserialize<List<WeatherForecastWithCity>>(json, options);


    // Assert
    Assert.NotNull(weatherForecast);
    Assert.Equal(2, weatherForecast.Count);


    Assert.IsType<WeatherForecastWithCity>(weatherForecast[0]);
    Assert.Equal("Cool", weatherForecast[0].Summary);
    Assert.Equal(new DateTimeOffset(2022, 9, 26, 0, 0, 0, TimeSpan.FromHours(-5)), weatherForecast[0].Date);
    Assert.Equal(15, weatherForecast[0].TemperatureCelsius);
    Assert.Equal("Milwaukee", ((WeatherForecastWithCity)weatherForecast[0]).City);


    Assert.IsType<WeatherForecastWithCity>(weatherForecast[1]);
    Assert.Equal("Cool", weatherForecast[1].Summary);
    Assert.Equal(new DateTimeOffset(2022, 9, 26, 0, 0, 0, TimeSpan.FromHours(-5)), weatherForecast[1].Date);
    Assert.Equal(15, weatherForecast[1].TemperatureCelsius);
    Assert.Equal("Manchester", ((WeatherForecastWithCity)weatherForecast[1]).City);
}
```

And while this solution works, it is not... great. Without argument we now have a more complex codebase, that somehow contrives to _do less_ than when we let the framework do the heavy lifting for us. We have [mixed data and behaviour](https://stackoverflow.com/a/21861473) and the outcome is highly unsatisfactory.

So in the situation where you get in some data and want to treat it as an object what should you do? Accept that you have a [Parameter Object](https://refactoring.guru/introduce-parameter-object) and treat it as such. This may mean refactoring your processing, perhaps you need to introduce an initialisation method, but equally, you could just pass it as a parameter at execution time.
