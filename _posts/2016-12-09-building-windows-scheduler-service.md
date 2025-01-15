---
layout: 	post
title:  	"Building a Windows Service to run scheduled tasks the more sensible way - Part 1"
description:  "Topshelf, Quartz.Net, Autofac and Serilog; Oh My! What a time to be alive!"
date:   	2016-12-09 15:00:00
categories: topshelf quartz.net autofac serilog
comments: false
page-type: article
hero-image: /assets/2016-11-13-clocks.jpg
tile-image: /assets/2016-11-13-clocks-tile.jpg
invert-header: true
---

TL;DR: Build a scheduling service using Topshelf, Quartz.net, Autofac and Serilog, [code for part one available](https://github.com/steve-codemunkies/WindowsSchedulerService/tree/b581129db94d0083c01f4817e3869e82a7ec22a7).

**Update:** Part two is on the way!

**Update 2:** [Part two is now available]({% post_url 2018-03-27-building-windows-scheduler-service-pt2 %})

Windows comes with a perfectly good [built-in scheduler](https://technet.microsoft.com/en-us/library/cc748993(v=ws.11).aspx). But sometimes you might want something more within your own control. In my case I needed to run three jobs one after the other (a data update, an extract and finally a report on the extract). And these are the technologies I settled on to implement this wonder of the scheduling world:

* [Topshelf](http://topshelf-project.com/) - a rather fantastic little piece of software that removes the pain from creating a [Windows Service](https://msdn.microsoft.com/en-us/library/zt39148a(v=vs.110).aspx)
* [Quartz.Net](http://www.quartz-scheduler.net/) - a port of the popular Java [Quartz](http://www.quartz-scheduler.org/), an enterprise grade scheduling component
* [Autofac](https://autofac.org/) -  a popular .NET IoC container, and the one we have standardised on at work due to it's breadth of support and depth of examples
* [Serilog](https://serilog.net/) - a flexible logger, built for structured data, that makes outputting to a console really pretty

The first step step is to get Autofac setup. This might seem to be counter intuitive, but makes life easier later on. (Plus when you're doing this for reals you're doing TDD right?) So in the `Package Manager Console` run the command `Install-Package Autofac` (my personal preference is to use `-DependencyVersion Highest` to get the highest versions of any dependencies). Setting up Autofac is very straightforward, the best way is to use one or more modules:

<pre>var builder = new ContainerBuilder();
builder.RegisterModule&lt;ConventionModule&gt;();
return builder.Build();</pre>

That code lives in the main [_Program_ class](https://github.com/steve-codemunkies/WindowsSchedulerService/blob/master/Service/Program.cs#L13-L18) But what is the [_ConventionModule_](https://github.com/steve-codemunkies/WindowsSchedulerService/blob/master/Service/IoC/ConventionModule.cs)?

<pre>public class ConventionModule : Module
{
    protected override void Load(ContainerBuilder builder)
    {
        builder.RegisterAssemblyTypes(GetType().Assembly)
            .AsImplementedInterfaces()
            .AsSelf()
            .InstancePerLifetimeScope();
    }
}</pre>

This goes through all the types in the specified Assembly (or Assemblies), and registers all of the available types. If the type implements an interface it is registered as the interface, but types are also registered as themselves (this is important later on).

Next we'll get Serilog in. This is easily installed with the command `Install-Package Serilog`. Recently Serilog has been reorganised so you'll need to bring some sinks with you:

* `Serilog.Sinks.Trace` - writes to .NET's trace infrastructure, so unless you configure it otherwise messages will show up in [DbgView](https://technet.microsoft.com/en-us/sysinternals/debugview.aspx) and/or VS Output Window when debugging
* `Serilog.Sinks.Literate` - writes to the console _in colour_!

![Gif of a lovely console](/assets/2016-12-09-console.gif)

There are plenty of other sinks available for Serilog (we make extensive use of `Serilog.Sinks.RollingFile` which works really well for us). Once again, the most straightforward way to get is to create an Autofac Module:

<pre>public class LoggingModule : Module
{
    protected override void Load(ContainerBuilder builder)
    {
        var config = new LoggerConfiguration().MinimumLevel.Verbose()
            .WriteTo.Trace()
            .WriteTo.LiterateConsole();

        var logger = config.CreateLogger();
        Log.Logger = logger;

        builder.RegisterInstance(logger).As&lt;ILogger&gt;();
    }
}</pre>

Serilog is setup using a fluent builder, we set the minimum level of logging we are interested in, and then tell it we want to write to Trace and the Console, finally building the logger. The `Log.Logger = logger;` line adds the created logger to a static property which makes it available anywhere. This is used in integrating Serilog with Topshelf and Quartz. We won't actually use this, preferring instead the injected (and testable) `ILogger`. Finally we register the built logger with Autofac as a singleton.

Next we get Topshelf installed: `Install-Package Topshelf`. The [Topshelf quickstart](https://topshelf.readthedocs.io/en/latest/configuration/quickstart.html) really is excellent, as are the rest of the docs, and are worth a few minutes of your time to read. In order to integrate Topshelf with Serilog and Autofac we need another couple of packages:

* `Topshelf.Autofac`
* `Topshelf.Serilog`

Bringing everything together is really very straightforward:

<pre>static void Main(string[] args)
{
    var container = BuildContainer();

    HostFactory.Run(configurator =>
    {
        configurator.UseSerilog();
        configurator.UseAutofacContainer(container);

        configurator.Service&lt;ITestService&gt;(serviceConfigurator =>
        {
            serviceConfigurator.ConstructUsingAutofacContainer();
            serviceConfigurator.WhenStarted(service => service.Start());
            serviceConfigurator.WhenStopped(service => service.Stop());
        });

        configurator.RunAsLocalSystem();
        configurator.StartAutomaticallyDelayed();

        configurator.SetDescription("Sample Topshelf/Quartz scheduler");
        configurator.SetDisplayName("Topshelf Quartz Scheduler");
        configurator.SetServiceName("TQScheduler");
    });
}</pre>

You are using Topshelf to _host_ a service, hence `HostFactory.Run`. There are other ways of doing this, but this is still my preferred method.

The first two lines within the configurator (`configurator.UseSerilog();` and `configurator.UseAutofacContainer(container);`) tell Topshelf how to do different things; in this case where to log to, and how to build instances of the service.

The next section (`configurator.Service...`) tells Topshelf what service to run. Importantly inside the configurator we also tell Topshelf how to build our service (`serviceConfigurator.ConstructUsingAutofacContainer();`), and how to start and stop it. If you're happy taking further dependecies on Topshelf you can [implement `ServiceControl`](http://docs.topshelf-project.com/en/latest/configuration/config_api.html?highlight=whenstarted#simple-service). But we've taken the route of building a [custom service](http://docs.topshelf-project.com/en/latest/configuration/config_api.html?highlight=whenstarted#custom-service).

Finally we specify the service should run as the `Local System` account, should start automatically after a delay; and provide a name, display name and service description. If you use [Octopus Deploy](https://octopus.com/) then you should be aware that the `Service Name` specified in the deployment step must match that specified within the service, [or you will not be able to start it](http://docs.octopusdeploy.com/display/OD/Windows+Services).

The last step is implement the `TestService` itself:

<pre>public class TestService : ITestService
{
    private readonly ILogger _logger;
    private readonly Timer _timer;

    public TestService(ILogger logger)
    {
        _logger = logger;
        _timer = new Timer(1000) {AutoReset = true};
        _timer.Elapsed += (sender, args) => _logger.Information($"Timer fired {DateTime.UtcNow:G}");
    }

    public void Start()
    {
        _timer.Start();
    }

    public void Stop()
    {
        _timer.Stop();
    }
}</pre>

This instantiates a timer with a one second (_1000ms_) interval, starts it on service start and stops it on service stop.
