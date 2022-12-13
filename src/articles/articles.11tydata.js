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
    date: data => dayjs(data.date).format("Do MMMM YYYY"),
    meta: {
      title: data => data.title,
      description: data => data.description
    }
  }
};