---
title: Eleventy 2.0 & WebC
description: "I look at my experiences trying out Eleventy and its new Web Component language, webc."
date: 2022-12-17
image: 
  path: /images/articles/eleventy-webc.png
  webp: /images/articles/eleventy-webc.webp
  alt: Eleventy and WebC text only logos on a black background
---
I recently rebuilt this website and my company website - [sinovi.uk](sinovi.uk) - using [Eleventy](https://www.11ty.dev/) 2.0 and their new [WebC](https://www.11ty.dev/docs/languages/webc/) language for templating.

It's really good. And well worth checking out. 

In this post I look at my experiences trying out Eleventy 2.0 and its new Web Component language, WebC.

_**Note**_

At the time of writing 11ty 2.0 is pre-release. 

It’s just hit version [canary-20](https://www.npmjs.com/package/@11ty/eleventy/v/2.0.0-canary.20) and judging by 11ty's [recent toot](https://fosstodon.org/@eleventy/109524124580037564), it’s official release is very close.

## Background

I’d heard of the Eleventy project in passing via newsletters and Twitter posts for several years, but up until a few months ago I hadn’t tried to build anything with it.

I think I’d mentally stored it away as similar in vain to Gatsby  or some similar react tool - _...there's a lot of those, right?_ 

How wrong was I?


## Static site generation

Back in 2018, at Si Novi, we rolled our own internal tool for static site generation, that I’ve now learnt felt pretty similar to 11ty in some respects, but lacked its finesse and feature set.

Our templates were HTML and we used a companion JSON file _(ie index.html & index.json)_ to hook data into each page view using HTML attributes. 

We had collections in an array within a standalone json file _(eg articles.json)_. We even hooked it up to PHP blade templates for one test project.

There was a key thing wrong with it though **- it was a bloody pain to use.** 

At the time we didn’t know about the [front matter](https://www.11ty.dev/docs/data-frontmatter/) syntax, which in hindsight might’ve helped. 

But the key issue was our node CLI processing engine was written using a jquery compatible dom lib - [Cheerio](https://www.npmjs.com/package/cheerio), and a load of [Grunt](https://gruntjs.com/) hooks. 

It was fiddly; hard to maintain and lacked features, and we never quite found the time to make improvements alongside our client work.

Furthermore, we were having to stuff lots of properties into the JSON files to handle conditional templating logic particularly for reusing partial views / re-usable template snippets.

Maybe if we’d known about frontmatter, had chosen a templating engine like [nunjucks](https://mozilla.github.io/nunjucks/), and had known about [parse5](https://github.com/inikulin/parse5), I’d still be maintaining it now - who knows?

What I do know _(now)_ is that 11ty absolutely nails static site generation. 

They have multiple [templating languages](https://www.11ty.dev/docs/languages/), [nested layouts](https://www.11ty.dev/docs/layout-chaining/), a [sensible config](https://www.11ty.dev/docs/config/) and [plugin system](https://www.11ty.dev/docs/plugins/), and a really cool [data cascade](https://www.11ty.dev/docs/data-cascade/) which provides lots of options for populating a page’s templating data or mutating a particular value prior to generating the page.

The docs site is _veeeeerrrry_ comprehensive. To be honest… so big I found it overwhelming to begin with _(it really melted my head for a bit)_, but it's a fantastic resource and a credit to the community of contributors. 

## My first look

I took my first spin of Eleventy when I heard about [Enhance](https://enhance.dev) in September and noticed one of their [deployment targets was 11ty](https://enhance.dev/docs/learn/deployment/11ty).

Building out a few demo pages, I really liked what I saw in both projects but struggled with a few bits as I tried to understand how these worked together.

Attempting to learn two new things at once meant I was doing a disservice to both tools; hampering my understanding of each project, and limiting my discovery of any overlap / boundaries of concern when using them together.

I gave up. 

But promised myself I’d go deeper into each tool individually when time allowed. 

## Learning Eleventy

A month or so later I started a fresh starter Eleventy project. 

Making some really simple pages and layouts, I learnt about 11ty’s special dirs (like `_includes` & `_data`), and generally started to feel more comfortable with how Eleventy worked and it’s limitations.

Those limitations, for me, were the fact that sharing blocks of re-usable components felt difficult. 

You could use 11ty’s [shortcodes](https://www.11ty.dev/docs/shortcodes/) to create snippets, or [nunjuck macros](https://www.trysmudford.com/blog/encapsulated-11ty-components/), but these felt to me like reusing strings of templates was just about ok, but making them configurable using properties or attributes wasn’t a great experience for me. 

Having first used 11ty with Enhance, I’d been drawn to Enhance’s use of Web Components as [reusable elements](https://enhance.dev/docs/learn/starter-project/elements) - it fit my more recent mental model of using components in [htm](https://github.com/developit/htm) or react.

Maybe I gave up too soon in my earlier experiments? 

But then I heard about Webc - I decided to persevere with my original plan, and set about re-building the [Si Novi](https://sinovi.uk) and [martinhicks.dev](https://martinhicks.dev) sites .

## Webc - now we’re rocking

Webc is a brand new 11ty templating language. 

It uses Web Components and requires Eleventy 2.0 _(at time of writing this is pre-release and requires installing [their canary package](https://www.npmjs.com/package/@11ty/eleventy/v/2.0.0-canary.20))_.

Using Webc with 11ty is seamless; You can use WebC to build an individual component, for re-use and you can use it for layouts. Basically anywhere you’d expect an 11ty template to work, .webc files work. 

Meaning it works on its own, or can be used within their other templating languages too. And being 11ty you can mix and match templating languages throughout a project.

**I like this 11ty feature a lot** - there’s loads of useful 11ty code snippets on gist, on their website, and, well all over the internet written in [Nunjucks](https://www.11ty.dev/docs/languages/nunjucks/) or [Liquid](https://www.11ty.dev/docs/languages/liquid/) and choosing to use WebC doesn’t prohibit you from tapping into this rich seam.

For example I’m using an njk page to create my `sitemap.xml` and another to create my RSS `feed.xml`.


~~~
{% raw %}
//sitemap.njk

---
permalink: /sitemap.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    {% for page in collections.all %}
        <url>
            <loc>{{ site.url }}{{ page.url | url | replace(r/\/$/, "") }}</loc>
            <lastmod>{{ page.date.toISOString() }}</lastmod>
        </url>
    {% endfor %}
</urlset>
{% endraw %}
~~~

~~~
{% raw %}
//rss.njk
---json
{
  "permalink": "feed.xml",
  "eleventyExcludeFromCollections": true,
  "metadata": {
    "title": "Martin Hicks - Journal",
    "subtitle": "Martin Hicks is a software developer from Manchester, UK",
    "language": "en",
    "url": "https://martinhicks.dev/",
    "author": {
      "name": "Martin Hikcs",
      "email": "hello@martinhicks.net"
    }
  }
}
---
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xml:base="{{ metadata.url }}" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{{ metadata.title }}</title>
    <link>{{ metadata.url }}</link>
    <atom:link href="{{ permalink | absoluteUrl(metadata.url) }}" rel="self" type="application/rss+xml" />
    <description>{{ metadata.subtitle }}</description>
    <language>{{ metadata.language }}</language>
    {%- for post in collections.articles | reverse %}
    {%- set absolutePostUrl = post.url | absoluteUrl(metadata.url) %}
    <item>
      <title>{{ post.data.title }}</title>
      <link>{{ absolutePostUrl }}</link>
      <description>{{ post.data.description | htmlToAbsoluteUrls(absolutePostUrl) }}</description>
      <pubDate>{{ post.date | dateToRfc822 }}</pubDate>
      <dc:creator>{{ metadata.author.name }}</dc:creator>
      <guid>{{ absolutePostUrl }}</guid>
    </item>
    {%- endfor %}
  </channel>
</rss>
{% endraw %}
~~~


I also really like the fact I can _just_ use WebC as a [templating language for HTML generation](https://www.11ty.dev/docs/languages/webc/#html-only-components). 

This website currently has zero need for any client-side progressive enhancement, so I don’t need any of the web component features in the HTML served to the browser. 

11ty allows you to build a component that just returns HTML, and if so, the generator treats that component output as just the inner HTML omitting the enclosing custom element tag.

If you did want to keep the component wrapper for some reason you pass an attribute of `webc:keep`.


```
//my-avatar.webc
//example html only web component
<picture>
    <source srcset="/images/5F8AB69C-FA08-4C25-B932-74D76EBB7721.webp" type="image/webp">
    <img src="/images/5F8AB69C-FA08-4C25-B932-74D76EBB7721.jpg" alt="Me and my wife, Helen, lying on the grass in summer. " :width="this.width" :height="this.height" class="max-w-[100px] md:max-w-[200px] mx-auto aspect-square ring-2 ring-zinc-500/40 rotate-45 rounded-full bg-zinc-100 object-cover"/>
</picture> 
```

Webc with 2.0 means I could now build proper re-usable components, configurable with attribute props if required. No more snippets or Nunjucks macros.

```
<my-avatar width="200" height="200"></my-avatar>
<my-avatar width="100" height="100"></my-avatar>
```

Perfect.

Other wins are;

- **Using web components within the [head element](https://www.11ty.dev/docs/languages/webc/#components)** - this isn’t allowed by the Web Component spec I don't think, but given you may have a Webc component that just provides HTML you can use the `webc:is` attribute to upgrade a standard element to a WebC component just for templating purposes _(but only if it just returns html)_

Eg:

```
<script webc:is="json-ld" ></script>
```

The above `script` tag in my head, will be ran using my component `json-ld`, which basically adds some dynamic json-ld for articles on this site, and excludes if it's not an article page. 

- **WebC components can include render only Js functions to iterate collections**

```
{% raw %}
---
meta:
title: "Articles"
description: "Occasional thoughts"
pagination:
  data: collections.articles
  size: 10
  alias: articles
  reverse: true
layout: layouts/main.webc
---


<container>
  <div class="flex flex-col mx-auto justify-center ">
    <h1 class="text-4xl font-bold tracking-tight text-zinc-800  sm:text-5xl mt-4">
      Journal
    </h1>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-2 auto-cols-auto md:auto-rows-[1fr] mb-8">
      <script webc:type="render" webc:is="template">
        function () {
          //console.log(this.pagination)
          let articles = this.pagination.items;

          return articles.map((article, idx) => /*html*/`
                    
            <div class="prose relative pb-8">
                    <a href="${article.data.url}">
                        <picture class="flex w-full " >
                            <source srcset="${article.data.image.webp}" type="image/webp">
                            <img class=" full-width mb-2" src="${article.data.image.path}" width="345" height="236" alt="${article.data.image.alt}">
                        </picture> 
                    </a>
                    <span class="!text-sm">
                    ${article.data.date}
                    </span>
                    <h1 class="!text-xl mb-2 font-semibold"><a class=" no-underline" href="${article.data.url}">${article.data.title}</a></h1>
                    <p>${article.data.description}</p>
                    <a class="absolute bottom-2 " href="${article.data.url}">
                        Read the article
                    </a>
                </div>
                
                    `)
          .join("");
        }
      </script>
    </div>

    <hr>

  </div>

  <my-details mode="full"></my-details>
</container>
{% endraw %}

```

- **Slots**

If you’ve used any Web Component tool or manually created your own, you’ll know that web components use ‘slots’ to control where nested elements or strings are displayed within the component template.

They’re super useful and help direct content to the correct placeholder without using attributes or similar.

eg:

```
//social-link.webc

<a class="group -m-1 p-1" :href="href" target="_blank" :aria-label="this.arialabel" :role="this.role" :rel="this.rel">
    <div class="flex items-center space-x-2">
        <slot name="icon"></slot>
        <slot name="content"></slot>
    </div>
</a>
```

Which is usable like:

```
<social-link rel="me" role="listitem" href="https://indieweb.social/@martinhicks">
    <icon-mastodon slot="icon" class="w-8 h-8"></icon-mastodon>
    <span slot="content">Follow on Mastodon</span>
</social-link>
```

_nb icon-mastodon is another webc component - completely nest-able as you'd expect_



## Things to look out for in 2.0 / webc

Having not been a long time user of 11ty, I’ll leave any deep comparison between the two versions to seasoned experts. 

There’s loads of new features in 11ty 2.0, some of which are breaking changes. 

Their docs site does a good job of signposting these changes, and I’m sure when it’s released there will be loads written to guide users in migration.

What I’ve found:

1. **Webc: Script and link tags**

Since, I think, `"@11ty/eleventy": "2.0.0-canary.18"` or `"@11ty/eleventy-plugin-webc": "0.8.0"`, you’ve been required to add `webc:keep` to any script or link tag that has an external src. 

Thankfully the CLI warns you of these during build, throwing an error.

However, I found that several non external script tags in my head (two json-ld and the local google analytics gtag script) weren’t included in my published site for a week.

Adding `webc:keep` brought them back. 

Maybe I misread the CLI warning, but I don’t think I did. And certainly the lack of them on an external src caused a build fail, whereas omitting them for locally src’d elements didn’t.

Luckily I don’t care much about either of those on my personal site, so no biggie. 

___**Given that I’m using a canary build and I haven’t been studiously keeping up with the change notes between pre-release build versions I’ll take the blame on this one.__**_

2. **11ty 2.0 - The copy command doesn’t actually copy files locally during dev**

This is new and intentional, for performance reasons, it sort of magically symlinks them internally during the local serve process. 

So as far as the browser is concerned the images folder you’ve set to copy to the output dir, for example, and therefore is served from `/images/myimage.jpg`, hasn’t physically been copied to that location on your machine. That only happens during a production build.

Fine when you know but it’s a little confusing at first.

I’ve had to build a few production builds locally at times just to make sure my copy configs are set correctly.

3. **Plug-ins have a whole bunch of new hooks**

This is a big upgrade and I think will make integrating other tools way easier. 

I think it's backwards compatible. I’m looking forward to playing around with this more. 

4. **WebC components aren’t automatically discoverable within a project by default.**

I found this confusing.

Especially as most of my `.webc` components were simply returning HTML, I didn’t want to have to add a load of `webc:import` attributes per component.

Thankfully 11ty’s config system has you covered. 

Adding the following to your `.eleventy.js` file, and placing all your components within `/_includes/components` makes them usable throughout the entire project without individually importing them.

```
eleventyConfig.addPlugin(pluginWebc, {
    // Glob to find no-import global components
		components: "src/_includes/components/**/*.webc",
});
```

5. **Everything in project root by default**

I think this is right, and not just a mistake I made. But the default 11ty starter had everything configured to run from the project root.

Eg, `index.webc` was in the same root folder as `package.json` and other non web assets.

I didn’t like this. 

Again, 11ty config to the rescue, it’s super simple to tell 11ty where your input and output dirs should be. So it was quick get things how I wanted them.

```
return {
  dir: {
      input: "src",
      output: "_site"
    }
  }
```

It’d be great if the starter cli command could ask you where you’d like your source and output directories to be, and auto configure this for newbies like me. 


6. **Tailwind**

Tailwind works really well with a component based system, so 11ty and webc is no different, outputting only the css for classes that you’ve actually used in your pages.

To make that work better, I pointed tailwind config to the output folder _(`_site` in my case)_ to look for content, rather than the src directory, and made it run after 11ty prod build.

```
//tailwind.config.js
module.exports = {
  content: ['./_site/**/*.html'],
  plugins: [require('@tailwindcss/typography')]
}

```

This way any draft components I’ve built but not yet used, won’t have any of its unique classes included in the final production css output. Until they’re actually included in one of the html pages.

I also needed a way to allow component modification throughout the site (more so on Si Novi). To do that I used the Tailwind Merge [package](https://www.npmjs.com/package/tailwind-merge) and created a helper function within `.eleventy.js` that can be used on each component. 

```
eleventyConfig.addFilter("tailwindMerge", function(defaultClasses, overrideClasses) { 
  return twMerge(defaultClasses, overrideClasses)
});
```

This means I can pass in overriding css attributes at the point of using the component and the `twMerge` function (as it’s tailwind aware), replaces the defaults with the overrides.

Within a WebC component:

```
//link-primary.webc
<a :href="href" :class="tailwindMerge('underline hover:text-blue-500', this.class)"><slot></slot></a>
```

If I used this component, like so...

```
<link-primary class="hover:text-red-500">example link hovers red</link-primary>
```

... the hover on that instance of the component would be red. 



## Wrap up

I’m so glad I’ve found 11ty, it’s a great tool. Version 2.0 and WebC has made it sticky for me. 

I haven’t used any of the more advanced webc features such as scoped css or bundling, but I’m sure I’ll test them out in due course.

Absolutely great job. 

Keep an eye out for the next post in this series, which explains how to set up 11ty, AWS and GitHub actions to create a CI/CD build pipeline to deploy to S3. 

You can view the [source code of my site here](https://github.com/hicksy/martinhicks.dev).


---