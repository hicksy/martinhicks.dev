---
title: Back to the Future
description: "As 2022 draws to a close I wanted to reflect on a welcome change in the web framework world that shifts the needle back towards web-first principles."
date: 2022-12-12
image: 
  path: /images/articles/back-to-the-future.jpeg
  alt: Graphic of promotional image for the Back to the Future film
---

As 2022 draws to a close I wanted to reflect on a welcome change in the web framework world that shifts the needle back towards web-first principles. Which I'm all here for. 

This year I’ve worked on a large web application using [Remix](http://remix.run), and the past week I’ve finally had free time to properly explore [Enhance](https://enhance.dev) - something I've been super excited about since it was announced back in late Summer 2022.

Both frameworks share core principles;

- web-platform aligned mechanism for storing state _(i.e forms, sessions and http verbs - those foundational web principles that somehow had been forgotten)_
- progressive enhancement; a web app can _(and should)_ be usable without browser JS
- HTML served over-the-wire
- file based routing 

The fact as an industry we allowed ourselves to sleep-walk into a period where these principles weren't the norm is unbelievable. 

Thankfully a long overdue course correction is taking place.

## Remix

I really enjoyed building with Remix - it's well thought out, and makes working with React, well... more _enjoyable_. 

We were able to scaffold out a broad approach to the app pretty seamlessly, and the build out was relatively pain free. We deployed the app to AWS using what Remix call their [Grunge stack](https://github.com/remix-run/grunge-stack) - which basically pairs Remix with [Architect](https://arc.codes) _(a tool I'm already very familiar with)_ and provides a catch-all Lambda to power the server-side code.

I believe Remix can be deployed anywhere that supports the Node.js runtime, and I think it even runs at the edge on web-workers - which is pretty cool.

It's amazing how much cruft Remix helps take away from a typical React project- no more nonsense client side Redux stores, optimistic UI is extremely easy (no loading spinners), and with the file based routing it's far simpler to move things around as you're building out an app. 

It's not without complexity, _it's still React, right?_ You have to be pretty disciplined to not over engineer things, particularly the functional component, as you can get drawn to using _(or overusing in my case)_ hooks etc to maintain state client-side rather than using the platform to best effect. _(Aware this is my issue not necessarily Remix's)_. 

A lot to like and definitely looking forward to using it again in 2023. 


## Enhance

For those new to it, [Enhance](https://enhance.dev) is a standards based web framework underpinned by Web Components from the folks at [Begin](https://begin.com). 

So far I've only had a chance to test out some very basic examples, but really like what I've seen, both in terms of playing around with it and the team's core mission.

>Our mission is to enable anyone to build multi-page dynamic web apps while staying as close to the platform as possible.

YES!! 🙌 

I'll write up another post soon I'm sure, but here's a quick summary of wins:

### 1. No need for client-side code

Components _(or Elements as enhance refers to them)_, can be _just_ HTML if you like, there's no need for any client-side JS at all. 

```
export default function ProseHeader({ html, state }) {
  const { attrs } = state
  const { title = '' } = attrs

  return html`
    <h1><slot></slot></h1>
  `
}
```

This Element would be usable in any Enhance page like so:
```
<prose-header>Article title</prose-header>
```

And to the browser, would be served up expanded ready for enhancement if required:

```
<prose-header>
<h1>Article title</h1>
</prose-header>
```

One thing I wish were possible _(and it may well be, I just haven't looked hard enough)_, is whether you could opt-out of the web component parent element all together for elements that don't require client-side enhancement
_i.e. they only contain HTML_. 

This is a feature I quite like in [11ty's webc](https://www.11ty.dev/docs/languages/webc/#html-only-components) - meaning if you're using webc as only a templating language, the outputted HTML is just pure HTML. 

Like I say, I'm not sure if this is possible or not. Nor is it much of a pain point to be honest, just a nicety. 

### 2. Progressive enhancement 

Easy to progressively enhance client-side capabilities by adding a script into the string returned from the Element.

```
...rest of Element
<script type="module">
  class ProseHeader extends HTMLElement {
    constructor() {
      super()
      this.heading = this.querySelector('h1')
    }
    
    ...whatever powers you want to give the new Web Component
  }

  customElements.define('prose-header', ProseHeader)
</script>
...etc
```

### 3. Routing

File based routing, with an API mechanism backed in.

For example, let's say you have the following page `/app/pages/index.html`, and the following api route `/app/api/index.mjs` the returned JSON from either the `get` handler, or `post` handler of the API will be made available to any custom elements within index.html automatically. 

The server-side mechanism automatically routes to the `get` handler if the request method is `GET` and likewise to the `post` handler if the request is a `POST`.

This is similar in nature to Remix's actions (post) and loaders (gets), but split across different files. 

### 4. Automatic state

Server side state is populated into every custom element for a given route automatically 

I think this is really powerful. No need to drill props, no need to maintain some sort of client-side state, if it's returned in the `json` prop from either a `get` or `post` handler it will be available in `state.store` in every element on the current page. 

What a joy.

## Summary

Overall two very interesting frameworks that I'm delighted exist. 

They've both, for different reasons, helped me get excited about web development again and travelling back to the future. 

---
