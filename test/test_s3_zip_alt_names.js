// Test s3-zip BUT using alternate file names in the resulting zip archive

var s3Zip = require('../s3-zip.js');
var t = require('tap');
var fs = require('fs');
var Stream = require('stream');
var concat = require('concat-stream');
var yauzl = require('yauzl');

var fileStream = function (file, forceError) {
  var rs = new Stream();
  rs.readable = true;
  var fileStream = fs.createReadStream(__dirname + file);
  fileStream
    .pipe(concat(
      function buffersEmit (buffer) {
        if (forceError) {
          console.log('send end to finalize archive');
          rs.emit('end');
        } else {
          rs.emit('data', { data: buffer, path: file });
        }
      })
    );
  fileStream
    .on('end', function () {
      console.log('end fileStream');
      rs.emit('end');
    });
  return rs;
};


var file1 = '/fixtures/file.txt';
var file1_alt = 'FILE_ALT.TXT';
// Stub: var fileStream = s3Files.createFileStream(keyStream);
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var s3Stub = fileStream(file1);
s3Zip = proxyquire('../s3-zip.js', {
  's3-files': { 'createFileStream': sinon.stub().returns(s3Stub) }
});


t.test('test archiveStream and zip file with alternate file name in zip archive', function (child) {
  var output = fs.createWriteStream(__dirname + '/test_alt.zip');
  var s = fileStream(file1);
  var archive = s3Zip
    .archiveStream(s, [file1], [file1_alt])
    .pipe(output);
  archive.on('close', function () {
    console.log('+++++++++++');
    yauzl.open(__dirname + '/test_alt.zip', function (err, zip) {
      if (err) console.log('err', err);
      zip.on('entry', function (entry) {
        // console.log(entry);
        child.same(entry.fileName, file1_alt);
        child.same(entry.compressedSize, 11);
        child.same(entry.uncompressedSize, 20);
      });

      zip.on('close', function () {
        child.end();
      });
    });
  });
  child.type(archive, 'object');
});

// t.test('test archiveStream error', function (child) {
//   var s = fileStream(file1, true);
//   var a = s3Zip.archiveStream(s);
//   a.on('error', function (e) {
//     child.equal(e.message, 'finalize: archive already finalizing');
//     child.end();
//   });
// });


t.test('test archive with alternate zip archive names', function (child) {
  var archive = s3Zip
    .archive({ region: 'region', bucket: 'bucket' },
      'folder',
      [file1],
      [file1_alt]
    );
  child.type(archive, 'object');
  child.end();
});
