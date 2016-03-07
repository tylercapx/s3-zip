var s3Zip = require('../s3-zip.js');
var t = require('tap');
var fs = require('fs');
var Stream = require('stream');
var concat = require('concat-stream');

var fs = require('fs');
var yauzl = require('yauzl');

var fileStream = function (file, forceError) {
  var rs = new Stream();
  rs.readable = true;
  var fileStream = fs.createReadStream(__dirname + file);
  fileStream
    .pipe(concat( function buffersEmit(buffer) {
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
// Stub: var fileStream = s3Files.createFileStream(keyStream);
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var s3Stub = fileStream(file1);
var s3Zip = proxyquire('../s3-zip.js', {
  's3-files': { 'createFileStream': sinon.stub().returns(s3Stub) }
});


t.test('test archiveStream and zip file', function (child) {
  var output = fs.createWriteStream(__dirname + '/test.zip');
  var s = fileStream(file1);
  var archive = s3Zip
    .archiveStream(s)
    .pipe(output);
  archive.on('close', function () {
    console.log('+++++++++++');
    yauzl.open(__dirname + '/test.zip', function(err, zip) {
      if (err) console.log('err', err);
        zip.on('entry', function(entry) {
          // console.log(entry);
          child.same(entry.fileName, 'fixtures/file.txt');
          child.same(entry.compressedSize, 11);
          child.same(entry.uncompressedSize, 20);
        });

        zip.on('close', function() {
          child.end();
        });
    });
  });
  child.type(archive, 'object');
});



t.test('test archiveStream error', function (child) {
  var s = fileStream(file1, true);
  var a = s3Zip.archiveStream(s);
  a.on('error', function (e) {
    child.equal(e.message, 'finalize: archive already finalizing');
    child.end();
  });
});


t.test('test archive', function (child) {
  var archive = s3Zip
    .archive({ 
        region: 'region', 
        bucket: 'bucket'
      }, 
      'folder', 
      [file1]
    );
  child.type(archive, 'object');
  child.end();
});

