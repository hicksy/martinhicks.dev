const dayjs = require('dayjs')
const ukLocale = require('dayjs/locale/en-gb')
const advancedFormat = require('dayjs/plugin/advancedFormat')
dayjs.extend(advancedFormat)
dayjs.locale(ukLocale)

module.exports = {
  layout: "layouts/article.webc",
  tags: [
    "articles"
  ],
  eleventyComputed: {
    date: data => dayjs(data.page.date).format("Do MMMM YYYY"),
    title: data => data.title,
    description: data => data.description,
    image: data => data.image, 
    url: data => data.page.url,
    meta: {
      title: data => data.title,
      description: data => data.description
    }
  }
};