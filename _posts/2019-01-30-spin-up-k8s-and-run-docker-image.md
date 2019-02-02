---
layout: 	post
title:  	"Spin up k8s and run your Docker image"
description:  "You got your Docker image into Azure, now you have to run it in a container for it to be actually of use..."
date:   	2019-01-30 21:00:00
categories: docker azure
comments: true
page-type: article
hero-image: /assets/2018-12-12-container-ship.jpg
---

In a [previous post]({% post_url 2018-12-19-deploy-docker-image-azure %}) I deployed a docker image to an Azure Container Registry. I then spent most of the following month (on and off) trying to get kubernetes to spin and run the image as a container. Eventually I changed the region from `northeurope` to `westeurope` and everything started to work... I've put an update into that previous post.

We need our AKS cluster to be able to pull images from our Azure Container Registry, and in the future it might be good if it can interact with other Azure resources. As this is Azure the way security is controlled is through Active Directory. We going to create a service principal to use in our AKS cluster, the command for this is `az ad sp create-for-rbac --skip-assignment`. RBAC stands for [Role Based Access Control](https://en.wikipedia.org/wiki/Role-based_access_control). The `--skip-assignment` flag means that we aren't assigning any defaults to this user. The output from this command is:

```
{                                                      
  "appId": "4c881a26-961c-441d-b381-a04c54e80510",     
  "displayName": "azure-cli-2019-01-06-21-21-49",      
  "name": "http://azure-cli-2019-01-06-21-21-49",      
  "password": "6e372903-8a12-4dbb-a297-f0b4a0eda3a2",  
  "tenant": "df82b26c-1a8b-4d42-b5ff-d2f9c1c6e5fe"     
}
```

We're going to need the  `appId` and `password` fields later on, so make a note of these (or just copy the whole output).

To be able to grant the service principal (that we have just created) permission to pull images from our Container Repository we need to know the resource id of the ACR. This is found with this command: `az acr show --resource-group BlogGroup --name BlogRegistry --query "id" --output tsv`. The output is another giant string:

```
/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry
```

We can now construct the command that grants our service principal access to our ACR. This is the template for the command: `az role assignment create --assignee <appId> --scope <acrId> --role Reader`. Plugging in the `appId` from the `... create-for-rbac ...` command and the `acrId` from the `az acr show ...` command gave me this monster command: `az role assignment create --assignee 4c881a26-961c-441d-b381-a04c54e80510 --scope /subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry --role Reader`. Running it produces output similar to the following:

```
{
  "canDelegate": null,
  "id": "/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry/providers/Microsoft.Authorization/roleAssignments/db5964c8-7466-45fe-a096-ce8342eecc86",
  "name": "db5964c8-7466-45fe-a096-ce8342eecc86",
  "principalId": "84dd5100-759e-4294-8a43-71045ecb6fd7",
  "resourceGroup": "BlogGroup",
  "roleDefinitionId": "/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7",
  "scope": "/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry",
  "type": "Microsoft.Authorization/roleAssignments"
}
```

At this point all we have done is give our service principal permission to read images from our Container Registry. The next step is to create the kubernetes cluster itself. The command is another monster, and this is the template: `az aks create --resource-group BlogGroup --name BlogCluster --node-count 1 --service-principal <appId> --client-secret <password> --generate-ssh-keys`. You will need the `appId` and the `password` from the `... create-for-rbac ...` command. Additionally if you already have SSH keys that you want to use you can [swap](https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest#az-aks-create) `--generate-ssh-keys ` for `--ssh-key-value /path/to/publickey`.

The command I ran was `az aks create --resource-group BlogGroup --name BlogCluster --node-count 1 --service-principal 4c881a26-961c-441d-b381-a04c54e80510 --client-secret 6e372903-8a12-4dbb-a297-f0b4a0eda3a2 --generate-ssh-keys`. This generated this intermediate output: `SSH key files 'C:\Users\shock\.ssh\id_rsa' and 'C:\Users\shock\.ssh\id_rsa.pub' have been generated under ~/.ssh to allow SSH access to the VM. If using machines without permanent storage like Azure Cloud Shell without an attached file share, back up your keys to a safe location`. The actual creation of the cluster takes several minutes, so sit tight and be patient. When it completes output similar to the following is displayed:

```
{
  "aadProfile": null,
  "addonProfiles": null,
  "agentPoolProfiles": [
    {
      "count": 1,
      "maxPods": 110,
      "name": "nodepool1",
      "osDiskSizeGb": 30,
      "osType": "Linux",
      "storageProfile": "ManagedDisks",
      "vmSize": "Standard_DS2_v2",
      "vnetSubnetId": null
    }
  ],
  "dnsPrefix": "BlogCluste-BlogGroup-e02e97",
  "enableRbac": true,
  "fqdn": "blogcluste-bloggroup-e02e97-dc372019.hcp.northeurope.azmk8s.io",
  "id": "/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourcegroups/BlogGroup/providers/Microsoft.ContainerService/managedClusters/BlogCluster",
  "kubernetesVersion": "1.9.11",
  "linuxProfile": {
    "adminUsername": "azureuser",
    "ssh": {
      "publicKeys": [
        {
          "keyData": "ssh-rsa A...\n"
        }
      ]
    }
  },
  "location": "northeurope",
  "name": "BlogCluster",
  "networkProfile": {
    "dnsServiceIp": "10.0.0.10",
    "dockerBridgeCidr": "172.17.0.1/16",
    "networkPlugin": "kubenet",
    "networkPolicy": null,
    "podCidr": "10.244.0.0/16",
    "serviceCidr": "10.0.0.0/16"
  },
  "nodeResourceGroup": "MC_BlogGroup_BlogCluster_northeurope",
  "provisioningState": "Succeeded",
  "resourceGroup": "BlogGroup",
  "servicePrincipalProfile": {
    "clientId": "4c881a26-961c-441d-b381-a04c54e80510",
    "secret": null
  },
  "tags": null,
  "type": "Microsoft.ContainerService/ManagedClusters"
}
```

To control k8s we use [_kubectl_](https://kubernetes.io/docs/tasks/tools/install-kubectl/). But rather than having to follow the instructions Azure provides a nice way to install and setup all at once: `az aks install-cli`. The command will tell you what is being downloaded, and where to:

```
Downloading client to "C:\Users\shock\.azure-kubectl\kubectl.exe" from "https://storage.googleapis.com/kubernetes-release/release/v1.13.1/bin/windows/amd64/kubectl.exe"
```

Once the download has been completed you'll be given some instructions on how to setup your machine so that Azure can play nicely with _kubectl_.

```
Please add "C:\Users\shock\.azure-kubectl" to your search PATH so the `kubectl.exe` can be found. 2 options:
    1. Run "set PATH=%PATH%;C:\Users\shock\.azure-kubectl" or "$env:path += 'C:\Users\shock\.azure-kubectl'" for PowerShell. This is good for the current command session.
    2. Update system PATH environment variable by following "Control Panel->System->Advanced->Environment Variables", and re-open the command window. You only need to do it once
```

Before we can actually control our sparkly new k8s cluster we need to download configuration information into _kubectl_. This is acheived with this command: `az aks get-credentials --resource-group BlogGroup --name BlogCluster`. The command will tell you what it's done:

```
Merged "BlogCluster" as current context in C:\Users\shock\.kube\config
```

You can then check that your _kubectl_ is working with the following command: `kubectl get nodes`. You should see some output similar to the following:

```
NAME                       STATUS    ROLES     AGE       VERSION
aks-nodepool1-11048030-0   Ready     agent     8m        v1.9.11
```

With a working _kubectl_ we can now get our docker image running in a container. This is entirely do-able using the _kubectl_ command line. But it's more straight forward (and repeatable) to use a _yaml_ file. There are many [examples](https://github.com/Azure-Samples/azure-voting-app-redis/blob/master/azure-vote-all-in-one-redis.yaml) available. But it is possible to have _kubectl_ [generate](https://speakerdeck.com/shahiddev/kubernetes-for-net-developers?slide=26) at least part of the file: `kubectl run blog-app --image=blogregistry.azurecr.io/blog-app:1 --port=80 --dry-run -o yaml > .\blog.yaml`.

This will generate a [deployment section](https://devopscube.com/kubernetes-deployment-tutorial/). What it doesn't generate is a _service_ section. The _service_ section exposes the container to the outside world, allowing us to access it.

Having created the yaml file we can now apply it: `kubectl apply -f .\blog.yaml`.

```
deployment.extensions "blog-app" created
service "blog-app" created
```

Once we've applied the yaml we can then get the status of the status of the service using this command: `kubectl get service blog-app --watch`. It will carry on running updating occasionally until you quit the application.

```
NAME       TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
blog-app   LoadBalancer   10.0.108.187   <pending>     80:30992/TCP   21s
blog-app   LoadBalancer   10.0.108.187   40.127.98.27   80:30992/TCP   55s
```

In the first entry the container is starting up, so not available. In the second entry the application is now available, and can be reached at the specified IP address.
