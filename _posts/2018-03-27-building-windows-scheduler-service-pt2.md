---
layout: 	post
title:  	"Building a Windows Service to run scheduled tasks the more sensible way - The long awaited Part 2!"
description:  "Adding in Quartz.Net and doing some actual scheduling! What a time to be alive!"
date:   	2018-03-27 08:45:00+01:00
categories: topshelf quartz.net autofac serilog
comments: false
page-type: article
hero-image: /assets/2016-11-13-clocks.jpg
tile-image: /assets/2016-11-13-clocks-tile.jpg
invert-header: true
---

TL;DR: Adding a Quartz.net scheduler to a service built with Topshelf, Autofac and Serilog is pretty straightforward. Using a configuration file for the scheduling opens up lots of possibilies. [Code for the whole solution is available](https://github.com/steve-codemunkies/WindowsSchedulerService).


In [part one]({% post_url 2016-12-09-building-windows-scheduler-service %}) of this mini-series we setup a Windows Service using [Topshelf](http://topshelf-project.com/), and it had a funky little class that setup a timer to repeatedly fire an event. This though was not the promised scheduler.

After a brief interlude I'm back to fill in the gaps.

(Ignoring some [version updating](https://github.com/steve-codemunkies/WindowsSchedulerService/commit/87981e24891603a6563ad7a18f3598a2975fa101)) The first thing I did was to install [Quartz.Net](http://www.quartz-scheduler.net/) and some helper packages. This is done through the _Package Manager Console_ with the following commands: `Install-Package Quartz.Plugins -DependencyVersion Highest` and `Install-Package Autofac.Extras.Quartz`. Installing `Autofac.Extras.Quartz` is done to bring some key helper classes that plumb Autofac and Quartz together. But why bring `Quartz.Plugins`, why not just bring `Quartz`? The reason for this is that it allows us to configure our jobs in a _configuration file_. And put simply this (to me at least) is much more interesting and flexible than hard coding the jobs in code, or heavens help us, inventing our own method of loading schedules.

It's still necessary to do a little bit more plumbing to get `Topshelf` and `Quartz.net` talking to each other, and this is where a new implementation of `ITestService` comes in:

```
public class QuartzTestService : ITestService
{
    private readonly IScheduler _jobScheduler;
    private readonly ILogger _logger;

    public QuartzTestService(IScheduler jobScheduler, ILogger logger)
    {
        _jobScheduler = jobScheduler;
        _logger = logger;
    }

    public void Start()
    {
        _jobScheduler.Start();
        _logger.Information("Job scheduler started");
    }

    public void Stop()
    {
        _jobScheduler.Shutdown(true);
        _logger.Information("Job scheduler stopped");
    }
}
```

Taking in an instance of `ILogger` and logging when the service is starting and stopping is not mandatory, but it has helped me solve little oddities in the past (usually by helping to point out that the service is failing long before it get's to the point where it has _"started"_). And that is all that is required to plumb `Topshelf` and `Quartz.net` together. We pass `true` to the [`IScheduler.Shutdown`](https://quartznet.sourceforge.io/apidoc/3.0/html/?topic=html/c0a37f4d-84df-9158-a4b0-b74f8db06c04.htm) method to say that we are happy waiting for the any existing jobs to complete before exiting. This can occasionally cause the service to hang when you run it in the console. But on the whole seems to work well. But do checkout the [documentation](https://quartznet.sourceforge.io/apidoc/3.0/html/#) for other ways to shutdown `Quartz.net`.

Because we're using `Autofac`, and we've provided a new implementation of `ITestService` actually using all of this is really easy. The `ConventionModule` will take care of `QuartzTestService`, but we need to do something to get `Quartz.net` itself up and running. This is done by adding two `LoadModule` calls to the method where we configure `Autofac`:

```
builder.RegisterModule(new QuartzAutofacFactoryModule {ConfigurationProvider = QuartzConfigurationProvider});
builder.RegisterModule(new QuartzAutofacJobsModule(typeof(Program).Assembly));
```

The second line is actually the easiest to deal with. The [`QuartzAutofacJobsModule`](https://github.com/alphacloud/Autofac.Extras.Quartz/blob/master/src/Autofac.Extras.Quartz/QuartzAutofacJobsModule.cs) registers all classes that implement `IJob` with `Autofac` in a way that allows them to be used with `Quartz.net`.

The first line uses [`QuartzAutofacFactoryModule`](https://github.com/alphacloud/Autofac.Extras.Quartz/blob/master/src/Autofac.Extras.Quartz/QuartzAutofacFactoryModule.cs) to setup everything that `Quartz.net` actually needs with `Autofac`. You'll see that at the same time we can also configure (`ConfigurationProvider = QuartzConfigurationProvider`). `QuartzConfigurationProvider` is a method that takes an `IComponentContext` and returns a `NameValueCollection`. This is the one included in the sample:

```
private static NameValueCollection QuartzConfigurationProvider(IComponentContext arg)
{
    return new NameValueCollection
    {
        ["quartz.scheduler.instanceName"] = "XmlConfiguredInstance",
        ["quartz.threadPool.type"] = "Quartz.Simpl.SimpleThreadPool, Quartz",
        ["quartz.threadPool.threadCount"] = "5",
        ["quartz.plugin.xml.type"] = "Quartz.Plugin.Xml.XMLSchedulingDataProcessorPlugin, Quartz.Plugins",
        ["quartz.plugin.xml.fileNames"] = "quartz-jobs.config",
        ["quartz.plugin.xml.FailOnFileNotFound"] = "true",
        ["quartz.plugin.xml.failOnSchedulingError"] = "true"
    };
}
```

We're doing a few things here. We're telling `Quartz.net` to use a plugin to parse scheduling data from a file (`quartz.plugin.xml.type`), we also telling it the file (`quartz.plugin.xml.fileNames`) and what to do in certain scenarios (`quartz.plugin.xml.FailOnFileNotFound` and `quartz.plugin.xml.failOnSchedulingError`). The scheduling file itself is reasonably straightforward:

```
<?xml version="1.0" encoding="utf-8" ?>
<job-scheduling-data xmlns="http://quartznet.sourceforge.net/JobSchedulingData"
                     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     version="2.0">

  <processing-directives>
    <overwrite-existing-data>true</overwrite-existing-data>
  </processing-directives>

  <schedule>

    <job>
      <name>Sample job</name>
      <group>Sample job group</group>
      <description>This is the description of the sample job</description>
      <job-type>Service.SampleJob, Service</job-type>
      <durable>true</durable>
      <recover>false</recover>
      <job-data-map>
        <entry>
          <key>key0</key>
          <value>value0</value>
        </entry>
        <entry>
          <key>key1</key>
          <value>value1</value>
        </entry>
        <entry>
          <key>key2</key>
          <value>value2</value>
        </entry>
      </job-data-map>
    </job>

    <trigger>
      <cron>
        <name>Sample Job Trigger</name>
        <group>Sample Job Group Trigger</group>
        <description>This is the sample job trigger description</description>
        <job-name>Sample job</job-name>
        <job-group>Sample job group</job-group>
        <misfire-instruction>SmartPolicy</misfire-instruction>
        <!-- Trigger every five seconds starting at 1 second past -->
        <cron-expression>1/5 * * * * ?</cron-expression>
      </cron>
    </trigger>

  </schedule>

</job-scheduling-data>
```

`Quartz.net` splits all scheduled jobs into two parts, the `<job/>` which is the what, and the `<trigger/>` which is the when. Because of the way that `Quartz.net` is setup you can easily extend the triggers, and indeed my team has done this with a _follow-on_ trigger, that allows us to schedule just one job, but as part of each job specify the next job that should be run. For us this means that we have been able easily break down a complex export task to six simpler tasks, and schedule them one after the other without guessing how long each one will take.

It's worth calling out the `/job-scheduling-data/schedule/job/job-type` element. This is the [Fully Qualified Type Name](https://platinumdogs.me/2010/01/05/net-5-part-or-fully-qualified-type-and-assembly-names/) for the type that implements `IJob`. I haven't specified the `Version`, `Culture` or `PublicKeyToken` as they are not necessary. So now we need to implement the `Service.SampleJob`:

```
public class SampleJob : IJob
{
    private readonly ILogger _logger;
    private readonly Guid _tellTale = Guid.NewGuid();

    public SampleJob(ILogger logger)
    {
        _logger = logger;
    }

    public Task Execute(IJobExecutionContext context)
    {
        return Task.Run(() =>
        {
            _logger.Information("Executing sample job");
            _logger.Information($"Name: {context.JobDetail.Key.Name}");
            _logger.Information($"Description: '{context.JobDetail.Description}'");
            _logger.Information($"Fire time utc: {context.FireTimeUtc:yyyy-MM-dd HH:mm:ss zzz}");
            foreach (var data in context.JobDetail.JobDataMap)
            {
                _logger.Information($"\tKey: {data.Key}; Value: {data.Value}");
            }
            _logger.Information($"Tell tale: {_tellTale}");
        });
    }
}
```

The `_tellTale` is simply there to show that the job class is instantiated every time the trigger fires. This is important because if you have state that needs to be stored between job calls you need to find somewhere to store it. As you can see the `Execute` method returns a `Task`, but you need to [be careful about mixing styles](http://blog.stephencleary.com/2012/02/async-and-await.html). The rest of the method simply demonstrates how to get data from the context.
