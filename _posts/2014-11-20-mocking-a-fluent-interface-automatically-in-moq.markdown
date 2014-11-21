---
layout: 	post
title:  	"Mocking a fluent interface 'automatically' in Moq"
date:   	2014-11-20 21:00:00
categories: .net moq
---
A brief post to show how to create an [extension method][dotnet-extension-method-definition] that quickly and simply mocks out the fluent methods of an interface.

First though we need to define *what* a fluent interface is: Put simply a fluent interface (or api) is one that allows you to chain method calls. [This 2012 article by Eric Vogel][vs-mag-fluent-api] has a nice simple demonstration.

So let's imagine that we are going to use the two interfaces defined in that article in our code. The interfaces look like this:

<pre>public interface IFluentEmailSender
{
    IFluentEmailSender FromServer(string host);
    IFluentEmailSender WithCredentials(string username, string password);
    IFluentEmailMessage CreateEmail();
    void Send();
}</pre>

<pre>public interface IFluentEmailMessage
{
    IFluentEmailMessage From(string fromAddress);
    IFluentEmailMessage To(string toAddress);
    IFluentEmailMessage Saying(string message);
    IFluentEmailMessage WithSubject(string subject);
    IFluentEmailSender Done();
}</pre>

We need to write some code to consume these interfaces, and because we're good developers, we're going to do this with TDD and write some tests. What you'll quickly find is that somewhere in your code you have code that looks similar to the following...

<pre>[SetUp]
public void SetUp()
{
    var messageMock = new Mock&lt;IFluentEmailMessage&gt;();
    var senderMock = new Mock&lt;IFluentEmailSender&gt;();

    messageMock.Setup(m => m.From(It.IsAny&lt;string&gt;())).Returns(messageMock.Object);
    messageMock.Setup(m => m.To(It.IsAny&lt;string&gt;())).Returns(messageMock.Object);
    messageMock.Setup(m => m.Saying(It.IsAny&lt;string&gt;())).Returns(messageMock.Object);
    messageMock.Setup(m => m.WithSubject(It.IsAny&lt;string&gt;())).Returns(messageMock.Object);
    messageMock.Setup(m => m.Done()).Returns(senderMock.Object);

    senderMock.Setup(s => s.FromServer(It.IsAny&lt;string&gt;())).Returns(senderMock.Object);
    senderMock.Setup(s => s.WithCredentials(It.IsAny&lt;string&gt;(), It.IsAny&lt;string&gt;())).Returns(senderMock.Object);
    senderMock.Setup(s => s.CreateEmail()).Returns(messageMock.Object);
}</pre>

And this really isn't very nice, right? Well, it doesn't have to be like that!

<noscript>
    <link rel="stylesheet" href="https://gist-assets.github.com/assets/embed-81292f31902b1c0ba82591f0046fa60c.css">
    <div id="gist16426875" class="gist">
        <div class="gist-file">
          <div class="gist-data gist-syntax">




    <div class="file-data">
      <table cellpadding="0" cellspacing="0" class="lines highlight">
        <tbody><tr>
          <td class="line-numbers">
            <span class="line-number" id="file-mockingutils-cs-L1" rel="file-mockingutils-cs-L1">1</span>
            <span class="line-number" id="file-mockingutils-cs-L2" rel="file-mockingutils-cs-L2">2</span>
            <span class="line-number" id="file-mockingutils-cs-L3" rel="file-mockingutils-cs-L3">3</span>
            <span class="line-number" id="file-mockingutils-cs-L4" rel="file-mockingutils-cs-L4">4</span>
            <span class="line-number" id="file-mockingutils-cs-L5" rel="file-mockingutils-cs-L5">5</span>
            <span class="line-number" id="file-mockingutils-cs-L6" rel="file-mockingutils-cs-L6">6</span>
            <span class="line-number" id="file-mockingutils-cs-L7" rel="file-mockingutils-cs-L7">7</span>
            <span class="line-number" id="file-mockingutils-cs-L8" rel="file-mockingutils-cs-L8">8</span>
            <span class="line-number" id="file-mockingutils-cs-L9" rel="file-mockingutils-cs-L9">9</span>
            <span class="line-number" id="file-mockingutils-cs-L10" rel="file-mockingutils-cs-L10">10</span>
            <span class="line-number" id="file-mockingutils-cs-L11" rel="file-mockingutils-cs-L11">11</span>
            <span class="line-number" id="file-mockingutils-cs-L12" rel="file-mockingutils-cs-L12">12</span>
            <span class="line-number" id="file-mockingutils-cs-L13" rel="file-mockingutils-cs-L13">13</span>
            <span class="line-number" id="file-mockingutils-cs-L14" rel="file-mockingutils-cs-L14">14</span>
            <span class="line-number" id="file-mockingutils-cs-L15" rel="file-mockingutils-cs-L15">15</span>
            <span class="line-number" id="file-mockingutils-cs-L16" rel="file-mockingutils-cs-L16">16</span>
            <span class="line-number" id="file-mockingutils-cs-L17" rel="file-mockingutils-cs-L17">17</span>
            <span class="line-number" id="file-mockingutils-cs-L18" rel="file-mockingutils-cs-L18">18</span>
            <span class="line-number" id="file-mockingutils-cs-L19" rel="file-mockingutils-cs-L19">19</span>
            <span class="line-number" id="file-mockingutils-cs-L20" rel="file-mockingutils-cs-L20">20</span>
            <span class="line-number" id="file-mockingutils-cs-L21" rel="file-mockingutils-cs-L21">21</span>
            <span class="line-number" id="file-mockingutils-cs-L22" rel="file-mockingutils-cs-L22">22</span>
            <span class="line-number" id="file-mockingutils-cs-L23" rel="file-mockingutils-cs-L23">23</span>
            <span class="line-number" id="file-mockingutils-cs-L24" rel="file-mockingutils-cs-L24">24</span>
            <span class="line-number" id="file-mockingutils-cs-L25" rel="file-mockingutils-cs-L25">25</span>
            <span class="line-number" id="file-mockingutils-cs-L26" rel="file-mockingutils-cs-L26">26</span>
            <span class="line-number" id="file-mockingutils-cs-L27" rel="file-mockingutils-cs-L27">27</span>
            <span class="line-number" id="file-mockingutils-cs-L28" rel="file-mockingutils-cs-L28">28</span>
            <span class="line-number" id="file-mockingutils-cs-L29" rel="file-mockingutils-cs-L29">29</span>
            <span class="line-number" id="file-mockingutils-cs-L30" rel="file-mockingutils-cs-L30">30</span>
            <span class="line-number" id="file-mockingutils-cs-L31" rel="file-mockingutils-cs-L31">31</span>
            <span class="line-number" id="file-mockingutils-cs-L32" rel="file-mockingutils-cs-L32">32</span>
            <span class="line-number" id="file-mockingutils-cs-L33" rel="file-mockingutils-cs-L33">33</span>
            <span class="line-number" id="file-mockingutils-cs-L34" rel="file-mockingutils-cs-L34">34</span>
            <span class="line-number" id="file-mockingutils-cs-L35" rel="file-mockingutils-cs-L35">35</span>
            <span class="line-number" id="file-mockingutils-cs-L36" rel="file-mockingutils-cs-L36">36</span>
          </td>
          <td class="line-data">
            <pre class="line-pre"><div class="line" id="file-mockingutils-cs-LC1"><span class="pl-k">using</span> System;
</div><div class="line" id="file-mockingutils-cs-LC2"><span class="pl-k">using</span> System.Linq;
</div><div class="line" id="file-mockingutils-cs-LC3"><span class="pl-k">using</span> System.Linq.Expressions;
</div><div class="line" id="file-mockingutils-cs-LC4">&nbsp;
</div><div class="line" id="file-mockingutils-cs-LC5"><span class="pl-k">namespace</span> <span class="pl-en">Moq</span>
</div><div class="line" id="file-mockingutils-cs-LC6">{
</div><div class="line" id="file-mockingutils-cs-LC7">    <span class="pl-s">public</span> <span class="pl-s">static</span> <span class="pl-s">class</span> <span class="pl-en">MockingUtilities</span>
</div><div class="line" id="file-mockingutils-cs-LC8">    {
</div><div class="line" id="file-mockingutils-cs-LC9">        <span class="pl-s">public</span> <span class="pl-s">static</span> Mock&lt;T&gt; AutoMockFluentInterface&lt;T&gt;(this Mock&lt;T&gt; interfaceMock) where T:class
</div><div class="line" id="file-mockingutils-cs-LC10">        {
</div><div class="line" id="file-mockingutils-cs-LC11">            <span class="pl-c">// Get the methodinfo for isany on it</span>
</div><div class="line" id="file-mockingutils-cs-LC12">            <span class="pl-k">var</span> isAnyMethodInfo = <span class="pl-k">typeof</span> (It).GetMethod(<span class="pl-s1"><span class="pl-pds">"</span>IsAny<span class="pl-pds">"</span></span>);
</div><div class="line" id="file-mockingutils-cs-LC13">            <span class="pl-k">var</span> instance = Expression.Parameter(<span class="pl-k">typeof</span> (T), <span class="pl-s1"><span class="pl-pds">"</span>fluentInterface<span class="pl-pds">"</span></span>);
</div><div class="line" id="file-mockingutils-cs-LC14">&nbsp;
</div><div class="line" id="file-mockingutils-cs-LC15">            <span class="pl-c">// Get the methods from the interface, and filter to those that return T</span>
</div><div class="line" id="file-mockingutils-cs-LC16">            <span class="pl-k">var</span> fluentMethods = <span class="pl-k">typeof</span> (T).GetMethods().Where(mi =&gt; mi.ReturnType == <span class="pl-k">typeof</span> (T));
</div><div class="line" id="file-mockingutils-cs-LC17">&nbsp;
</div><div class="line" id="file-mockingutils-cs-LC18">            <span class="pl-k">foreach</span> (<span class="pl-k">var</span> fluentMethod <span class="pl-k">in</span> fluentMethods)
</div><div class="line" id="file-mockingutils-cs-LC19">            {
</div><div class="line" id="file-mockingutils-cs-LC20">                <span class="pl-k">var</span> parameters = fluentMethod.GetParameters()
</div><div class="line" id="file-mockingutils-cs-LC21">                                             .Select(parameterInfo =&gt;
</div><div class="line" id="file-mockingutils-cs-LC22">                                                         Expression.Call(isAnyMethodInfo.MakeGenericMethod(parameterInfo
</div><div class="line" id="file-mockingutils-cs-LC23">                                                                                                               .ParameterType),
</div><div class="line" id="file-mockingutils-cs-LC24">                                                                         <span class="pl-s">new</span> Expression[<span class="pl-c1">0</span>]))
</div><div class="line" id="file-mockingutils-cs-LC25">                                             .Cast&lt;Expression&gt;()
</div><div class="line" id="file-mockingutils-cs-LC26">                                             .AsEnumerable();
</div><div class="line" id="file-mockingutils-cs-LC27">                interfaceMock.Setup(Expression.Lambda&lt;Func&lt;T, T&gt;&gt;(Expression.Call(instance,
</div><div class="line" id="file-mockingutils-cs-LC28">                                                                                  fluentMethod,
</div><div class="line" id="file-mockingutils-cs-LC29">                                                                                  parameters),
</div><div class="line" id="file-mockingutils-cs-LC30">                                                                  <span class="pl-s">new</span>[] {instance})).Returns(interfaceMock.Object);
</div><div class="line" id="file-mockingutils-cs-LC31">            }
</div><div class="line" id="file-mockingutils-cs-LC32">&nbsp;
</div><div class="line" id="file-mockingutils-cs-LC33">            <span class="pl-k">return</span> interfaceMock;
</div><div class="line" id="file-mockingutils-cs-LC34">        }
</div><div class="line" id="file-mockingutils-cs-LC35">    }
</div><div class="line" id="file-mockingutils-cs-LC36">}
</div></pre>
          </td>
        </tr>
      </tbody></table>
    </div>

          </div>
          <div class="gist-meta">
            <a href="https://gist.github.com/steve-codemunkies/38fb24eede7a3d0d52e8/raw/MockingUtils.cs" style="float:right">view raw</a>
            <a href="https://gist.github.com/steve-codemunkies/38fb24eede7a3d0d52e8#file-mockingutils-cs">MockingUtils.cs</a>
            hosted with ❤ by <a href="https://github.com">GitHub</a>
          </div>
        </div>
</div>
</noscript>
<script src="https://gist.github.com/steve-codemunkies/38fb24eede7a3d0d52e8.js"></script>

First I'll show you how it is used:

<pre>[SetUp]
public void SetUp()
{
    var messageMock = new Mock&lt;IFluentEmailMessage&gt;().AutoMockFluentInterface();
    var senderMock = new Mock&lt;IFluentEmailSender&gt;().AutoMockFluentInterface();

    messageMock.Setup(m => m.Done()).Returns(senderMock.Object);

    senderMock.Setup(s => s.CreateEmail()).Returns(messageMock.Object);
}</pre>

Much nicer! So, what's happening?

* Line 12 - We get a *MethodInfo* for the *IsAny* method on *It*. This will be used later on.
* Line 13 - Create an expression instance for the generic type *T*, this seems to be the left half of a lambda (*something => something...*).
* Line 16 - Get all the methods on *T* that return *T*.
* Lines 18-31 - Go through all the methods obtained at line 16.
* Line 20 - Get the parameters for the method.
* Line 21-24 - Go through the parameters and make the call to *IsAny* a closed generic on the type parameter using the *MethodInfo* from line 12 (e.g. *It.IsAny<string>()*).
* Line 27-30 - Programmatically create a Lambda for the method on the interface.

The biggest trick I found in doing this was using an older version of [IlSpy][ilspy-download-page] to decompile a known set of tests that had lambdas defining expectations.

One thing to note; if you are specifically interested in the values passed to the methods then you will need to do a .Verify() on the mock object.

[dotnet-extension-method-definition]:   http://msdn.microsoft.com/en-GB/library/bb383977.aspx
[vs-mag-fluent-api]:                    http://visualstudiomagazine.com/articles/2012/05/10/fluent-interface-design-in-net.aspx
[ilspy-download-page]:                  http://ilspy.net/
