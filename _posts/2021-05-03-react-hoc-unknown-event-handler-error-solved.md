---
layout: 	post
title:  	"React Higher Order Components (HOC) - Unknown Event Handler Property - Solved!!!"
description:  "Unknown event handler property... will be ignored 👀"
date:   	2021-05-03 16:45:00
categories: react javascript
comments: false
page-type: article
hero-image: /assets/2021-05-03-web-dev.jpg
tile-image: /assets/2021-05-03-web-dev-tile.jpg
---

Recently I've been playing with React, and one of the specific techniques is the [Higher Order Components](https://reactjs.org/docs/higher-order-components.html). In this case I created a HOC to validate some input. The following is the component I created:

<script src="https://gist.github.com/steve-codemunkies/95fa4db42b6ae6f91fd01d2ac4e86297.js"></script>

However when writing tests I had this error:

```shell
  ● Console

    console.error
      Warning: Unknown event handler property `onValueChanged`. It will be ignored.
          at div
          at FormControl (/workspaces/probability/src/probability-ui/node_modules/@material-ui/core/FormControl/FormControl.js:90:24)
          at WithStyles(ForwardRef(FormControl)) (/workspaces/probability/src/probability-ui/node_modules/@material-ui/styles/withStyles/withStyles.js:67:31)
          at TextField (/workspaces/probability/src/probability-ui/node_modules/@material-ui/core/TextField/TextField.js:84:28)
          at WithStyles(ForwardRef(TextField)) (/workspaces/probability/src/probability-ui/node_modules/@material-ui/styles/withStyles/withStyles.js:67:31)
          at ProbabilityInputValidation (/workspaces/probability/src/probability-ui/src/withProbabilityInputValidation.js:7:13)

      at printWarning (node_modules/react-dom/cjs/react-dom.development.js:67:30)
      at error (node_modules/react-dom/cjs/react-dom.development.js:43:5)
      at validateProperty$1 (node_modules/react-dom/cjs/react-dom.development.js:3448:9)
      at warnUnknownProperties (node_modules/react-dom/cjs/react-dom.development.js:3559:21)
      at validateProperties$2 (node_modules/react-dom/cjs/react-dom.development.js:3583:3)
      at validatePropertiesInDevelopment (node_modules/react-dom/cjs/react-dom.development.js:8765:5)
      at setInitialProperties (node_modules/react-dom/cjs/react-dom.development.js:9041:5)
      at finalizeInitialChildren (node_modules/react-dom/cjs/react-dom.development.js:10201:3)
```

Luckily this is a reasonably described error and it didn't take much searching to get to the right [answer on Stack Overflow](https://stackoverflow.com/a/50196327/747649). The correct thing to do is to remove the offending property before passing to the wrapped component:

```js
const { error, onChange, onValueChanged, ...finalProps } = this.props;
```

Resulting in this updated HOC:

<script src="https://gist.github.com/steve-codemunkies/b3d193a404b08f6aa4b19cf65be73f2e.js"></script>