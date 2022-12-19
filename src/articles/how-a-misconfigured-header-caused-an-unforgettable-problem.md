---
title: "A mistake the internet won't forget easily"
description: "Someone fetch me the Men in Black, I need a Neuralyzer over here. How a misconfigured header has caused an unforgettable problem."
date: 2022-12-19
image: 
  path: /images/articles/men-in-black-neuralyzer.jpeg
  webp: /images/articles/men-in-black-neuralyzer.webp
  alt: The Neuralyzer in Men in Black
---
_**tldr**: If you visited my site between 2022-12-01 and 2022-12-18 you might not be seeing updated content on previously accessed pages. I've added a `Clear-Site-Data` header to this page to possibly rectify. If you don't see multiple blogs posts on the homepage after viewing this article, please manually refresh any page you previously visited - thank you_ 🙏

---

A couple of weeks or so ago, enthused by my move to [Mastodon](https://indieweb.social/@martinhicks), the growing desire of owning your own content post-Musk, and a upcoming New Year's resolution I'd made with myself to be "less mute" on the internet in 2023 - I decided to re-publish my website and start sharing my thoughts in longer form writing. 

Over the weekend _(hungover, after some pre-Christmas drinks the night before)_ I realised I'd made a BIG mistake with the website deployment mechanism - accidentally setting a long-term `cache-control` header for all resources, not just the immutable ones 🤦🏻‍♂️. 

Read on for what what caused the problem, how I've resolved it, the steps I've taken to mitigate it, and what I wish was possible to limit damage following a situation like this in the future. 


## Automatic deployments

I update this site using a [GitHub action](https://github.com/hicksy/martinhicks.net/blob/main/.github/workflows/deploy.yml){target="_blank" class="external"}; triggering a build of my static site and transferring the web assets over to AWS S3 where I statically host my website. 

It's within this S3 sync command that I made the galling mistake...

```
aws s3 sync ./_site s3://martinhicks.net --cache-control max-age=31536000 --delete --acl=public-read --follow-symlinks
```

If you're not familiar with the AWS S3 cli - this command transfers the directory `/_site` to the S3 bucket hosting this website. 

As you can see I use a number of CLI params:

- `--delete`: This tells the `s3 sync` command to delete any items that exist in the destination bucket, but aren't in the local source directory _(perfect for clearing up old, no-longer needed objects)_.

- `--acl=public-read`: Every object uploaded to the bucket has public read enabled - this being a public website, you need every asset to be available. Omitting this would prevent you from accessing the page, despite the bucket itself being public 

- `--follow-symlink`: I _think_ this is a default actually, but added it in just to make sure any content symlinked into that source directory was actually transferred

- `--cache-control`: The biggie, the doozy. 

Here I inform S3 to set the Cache-Control header - a header S3 will include when returning a request for each individual web asset - a html page, a css file, an image, a sitemap.xml... i.e. everything I've just synced. 

In haste I inadvertently set the `max-age` value to `31536000` - that's ONE YEAR - and I told S3 to do so for all my assets. Therefore for every request, S3 will return the header `cache-control: max-age=31536000`), which tells your web browser that it's allowed to cache the contents of the page you requested *_for up to one year._*  

## Why is this a problem - caching is good right?

So firstly, caching is great.

It's definitely the right thing to do. You'll improve the speed in which return visitors access your page(s), and you'll receive a better Page Speed Rank from Google, which is a [ranking factor on Google's search results](https://developers.google.com/search/blog/2010/04/using-site-speed-in-web-search-ranking). 

Using a CDN is even better - I do that here too with [AWS CloudFront](https://aws.amazon.com/cloudfront/) storing a cache on the edge, closer to where you're accessing the internet from. 

_eg: you live in London, someone else from London has already accessed this page, you then visit the same page, and the CDN will serve you from the edge cache - win for you as the page will load much faster, bonus for a webmaster as the origin server won't have to handle the request_

Anyway that's an aside. 

Here I'm taking about the `cache-control: max-age=31536000` header I was inadvertently serving. 

The issue with that header is the liberal use of it for all my assets. It's absolutely the correct header to return for anything immutable - images, css etc.

If you visit [my home page](https://martinhicks.net){target="_blank" class="external"}, you'll see that it has some changeable content - a list of latest blog posts that are updated when I publish a new article. So by setting this long-term cache on all web assets, I'd created a situation where the next time you visit my homepage you'd think I hadn't written any new content - you'd likely move on elsewhere - you most certainly wouldn't think; 

>I know - I'll hit refresh, just in case Martin has messed up his cache headers.  

I had an inkling something wasn't right during development, but given I'm an impatient soul, while my site was being synced with S3, in another tab I would be furiously hitting refresh to see the changes 

_hitting refresh clears the cache, and hid the problem_. It was only when I revisited a page on mobile (iOS Safari), that I realised older content was being served. 

## The correct way to cache content for a website 

If you've read this far, you might be interested in seeing a more sensible mechanism for caching content using the S3 sync command. 

I updated my GitHub action to make two separate calls to s3 sync. 

```
//long-lived cache for images and css
aws s3 sync ./_site s3://martinhicks.net --cache-control 'max-age=31536000' --delete --acl=public-read --follow-symlinks --exclude '*' --include 'images/*' --include 'css/*'

//no-cache on everything else
aws s3 sync ./_site s3://martinhicks.net --cache-control 'no-cache' --delete --acl=public-read --follow-symlinks --exclude 'images/*' --exclude 'css/*'
``` 

The first command ensures that my immutable content (images and css) are served with a year long `max-age`. Telling the browser that once you've received an image or a css file for the first time to cache it, and keep it in cache for up-to a year. _(i.e. your browser won't keep requesting it on subsequent pages, or reloads, over the internet. It'll serve that image from your local browser cache instead.)_

The key props to that are as follows:

- `--exclude '*'`: tell s3 sync to exclude every item in the source `_/site` directory _(nothing that isn't explicitly included will be transferred to S3)_
- `--include 'images/*'` & `--include 'css/*`: tell s3 sync to include anything within images and the css directory 

With the second pass of S3 sync, we invert that - excluding the `images` and `css` directories. This run will upload every web asset that isn't in the two excluded directories while setting a cache-control header of `no-cache` _(i.e. don't locally cache the HTML page in browser, re-request it from the CDN or origin as appropriate for every request)_


## Fixing the problem for returning visitors

Sadly, this isn't a problem that's easily fixed. 

First off, you need to hope anyone who accessed page content with a long cache header, will revisit your site to read something new you've written - this is the only way to set a new header after all, as the old content, say the index page, will have already been stored long-term in the returning-visitor's browsers cache. 

After studying MDN I found the `Clear-Site-Data` header, which is exactly what I need. 

[As MDN states](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Clear-Site-Data):

> The Clear-Site-Data header clears browsing data (cookies, storage, cache) associated with the requesting website. It allows web developers to have more control over the data stored by a client browser for their origins.

Great. So this article is being served with the following header. 

`Clear-Site-Data: "cache"`. 

Which I sincerely hope means your browser has now been [zapped by a Neuralyzer](https://meninblack.fandom.com/wiki/Neuralyzer) and forgotten any cached data it stored. *(If it hasn't, maybe you could humour me by giving the [homepage](https://martinhicks.net){target="_blank" class="external"} and [journal](https://martinhicks.net/articles){target="_blank" class="external"} page a refresh?)*

## Is there a better solution?

I'm currently only applying the `Clear-Site-Data` header to this page and really hoping / relying on some of the people that read my earlier articles might stumble upon this one? Which is probably unrealistic... 

It feels like I shouldn't apply this header on every new page I publish from this point forward - wouldn't that mean the browser will never cache any data? I guess I could include the header for a limited period on all html pages, but it still doesn't feel quite right. 

What I really wish is that there was a more deterministic header I could apply, say something like:

`Clear-Site-Data:  'cache' '2022-12-01:2022-12-19'`

Wouldn't it be handy to be able to say "clear this site cache if the item was stored between the following dates"? 

That way I'd be able to drop this header onto all future assets, and eventually anyone returning to my site will have the rogue cached pages cleared - without affecting the behaviour of anything cached before or after the incident date. 

_Disclaimer: I have no idea how the internals of a browser work. Maybe this is nonsense as the item in cache might just store its expires-at date, rather than the date it was accessed and originally stored?_ 

To be honest, I'm probably over analysing the problem. There's been very little inter-page navigation here - most people have followed a link to a specific article, read it and then moved on. But it's still bugging me... 

I'd be keen to hear from anyone who has any better ideas. Is there a more appropriate solution I could apply?

You can contact me at [https://indieweb.social/@martinhicks](https://indieweb.social/@martinhicks)
  

___