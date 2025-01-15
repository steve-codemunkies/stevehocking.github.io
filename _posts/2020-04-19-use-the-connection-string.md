---
layout: 	post
title:  	"Use the connection string"
description:  "I am a developer. I am one with the connection string, and the connection string will guide me."
date:           2020-04-19 15:30:00
categories: connectionstring sqlserver eventstore mongodb
comments: false
page-type: article
hero-image: /assets/2020-04-19-luke.jpg
tile-image: /assets/2020-04-19-luke-tile.jpg
---

How often have you commited something like the following to your source control?

```json
{
    "DatabaseConnection" : {
        "Server": "db-server1",
        "Database": "aDatabase",
        "User": "someUser",
        "Pass": "P455w0rd"
    }
}
```

```csharp
public class DatabaseConnectionConfiguration
{
    public string Server { get; set; }
    public string Database { get; set; }
    public string User { get; set; }
    public string Pass { get; set; }

    public string ConnectionString => $"{User}:{Pass}@{Server}/{Database}";
}

var databaseConnection = Configuration.Bind<DatabaseConnectionConfiguration>("DatabaseConenction");
var connection = new SqlClient(databaseConnection.ConnectionString);
```

I'm sure we've all done it at some point in the past, I know I have, although the last time really was many many years ago. But it is an anti-pattern that I keep coming across in code.

## But why?

The first question has to be "why do we do this?" And this goes back into our training as developers. We are taught fairly early to keep code [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself), to not repeat ourselves. But what is it that we're not repeating here? It's configuration that we're (trying) to keep DRY in this situation. It might be that the databases for our various environments all live on the same server, and just have different names. Or it may be that the database and user stays the same, but the server and password change.

And then moving on a bit we're trying to be helpful to the people who are going to get our code hosted, don't they complain about anonymously named environment variables all the time? Ok `User` and `Pass` are a bit sparse, but they can be decyphered pretty easily.

## What problem?

So I made the bold statement above that this is an [anti-pattern](https://en.wikipedia.org/wiki/Anti-pattern). Why might this be the case? Let's look at three systems that I have been involved with in the past, that you may struggle to connect to using this scenario.

### SQL Server

Microsoft actually provide us a [`SqlConnectionStringBuilder` class](https://docs.microsoft.com/en-us/dotnet/api/system.data.sqlclient.sqlconnectionstringbuilder?view=netframework-4.8), so what's the issue with building up a connection string? Start by looking at the example, it actually uses an existing connection string, but then substitutes in a new password. The next point is that there are an awful lot of [connection properties](https://docs.microsoft.com/en-us/dotnet/api/system.data.sqlclient.sqlconnectionstringbuilder?view=netframework-4.8#properties) [available](https://www.connectionstrings.com/all-sql-server-connection-string-keywords/), and you're unlikely to get all of them in your configuration, especially if you're connecting to a cluster in production, or your app is supposed to be read-only, etc.

### Event Store

[Event Store](https://eventstore.com/) is another system that [seemingly invites](https://eventstore.com/docs/dotnet-api/connecting-to-a-server/index.html) you to create a [ConnectionSettings](https://eventstore.com/docs/dotnet-api/code/EventStore.ClientAPI.ConnectionSettings.html) and use that to connect. But look at all those fields and properties! Again, you're going to struggle to hit the right combination of properties for all of your environments. I know this because it's not that long since I worked on a system that had this problem. Once it became obvious that the production connections would be completely different to all the other environments my parts of the systems changed to make use of the connection string sharpish, other parts of the system weren't quite so quick and teams lost days tracking down problems.

### Mongo DB

The most recent time I have come across this issue is when connecting to a mongo database, or more specifically [a Mongo API on a Cosmos Db](https://docs.microsoft.com/en-us/azure/cosmos-db/mongodb-introduction). Interestingly [Mongo doesn't invite you to build a connection](https://docs.mongodb.com/drivers/csharp). But the developers on the team were following a long established pattern within their part of the company of building up connection strings from components. This worked locally and in the development Azure environment, unfortunately in higher Azure environments where the configuration was tighter and more like production it failed. Upon querying with the Operations team the answer came back that only the supplied connection string would be supported and if necessary investigated. On changing to use the supplied connection string the problem went away.

## The solution?

Hopefully by now you'll agree that the solution is to simply use a pre-configured connection string. It can be supplied to your application by the right people, and set all of the necessary options.