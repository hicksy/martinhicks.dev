const pluginWebc = require("@11ty/eleventy-plugin-webc");
const dayjs = require("dayjs");
const { twMerge } = require('tailwind-merge')

module.exports = function (eleventyConfig) {
  
  eleventyConfig.addPlugin(pluginWebc, {
    // Glob to find no-import global components
		components: "src/_includes/components/**/*.webc",
  });

  eleventyConfig.addPassthroughCopy({
    "src/images": "images",
    "src/favicons/**.*": "/",
    "src/robots.txt": "robots.txt"
  });



  eleventyConfig.addFilter("tailwindMerge", function(defaultClasses, overrideClasses) { 
    return twMerge(defaultClasses, overrideClasses)
  });

  eleventyConfig.addFilter("bust", (url) => {
      const [urlPart, paramPart] = url.split("?");
      const params = new URLSearchParams(paramPart || "");
      params.set("v", Date.now());
      return `${urlPart}?${params}`;
  });

  eleventyConfig.addFilter("dump", (obj) => {
    return JSON.stringify(obj)
  });

  eleventyConfig.addFilter("toISO", (_date) => {
    return dayjs(_date).toISOString();
  })

  eleventyConfig.addFilter("webpageJsonLd", (obj) => {
    console.log(obj)
    let jsonLd = {
      "@context":"http://schema.org",
      "@type": "WebPage",
      "@id": `https://martinhicks.net${obj.page.url}`,
      "name": obj.meta.title,
      "description": obj.meta.description,
      "publisher": {
          "@type": "Person",
          "@id": "martin-person"
      }
    }

    return JSON.stringify(jsonLd)

  })

  eleventyConfig.addFilter("pageTitle", (title, siteTitle) => {
    if(title === siteTitle) {
      return title
    }

    return `${title} | ${siteTitle}`
  })

  eleventyConfig.addUrlTransform(({url}) => {
    return url.replace(/\/$/, '')
  });

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  }
}