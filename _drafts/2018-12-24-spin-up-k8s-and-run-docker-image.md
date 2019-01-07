---
layout: 	post
title:  	"Spin up k8s and run your Docker image"
description:  "You got your Docker image into Azure, now you have to run it in a container for it to be actually of use..."
date:   	2018-12-24 12:00:00
categories: docker azure
comments: true
page-type: article
hero-image: /assets/2018-12-12-container-ship.jpg
---
https://docs.microsoft.com/en-us/azure/aks/tutorial-kubernetes-deploy-cluster
https://www.hanselman.com/blog/SettingUpAManagedContainerClusterWithAKSAndKubernetesInTheAzureCloudRunningNETCoreInMinutes.aspx


`az ad sp create-for-rbac --skip-assignment`
```
{                                                      
  "appId": "4c881a26-961c-441d-b381-a04c54e80510",     
  "displayName": "azure-cli-2019-01-06-21-21-49",      
  "name": "http://azure-cli-2019-01-06-21-21-49",      
  "password": "6e372903-8a12-4dbb-a297-f0b4a0eda3a2",  
  "tenant": "df82b26c-1a8b-4d42-b5ff-d2f9c1c6e5fe"     
}
```

`az acr show --resource-group "BlogGroup" --name BlogRegistry --query "id" --output tsv`
```
/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry
```

`az role assignment create --assignee 4c881a26-961c-441d-b381-a04c54e80510 --scope /subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry --role Reader`

Role should be `acrpull`?

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

`az aks create --resource-group BlogGroup --name BlogCluster --node-count 1 --service-principal 4c881a26-961c-441d-b381-a04c54e80510 --client-secret 6e372903-8a12-4dbb-a297-f0b4a0eda3a2 --generate-ssh-keys`
`SSH key files 'C:\Users\shock\.ssh\id_rsa' and 'C:\Users\shock\.ssh\id_rsa.pub' have been generated under ~/.ssh to allow SSH access to the VM. If using machines without permanent storage like Azure Cloud Shell without an attached file share, back up your keys to a safe location`
Takes several minutes
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
          "keyData": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDGCdbW5dgN5ne8D2V1eRJyKJasYUMMTpSFrHIGEkIBuQ8v6MFHhTzMk0mbRWOxm9ox1tM1PbvnzP1JT2HiuhmZ8yGbNq96n98zAzjxi3492C3I/xHjZefGae9hMn4R0Pk+jLK0eBffqpaqgyD8nptdQt8NOfxQZF9czAXpKzmJjluPAcGnXXMDBZVmzYtpGzZdgDd8clV5n7442nqaJfLatuaFLJUZLf4t+FoOys3ccwvgFpvWubGy9+kEa+OZhlJkTsH14zzjgEt80WabcOrLNpNoYT0omcfFY/YJ5TacAmCyZ/OCGOtie9+12DePNBswhtVIvg+/WZ1T1usj3vLXQea1ZTFjJnPjwkBmULEOKLL8nCdZCqcALAEVAs//mB1ocdyUH9nhkvKAjJtvX20RnX+sHPqpcz15MlRrSAZOEYRCxJWqOUjQRPdwLZdGLSYfLfLXmFCxLkz5+eCH9xMuT/qJVtxI0ndWmt3fFSn9yxnpSxyoY61TdIfCxbf0WUv5GSm5JkxTi8JV7g84tMu15h/ASputolk31R9wYl/1vatSSdwltMSo+FgSm0H4yTWmxHFdJMGFeM+TzUQWBDL0384f2Mn0/BJyw3kvC31/E1lKnF04Zygtn7hJ3u5fyCOcOtYNSAiPfjfz8MRMk9H+owKeAGWxvFGlx//i3hxc6Q== steve@codemunki.es\n"
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

`az aks install-cli`
`Downloading client to "C:\Users\shock\.azure-kubectl\kubectl.exe" from "https://storage.googleapis.com/kubernetes-release/release/v1.13.1/bin/windows/amd64/kubectl.exe"`
```
Please add "C:\Users\shock\.azure-kubectl" to your search PATH so the `kubectl.exe` can be found. 2 options:
    1. Run "set PATH=%PATH%;C:\Users\shock\.azure-kubectl" or "$env:path += 'C:\Users\shock\.azure-kubectl'" for PowerShell. This is good for the current command session.
    2. Update system PATH environment variable by following "Control Panel->System->Advanced->Environment Variables", and re-open the command window. You only need to do it once
```

`az aks get-credentials --resource-group BlogGroup --name BlogCluster`
`Merged "BlogCluster" as current context in C:\Users\shock\.kube\config `

`kubectl get nodes`
```
NAME                       STATUS    ROLES     AGE       VERSION
aks-nodepool1-11048030-0   Ready     agent     8m        v1.9.11
```

https://docs.microsoft.com/en-us/azure/aks/tutorial-kubernetes-deploy-application

https://speakerdeck.com/shahiddev/kubernetes-for-net-developers?slide=26
`kubectl run blog-app --image=blogregistry.azurecr.io/blog-app:1 --port=80 --dry-run -o yaml > .\blog.yaml`
blog.yaml

Service section?

`kubectl apply -f .\blog.yaml`
```
deployment.extensions "blog-app" created
service "blog-app" created
```

`kubectl get service blog-app --watch`
```
NAME       TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
blog-app   LoadBalancer   10.0.108.187   <pending>     80:30992/TCP   21s
blog-app   LoadBalancer   10.0.108.187   40.127.98.27   80:30992/TCP   55s
```
