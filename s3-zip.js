var s3Files = require('s3-files');
var archiver = require('archiver');


module.exports = s3Zip = {};

s3Zip.archive = function (opts, folder, files_s3, files_zip) {
  var self = this;
  var keyStream = s3Files
    .connect({
      region: opts.region,
      bucket: opts.bucket
    })
    .createKeyStream(folder, files_s3);

  var fileStream = s3Files.createFileStream(keyStream);
  var archive = self.archiveStream(fileStream, files_s3, files_zip);
  return archive;
};


s3Zip.archiveStream = function (stream, files_s3, files_zip) {
  var archive = archiver('zip');
  archive.on('error', function (err) {
    console.log('archive error', err);
    throw err;
  });
  stream
   .on('data', function (file) {
      // console.log(file.data.toString());
     if(file.path[file.path.length - 1] == '/'){
       console.log('don\'t append to zip', file.path);
       return;
     }
     var fname;
     if (files_zip) {
       // Place files_s3[i] into the archive as files_zip[i]
       var i = files_s3.indexOf(file.path);
       fname = (i >= 0 && i < files_zip.length) ? files_zip[i] : file.path;
     }
     else {
       // Just use the S3 file name
       fname = file.path;
     }
     console.log('append to zip', fname);
     archive.append(file.data, { name: fname });
   })
   .on('end', function () {
     console.log('end -> finalize');
     archive.finalize();
   });

  return archive;
};
