# s3-zip

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]


Download selected files from an Amazon S3 bucket as a zip file.



## Install

```
npm install s3-zip
```


## AWS Configuration

Refer to the [AWS SDK][aws-sdk-url] for authenticating to AWS prior to using this plugin.



## Usage

```javascript

var s3Zip = require('s3-zip');
var fs = require('fs');

var region = 'bucket-region';
var bucket = 'name-of-s3-bucket';
var folder = 'name-of-bucket-folder/';
var file1 = 'Image A.png';
var file2 = 'Image B.png';
var file3 = 'Image C.png';
var file4 = 'Image D.png';

var output = fs.createWriteStream(__dirname + '/use-s3-zip.zip');

s3Zip
  .archive({ region: region, bucket: bucket}, folder, [file1, file2, file3, file4])
  .pipe(output);

```


## Testing

Tests are written in Node Tap, run them like this:

```
npm t
```

If you would like a more fancy report: 

```
npm test -- --cov --coverage-report=lcov
```




[aws-sdk-url]: http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
[npm-badge]: https://badge.fury.io/js/s3-zip.svg
[npm-url]: https://badge.fury.io/js/s3-zip
[travis-badge]: https://travis-ci.org/orangewise/s3-zip.svg?branch=master
[travis-url]: https://travis-ci.org/orangewise/s3-zip
[coveralls-badge]: https://coveralls.io/repos/github/orangewise/s3-zip/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/orangewise/s3-zip?branch=master

