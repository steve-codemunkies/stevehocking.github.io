---
layout: 	post
title:  	"Deploying a docker image to Azure"
description:  "You've made something useful, now make use of it!"
date:   	2018-12-19 12:00:00
categories: docker azure
comments: true
page-type: article
hero-image: /assets/2018-12-12-container-ship.jpg
---

*UPDATE*: In trying to get the container running in AKS, I repeatedly ran up against issues with AKS pulling the image from the the Container Registry. I _eventually_ resolved this by changing the region from `northeurope` to `westeurope`. This has been reflected in the `az group create ...` command below.

Back in October [I demonstrated how to dockerize an ASP.NET core application]({% post_url 2018-10-23-dockerize-asp-net-core-blog %}). Now to show how to get that image up to the cloud.

One of the many things good things coming out of Azure is the move away from UI to the command line to setup _everything_. The Azure CLI tools are special because not only are they available to install locally ([PC, macOS and many flavours of linux](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)), but they are also available via the [Azure Portal](https://portal.azure.com/) (click the icon circled red on your portal toolbar).

![Azure toolbar with CLI icon circled red](/assets/2018-12-18-azure-portal-command-bar.png)

The reason that this is important is that it means that setup and deployment can be scripted and repeatable. If you're clicking around a UI that is not repeatable, and you are prone to having your [cheese moved](https://www.hanselman.com/blog/Windows8ProductivityWhoMovedMyCheeseOhThereItIs.aspx).

If you aren't running the CLI tools through the portal the first step is to login with `az login`, you will then be prompted for your account details.

Next ensure that you are working on the correct subscription: `az account show --output table`. This will generate some output similar to the following:

```
EnvironmentName    IsDefault    Name           State    TenantId
-----------------  -----------  -------------  -------  ------------------------------------
AzureCloud         True         Pay-As-You-Go  Enabled  <subscription id>
```

It is entirely possible that you are on the wrong subscription. Maybe you have an old subscription, or you manage multiple subscriptions through the same account. If the default subscription is incorrect you can change to the correct subscription using the `account set` command: `az account set --subscription "<subscription id/name>"`. This will set all subsequent commands to run against this subscription.

Next we're going to create a resource group. According to the [Azure Cloud Glossary](https://docs.microsoft.com/en-us/azure/azure-glossary-cloud-terminology) a Resource Group [is](https://docs.microsoft.com/en-us/azure/azure-glossary-cloud-terminology#resource-group):

> A container in Resource Manager that holds related resources for an application.

Importantly the Reource Group allows us to direct which data centre our resources should be created in, and then manage those resources _en-masse_. To create the new Resource Group we use the following command: `az group create --name "BlogGroup" --location westeurope`. This generates the following output:

```
{
  "id": "/subscriptions/<subscription id>/resourceGroups/BlogGroup",
  "location": "westeurope",
  "managedBy": null,
  "name": "BlogGroup",
  "properties": {
    "provisioningState": "Succeeded"
  },
  "tags": null
}
```

The only part worth breaking out here is the `--location` parameter. To get a list of the locations available to you use `az account list-location`, which generates output similar to the following:

```
[
  ...,
  {
    "displayName": "North Europe",
    "id": "/subscriptions/<subscription id>/locations/northeurope",
    "latitude": "53.3478",
    "longitude": "-6.2597",
    "name": "northeurope",
    "subscriptionId": null
  },
  ...
]
```

The next step is to create a Container Registry, this is where we will put our Images prior to deployment. The command to do this is: `az acr create --name "BlogRegistry" --resource-group "BlogGroup" --sku Basic`, and this generates the following output:

```
{
  "adminUserEnabled": false,
  "creationDate": "2018-12-19T11:50:20.407592+00:00",
  "id": "/subscriptions/<subscription id>/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry",
  "location": "northeurope",
  "loginServer": "blogregistry.azurecr.io",
  "name": "BlogRegistry",
  "provisioningState": "Succeeded",
  "resourceGroup": "BlogGroup",
  "sku": {
    "name": "Basic",
    "tier": "Basic"
  },
  "status": null,
  "storageAccount": null,
  "tags": {},
  "type": "Microsoft.ContainerRegistry/registries"
}
```

The [Container Registry SKUs](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-skus) essentially determine how much you pay for the privilege. The _Basic_ registry is the most appropriate for this tutorial.

The next step is to log `docker` into the Azure Container Registry, this is done with the command `az acr login --name BlogRegistry`.

**N.B.** If you try and run this command in the portal CLI you will receive this error:

> This command requires running the docker daemon, which is not supported in Azure Cloud Shell.

This command, and the next two commands to upload your docker image need to be run on your machine.

To get our image in to the registry we need to do two more commands, tag and push. But the tag in particular needs several pieces of information. The first piece of information is `loginServer` that is retured from `az acr create`. The other piece of information is the image name, you can find this through `docker image ls`, on my machine this is the list that is generated:

```
REPOSITORY          TAG                  IMAGE ID            CREATED             SIZE
<none>              <none>               5353701500cc        6 days ago          1.84GB
blog.app            1                    c57a36e90398        6 days ago          264MB
<none>              <none>               8fe537899022        6 days ago          1.84GB
microsoft/dotnet    sdk                  ea6f66a1e7b7        7 days ago          1.73GB
microsoft/dotnet    aspnetcore-runtime   41db56126a6d        7 days ago          260MB
```

And it is the `blog.app` image that I'm interested in. The command to correctly tag the image is `docker tag blog.app:1 blogregistry.azurecr.io/blog.app:1`. After executing this command when we execute `docker image ls` we now get this output:

```
REPOSITORY                         TAG                  IMAGE ID            CREATED             SIZE
<none>                             <none>               5353701500cc        6 days ago          1.84GB
blogregistry.azurecr.io/blog.app   1                    c57a36e90398        6 days ago          264MB
blog.app                           1                    c57a36e90398        6 days ago          264MB
<none>                             <none>               8fe537899022        6 days ago          1.84GB
microsoft/dotnet                   sdk                  ea6f66a1e7b7        7 days ago          1.73GB
microsoft/dotnet                   aspnetcore-runtime   41db56126a6d        7 days ago          260MB
```

Notice that there are two `blog.app` images, but one is shown as belonging to `blogregistry.azurecr.io`.

To actually get the image in to the _ACR_ we need to `docker push blogregistry.azurecr.io/blog.app:1`. This will take a few moments, depending on the upstream speed of your internet connection. Once the app has completed uploading you can verify that it has pushed the image up by using this command: `az acr repository list --name BlogRegistry`. For me the output is:

```
[
  "blog.app"
]
```

The image is now available in the cloud to be deployed.
