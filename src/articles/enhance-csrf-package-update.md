---
title: "Enhance CSRF package - now supports multipart form data"
description: "An update to my small CSRF middleware for Enhance projects - v0.9.0 introduces support for multipart formdata. "
date: 2023-05-15
image: 
  path: /images/articles/npm-logo.png
  webp: /images/articles/npm-logo.webp
  alt: NPM package manager logo - red text, on a white background, reads - NPM
  classoveride: "md:!mx-auto"

---

I've just published a minor update to my [CSRF plugin](https://www.npmjs.com/package/@hicksy/enhance-csrf) for [Enhance projects](https://enhance.dev). 

v0.9.0 now supports `multipart/form` data, meaning you can easily use the `<csrf-form></csrf-form>` component for forms that contain file uploads. 

_**usage:**_
```
<csrf-form method="post" action="/upload" enctype="multipart/form-data">
  <input type="file" name="file" />
</csrf-form>
```

_**outputs:**_
```
<form action="/si-novi/christopher-dee/media/upload" method="post" enctype="multipart/form-data">
  <input type="hidden" name="csrf" value="540c460e-946e-4c78-8c8d-63c4cd091ee9"> <!-- auto-generated hidden input with the unique csrf token for this request (use with verifyCsrfToken on your post handler) -->
  <input type="file" name="file">
</form>
```

Additionally, I've also improved the html generation for the component so you can now include all the following optional attributes and they'll pass-through into your HTML `<form>` element. 

```
enctype
target
acceptCharset,
autocomplete
id
novalidate
rel
```

Of course you can still use the standaone `<csrf-input></csrf-input>` if you'd prefer to use a standard form tag. 


### Get in touch 

Any feedback on your usage of this plugin, bugs, or suggestions for improvements please get in touch on [GitHub](https://github.com/hicksy/enhance-csrf). I'd love to hear from you. 

* GitHub: [https://github.com/hicksy/enhance-csrf](https://github.com/hicksy/enhance-csrf)
* NPM: [https://www.npmjs.com/package/@hicksy/enhance-csrf](https://www.npmjs.com/package/@hicksy/enhance-csrf)

___
