# Using s3-zip in combination with AWS Lambda

## Create a lambda function

```javascript
const AWS = require('aws-sdk');
const s3Zip = require('s3-zip');

exports.handler = function (event, context) {
    console.log('event', event);

    const region = event.region;
    const bucket = event.bucket;
    const folder = event.folder;
    const files = event.files;
    const zipFileName = event.zipFileName;
    const fileNameMap = event.fileNameMap;

    // Create body stream
    try {
        const body = s3Zip.archive({ region: region, bucket: bucket }, folder, files, null, fileNameMap);
        const zipParams = { params: { Bucket: bucket, Key: folder + zipFileName } };
        const zipFile = new AWS.S3(zipParams);
        zipFile
            .upload({ Body: body })
            .on('httpUploadProgress', function (evt) {
                console.log(evt);
            })
            .send(function (e, r) {
                if (e) {
                    const err = 'zipFile.upload error ' + e;
                    console.log(err);
                    context.fail(err);
                }
                console.log(r);
                context.succeed(r);
            });
    } catch (e) {
        const err = 'catched error: ' + e;
        console.log(err);
        context.fail(err);
    }
};
```

## Invoke the function

```javascript
const AWS = require('aws-sdk');

const region = 'bucket-region';
const bucket = 'name-of-s3-bucket';
const folder = 'name-of-bucket-folder/';
const file1 = 'Image A.png';
const file2 = 'Image B.png';
const file3 = 'Image C.png';
const file4 = 'Image D.png';
const fileNameMap = {
  [file1]: 'New Image Name A.png';
  [file2]: 'New Image Name B.png';
  [file3]: 'New Image Name C.png';
  [file4]: 'New Image Name D.png';
}

AWS.config.update({
    region: region,
});

const lambda = new AWS.Lambda();

const files = [file1, file2, file3, file4];
const payload = JSON.stringify({
    region: region,
    bucket: bucket,
    folder: folder,
    files: files,
    fileNameMap: fileNameMap,
    zipFileName: 'bla.zip',
});

const params = {
    FunctionName: 'NAME_OF_YOUR_LAMBDA_FUNCTION',
    Payload: payload,
};

lambda.invoke(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data); // successful response
});
```
