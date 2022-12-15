---
title: Sharing Enhance elements between projects
description: "This post introduces a new arc plugin for Enhance projects that I've recently published, with the catchy name 'shared-enhance-components-plugin'"
date: 2022-12-15
image: 
  path: /images/articles/klara-kulikova-WcV2YkM3Dls-unsplash.jpg
  alt: A picture of people sharing a pizza
---



This post introduces a new arc plugin for Enhance projects that I've recently published, with the catchy name [shared-enhance-components-plugin](https://www.npmjs.com/package/@hicksy/shared-enhance-components-plugin).

Read on for details about how to use the plugin and why I came to write it. 

## Background
While I [continued my exploration](/articles/back-to-the-future) of the [Enhance](https://enhance.dev) framework, I started to wonder how you'd go about importing elements from a shared library or UI toolkit. 

In a React project, you'd import the library into the given component and then begin using its JSX tag within the render. 

However, Enhance elements are dependency free by design, for good reasons. 

So instead, any element you create within `/app/elements` or define within `/app/elements.mjs` _(* more on this later)_, becomes automatically available in any Enhance page.

That doesn't mean you can't use dependencies where appropriate. Let's say you have a couple of elements, one of which can be used standalone, the other you always want a particular element included, you could do the following:

```
//app/elements/csrf-input

export default function CsrfInput({ html, state }) {
    const { attrs={}, store={} } = state
    const { name = 'csrf' } = attrs
    return html`
        <input type="hidden" name="${name}" value="${store.csrf_token}" />
    `
}

import CsrfInput from "./csrf-input.mjs";

export default function CsrfForm({ html, state }) {
    const { attrs={} } = state
    const { action = '', method = '' } = attrs

    return html`
    <form action="${action}" method="${method}">
        ${CsrfInput({html, state})}
        <slot></slot>
    </form>
`
}
```

You can simply call the pure function to return its "render", e.g. `${CsrfInput({html, state})}`.

And I think looking at my browser's source, it means the dependent element is just the HTML entity, rather than being expanded into a web component. Which in this case is what I wanted, all be it by accident. 

Pretty cool. 

But what about if you want to bring in a shared UI library maintained by a different team or 3rd party?

After a search on the [Enhance Discord](https://enhance.dev/discord) _(which is great by the way - definitely head there for help / guidance / cool things people are building)_, I couldn't find anything baked in. 

I did see a comment from Macdonst (one of the begin/enhance team), who was explaining how you could do all of your imports in an `/app/elements.mjs` file, and then they would be available throughout your app just like a first-party element you've created in `/app/elements` - nice. 

He went on... 
>The above is begging to be a plug-in.

So I thought why not.

## What is this elements.mjs file anyway?

It's not mentioned much in their docs at all. In fact, at the time of writing, it's only referenced within the [Deploy to Fastify section](https://enhance.dev/docs/learn/deployment/fastify). 

However, if you look at the code for the `arc-plugin-enhance` _(which is the plugin that orchestrates arc to have a catch-all lambda for each /app/api/ route, among many other things)_, you'll see that 4 locations are checked for elements to enhance:

```
let pathToModule = join(basePath, 'elements.mjs')
let pathToPages = join(basePath, 'pages')
let pathToElements = join(basePath, 'elements')
let pathToHead = join(basePath, 'head.mjs')
```

i.e. 
- `/app/elements.mjs`
- `/app/pages` (any mjs file in here)
- `/app/elements` (any mjs file in here)
- `/app/head.mjs` 

The elements.mjs file is basically returning a keyed object mapping the tag name (e.g `my-component`) to a corresponding element function (e.g. MyComponent) (which can be located anywhere, like `node_modules/some-package/elements/MyComponent.mjs`)

```
import MyComponent from 'some-package/elements/MyComponent.mjs'

let elements = {

  'my-component': MyComponent
}

export default elements
```

So that's a pretty powerful in-built mechanism for linking things together right there. 

The need for a potential plugin is that you may `npm install` a package with 10s, 100s of components you'd like to use, so having a plugin do most of the leg work is helpful. 

Also, defining a map between the tag name and pure function doesn't seem to have any draw back - I'm fairly certain elements are only processed if they're referenced within a page and / or element - so mapping a lot of potentially unused components seems to have no issues


## Building the plugin

Enhance (the way I'm using it), is wrapped with [Architect](https://arc.codes). Meaning you can easily deploy your enhance app to [AWS](https://aws.amazon.com/lambda/), or to [Begin](https://begin.com). 

Because it uses Architect's sandbox to run locally, and its hydration mechanism to hydrate your Lambda function code before deployment, you can also tap into Arc's powerful plug-in system. 

I'd previously had a go at an Architect plugin and got a little lost. Since then _(18 months or so ago)_, they've massively [expanded their plug-in docs](https://arc.codes/docs/en/guides/plugins/overview) and improved the available lifecycle hooks you can tap into. 

I also had a good look at some of the [plugins listed in their repository](https://github.com/architect/plugins), which helped me figure things out. 

After an afternoon or so's work I had an acceptable _(just about)_ version of a plugin which works as follows:

1. You add a component package or UI library to the .arc file under the plugin's unique @ pragma - `@shared-enhance-components-plugin` - this informs the plugin which external packages to import component elements from.
2. On arc hydration (which happens during sandbox start, and pre arc deploy), the plugin analyses the available functions that can be imported from the given package:
		
	- either from a specific folder, in which case each .mjs / js file will be mapped into elements.mjs
	- or from an index.js file, in which case each named export will be mapped into elements.mjs

3. Tag names are inferred by de-camelcasing the function name
4. Any existing elements you've manually added to elements.mjs will be preserved _(auto generated lines include an eol comment)_

## Example usage

I think it's pretty easy to use. 

1. First install the plugin and tie it into your project's arc file. 

```
npm install @hicksy/shared-enhance-components-plugin
```

```
//.arc

@app
myproj

@plugins
enhance/arc-plugin-enhance
hicksy/shared-enhance-components-plugin
```

_nb: you have to drop the preceding @ on scoped package names in the .arc file so they don't collide with the pragma names_

  2. Install some shared elements

For example, we could install these example Enhance form elements - [https://github.com/enhance-dev/form-elements.git](https://github.com/enhance-dev/form-elements.git)

```
npm install git+https://github.com/enhance-dev/form-elements.git
```

3. Tell the plugin to use this package

```
//.arc

@app
myproj

@plugins
enhance/arc-plugin-enhance
hicksy/shared-enhance-components-plugin

@shared-enhance-components-plugin
hicksy/enhance-csrf 'elements'
enhance/form-elements
```

Note in the above example the package we've just installed is referenced just by it's name _(dropping the @ again to avoid collision with arc pragmas)_ - we know by looking at this package all of it's components are named exports [from a route index.js file](https://github.com/enhance-dev/form-elements/blob/main/index.js). 

For [@hicksy/enhance-csrf](https://www.npmjs.com/package/@hicksy/enhance-csrf) package, we pass a second arg to the plugin, this tells the plugin that the components are individual files within [the specific folder](https://github.com/hicksy/enhance-csrf/tree/main/elements). 

4. Start

`npm start`

The plugin-hook will fire, and the `/app/elements.mjs` file will be auto-populated with the tag-name's and import declarations as required.

```
// /app/elements.mjs

import CsrfInput from '@hicksy/enhance-csrf/elements/csrf-input.mjs' //automatically inserted by shared-enhance-components-plugin
import CsrfForm from '@hicksy/enhance-csrf/elements/csrf-form.mjs' //automatically inserted by shared-enhance-components-plugin
import { CheckBox } from '@enhance/form-elements/index.js' //automatically inserted by shared-enhance-components-plugin
import { FieldSet } from '@enhance/form-elements/index.js' //automatically inserted by shared-enhance-components-plugin
import { FormElement } from '@enhance/form-elements/index.js' //automatically inserted by shared-enhance-components-plugin
import { LinkElement } from '@enhance/form-elements/index.js' //automatically inserted by shared-enhance-components-plugin
import { PageContainer } from '@enhance/form-elements/index.js' //automatically inserted by shared-enhance-components-plugin
import { SubmitButton } from '@enhance/form-elements/index.js' //automatically inserted by shared-enhance-components-plugin
import { TextInput } from '@enhance/form-elements/index.js' //automatically inserted by shared-enhance-components-plugin

let elements = {

  'csrf-input': CsrfInput, //automatically inserted by shared-enhance-components-plugin
  'csrf-form': CsrfForm, //automatically inserted by shared-enhance-components-plugin
  'check-box': CheckBox, //automatically inserted by shared-enhance-components-plugin
  'field-set': FieldSet, //automatically inserted by shared-enhance-components-plugin
  'form-element': FormElement, //automatically inserted by shared-enhance-components-plugin
  'link-element': LinkElement, //automatically inserted by shared-enhance-components-plugin
  'page-container': PageContainer, //automatically inserted by shared-enhance-components-plugin
  'submit-button': SubmitButton, //automatically inserted by shared-enhance-components-plugin
  'text-input': TextInput //automatically inserted by shared-enhance-components-plugin
}

export default elements

```


## Publishing to NPM

I've never published a package to NPM before so this was all new to me.

Previous node packages I've created have all been private and we'd opted to npm installing from the git repo address rather than purchasing a private packages account from npm. 

Publishing was really straight forward (aside from accidentally deploying it unscoped, and then deciding I'd prefer to release it scoped to my username).

I followed this [guide to npm publishing](https://zellwk.com/blog/publish-to-npm/) - thanks Zell!

## And there you go... 

A small plugin that hopefully eases the use of shared Enhance elements and hopefully making it more compelling for authors to share libraries of their elements for others to use?

There's no doubt a few wrinkles will be discovered, and the plugin code could do with a tidy, but I'm pretty happy with it. 

Get in [touch on GitHub](https://github.com/hicksy/hicksy-shared-enhance-components-plugin) if there's any issues, improvements or feature ideas.  

---


		
		


