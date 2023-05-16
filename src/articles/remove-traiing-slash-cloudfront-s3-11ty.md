---
title: "Remove trailing slash on 11ty S3 hosted sites using Cloudfront function"
description: "How to rewrite the Cloudfront request so trailing slashes are redirected to the non-trailing slash URI using a Cloudfront function."
date: 2023-05-16
image: 
  path: /images/articles/11ty-logo.png
  webp: /images/articles/11ty-logo.webp
  alt: NPM package manager logo - red text, on a white background, reads - NPM

---

### Intro

This article will walk through the steps required to create a Cloudfront function to handle redirecting trailing slash URIs to non-trailing slash equivelants on your S3 hosted 11ty website.  

### Background 
Several years ago we published our website at Si Novi using a hand-balled static site generator we built for ourselves, and deployed it to S3 with Cloudfront used for caching and routing our A record from Route 53. 

For this old website we wanted to strip trailing slashes on URLs, so `https://example.com/articles/some-article` instead of `https://example.com/articles/some-article/`, peronsal preference I guess. 

Anyway, to achieve this [we used a Lamda@Edge function to handle the redirects](https://sinovi.uk/articles/static-website-url-optimisation-with-aws-serverless) for us - 301 redirecting from the trailing slash URI to the non-trailing slash URI - something we'd long achieved using `.htaccess` on an Apache server. 

We published this function to the [AWS Serverless Application Repository](https://serverlessrepo.aws.amazon.com/applications/us-east-1/951661612909/LambdaEdgeRemoveTrailingSlash). 

Fast forward a few years, and we now publish our website using [Eleventy](https://11ty.dev) - still hosted on S3, still fronted with the Cloudfront CDN, but our long-standing redirect function no longer worked. 

With 11ty we were hitting a redirect loop which we believe was due to it's use of subfolder index.html pages - our old hand-balled system created S3 objects like `articles/some-article.html` whereas Eleventy creates S3 objects like `articles/some-article/index.html`. The the old system resolved to the object correctly, whereas when using sub-directory within an `index.html` as 11ty and others do, this caused an infinte redirect loop.

### Solution

#### 1. Create a new CloudFront function


```
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    var params = '';
    if(('querystring' in request) && (request.querystring.length > 0)) {
        params = '?'+request.querystring;
    }
    
    if(uri.endsWith('/')) {
        if(uri !== '/') {
            var response = {
                statusCode: 301,
                statusDescription: 'Permanently moved',
                headers:
                { "location": { "value": `${uri.slice(0, -1) + params}` } } // remove trailing slash
            }
    
            return response;    
        }
        
        
    }
    //Check whether the URI is missing a file extension.
    else if (!uri.includes('.')) {
        request.uri += '/index.html';
    }
    
    

    return request;
}
```

The above code achieves the same trailig slash removal as we had in our old Lambda@Edge function, but also includes an additional check to ensure that `index.html` is appended to any requests on their way to S3 (only if the request doesn't already include '.', so `image/some-image.png` will pass-through just fine ). 

#### 2. Publish the function

Save and publish your newly created function, in this example I've named it `subfolder-index`

#### 3. Configure your Cloudfront distribution to route requests through the function 

Modify your Cloudfront distribution's behaviour and set the published function to run on Viewer request.

![A screenshot demonstrating how to select the Cloudfront function as a Viewer request](https://user-images.githubusercontent.com/785770/238600396-4f76d03c-f29c-4554-b711-b60709ed96ee.png)



### Wrap up

That's it, you should now be seeing URLs redirected to your non-trailing slash URI preference, while still successfully serving the subfolder index.html file (which wont appear in the URL)

One benefit of using a Cloudfront function is it's cheaper to invoke than a Lambda@Edge function.

You can see our old [Lambda@Edge function here](https://github.com/sinovi/lambda-edge-remove-trailing-slash), which still might be useful. 

_ps:  If you're not hosting subfolder `index.html` files you can remove the else if from the Cloudfront function._

___
