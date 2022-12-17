# Website

## Tech 

- Eleventy (using webc)
- S3 hosted website
- Cloudfront
- Lamda@Edge 
- CloudFront Functions 
- Github action to deploy
    - publish to S3
    - check for broken links
    - invalidate cloudfront cache
    - run lighthouse scan

## Dev

`npm start` 
open browser at `http://localhost:8080`

## Production release

Pull-request / merge to the main branch for deploy
