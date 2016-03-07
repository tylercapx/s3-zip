var s3Files = require('s3-files');
var archiver = require('archiver');


module.exports = s3Zip = {};



s3Zip.archive = function (opts, folder, files) {
  var self = this;
  var keyStream = s3Files
    .connect({
      region: opts.region,
      bucket: opts.bucket    
    })
    .createKeyStream(folder, files);

  var fileStream = s3Files.createFileStream(keyStream);
  var archive = self.archiveStream(fileStream);
  return archive;
};


s3Zip.archiveStream = function (stream) {
  var archive = archiver('zip');
  archive.on('error', function (err) {
    console.log('archive error', err);
    return null;
  });
  stream
   .on('data', function (file) {
      // console.log(file.data.toString());
      console.log('append to zip', file.path);
      // archive.append(file, { name: 'x.png' });
      archive.append(file.data, { name: file.path });
    })
   .on('end', function () {
      console.log('end -> finalize');
      archive.finalize();
    });

  return archive;
};