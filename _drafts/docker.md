`az login`
```
[
  {
    "cloudName": "AzureCloud",
    "id": "e02e97c6-65bc-4d1d-af17-2c15865aea6a",
    "isDefault": true,
    "name": "Pay-As-You-Go",
    "state": "Enabled",
    "tenantId": "df82b26c-1a8b-4d42-b5ff-d2f9c1c6e5fe",
    "user": {
      "name": "steve@codemunki.es",
      "type": "user"
    }
  }
]
```

`az group create --name "BlogGroup" --location westeurope`
```
{
  "id": "/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup",
  "location": "westeurope",
  "managedBy": null,
  "name": "BlogGroup",
  "properties": {
    "provisioningState": "Succeeded"
  },
  "tags": null
}
```

`az acr create --name "BlogRegistry" --resource-group "BlogGroup" --sku Basic`
```
{
  "adminUserEnabled": false,
  "creationDate": "2019-01-15T20:26:28.967702+00:00",
  "id": "/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry",
  "location": "westeurope",
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

`az acr login --name BlogRegistry`
```
Login Succeeded
```

`docker push blogregistry.azurecr.io/blog.app:1`
```
The push refers to repository [blogregistry.azurecr.io/blog.app]
75ab9749f40e: Pushed
1bf6c0ed381a: Pushed
e7ba18774395: Pushed
a0afac1d9f1c: Pushed
3fb318ee8d39: Pushed
ef68f6734aa4: Pushed
1: digest: sha256:fcd66ea63aa3f6d201fa9d0cc4b9a76583e1e2bd94f4b325d25d841488ff011e size: 1581
```

`az acr repository list --name BlogRegistry`
```
[
  "blog.app"
]
```

`az ad sp create-for-rbac --skip-assignment`
```
{
  "appId": "84b8c49a-7632-4a0e-9515-625b86d17a5f",
  "displayName": "azure-cli-2019-01-15-20-38-04",
  "name": "http://azure-cli-2019-01-15-20-38-04",
  "password": "4ae6dd38-3ff1-4182-ac6b-8f0eaac25011",
  "tenant": "df82b26c-1a8b-4d42-b5ff-d2f9c1c6e5fe"
}
```

`az acr show --resource-group BlogGroup --name BlogRegistry --query "id" --output tsv`
```
/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry
```

`az role assignment create --assignee 84b8c49a-7632-4a0e-9515-625b86d17a5f --scope /subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry --role Reader`
```
{
  "canDelegate": null,
  "id": "/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry/providers/Microsoft.Authorization/roleAssignments/063a72a8-9bea-4912-817d-0e1ca777c2a9",
  "name": "063a72a8-9bea-4912-817d-0e1ca777c2a9",
  "principalId": "13565f2c-69ae-401d-ac55-7246a04a46ab",
  "resourceGroup": "BlogGroup",
  "roleDefinitionId": "/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7",
  "scope": "/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourceGroups/BlogGroup/providers/Microsoft.ContainerRegistry/registries/BlogRegistry",
  "type": "Microsoft.Authorization/roleAssignments"
}
```

`az aks create --resource-group BlogGroup --name BlogCluster --node-count 1 --service-principal 84b8c49a-7632-4a0e-9515-625b86d17a5f --client-secret 4ae6dd38-3ff1-4182-ac6b-8f0eaac25011 --generate-ssh-keys`
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
  "fqdn": "blogcluste-bloggroup-e02e97-9c2dcf15.hcp.westeurope.azmk8s.io",
  "id": "/subscriptions/e02e97c6-65bc-4d1d-af17-2c15865aea6a/resourcegroups/BlogGroup/providers/Microsoft.ContainerService/managedClusters/BlogCluster",
  "kubernetesVersion": "1.9.11",
  "linuxProfile": {
    "adminUsername": "azureuser",
    "ssh": {
      "publicKeys": [
        {
          "keyData": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDGCdbW5dgN5ne8D2V1eRJyKJasYUMMTpSFrHIGEkIBuQ8v6MFHhTzMk0mbRWOxm9ox1tM1PbvnzP1JT2HiuhmZ8yGbNq96n98zAzjxi3492C3I/xHjZefGae9hMn4R0Pk+jLK0eBffqpaqgyD8nptdQt8NOfxQZF9czAXpKzmJjluPAcGnXXMDBZVmzYtp
GzZdgDd8clV5n7442nqaJfLatuaFLJUZLf4t+FoOys3ccwvgFpvWubGy9+kEa+OZhlJkTsH14zzjgEt80WabcOrLNpNoYT0omcfFY/YJ5TacAmCyZ/OCGOtie9+12DePNBswhtVIvg+/WZ1T1usj3vLXQea1ZTFjJnPjwkBmULEOKLL8nCdZCqcALAEVAs//mB1ocdyUH9nhkvKAjJtvX20RnX+sHPqpcz15MlRrSAZOEYRCxJWqOUjQRP
dwLZdGLSYfLfLXmFCxLkz5+eCH9xMuT/qJVtxI0ndWmt3fFSn9yxnpSxyoY61TdIfCxbf0WUv5GSm5JkxTi8JV7g84tMu15h/ASputolk31R9wYl/1vatSSdwltMSo+FgSm0H4yTWmxHFdJMGFeM+TzUQWBDL0384f2Mn0/BJyw3kvC31/E1lKnF04Zygtn7hJ3u5fyCOcOtYNSAiPfjfz8MRMk9H+owKeAGWxvFGlx//i3hxc6Q== ste
ve@codemunki.es\n"
        }
      ]
    }
  },
  "location": "westeurope",
  "name": "BlogCluster",
  "networkProfile": {
    "dnsServiceIp": "10.0.0.10",
    "dockerBridgeCidr": "172.17.0.1/16",
    "networkPlugin": "kubenet",
    "networkPolicy": null,
    "podCidr": "10.244.0.0/16",
    "serviceCidr": "10.0.0.0/16"
  },
  "nodeResourceGroup": "MC_BlogGroup_BlogCluster_westeurope",
  "provisioningState": "Succeeded",
  "resourceGroup": "BlogGroup",
  "servicePrincipalProfile": {
    "clientId": "84b8c49a-7632-4a0e-9515-625b86d17a5f",
    "secret": null
  },
  "tags": null,
  "type": "Microsoft.ContainerService/ManagedClusters"
}
```

`az aks get-credentials --resource-group BlogGroup --name BlogCluster`
```
Merged "BlogCluster" as current context in C:\Users\shock\.kube\config
```

`kubectl get nodes`
```
NAME                       STATUS    ROLES     AGE       VERSION
aks-nodepool1-11048030-0   Ready     agent     8m        v1.9.11
```

`az acr list --resource-group BlogGroup --query "[].{acrLoginServer:loginServer}" --output table`
```
AcrLoginServer
-----------------------
blogregistry.azurecr.io
```

`kubectl apply -f .\blog.yaml`
```
deployment.apps "blog-app" created
service "blog-app" created
```

`kubectl get service blog-app --watch`
```
NAME       TYPE           CLUSTER-IP     EXTERNAL-IP       PORT(S)        AGE
blog-app   LoadBalancer   10.0.247.204   137.117.179.134   80:31960/TCP   1m
```

`kubectl get pods`
```
NAME                        READY     STATUS    RESTARTS   AGE
blog-app-59d44c684d-wrb7w   1/1       Running   0          8m
```

Pod (`blog-app-59d44c684d-wrb7w`) is equivalent to machine (`X-machine-name: blog-app-59d44c684d-wrb7w`).

Updated `blog.yaml`.

```
NAME                        READY     STATUS    RESTARTS   AGE
blog-app-59d44c684d-vjjqr   1/1       Running   0          1m
blog-app-59d44c684d-wrb7w   1/1       Running   0          15m
```
