var s3Zip = require('../s3-zip.js')
var t = require('tap')
var fs = require('fs')
var Stream = require('stream')
var concat = require('concat-stream')
var join = require('path').join
var streamify = require('stream-array')
var archiverZipEncryptable = require('archiver-zip-encryptable')
var { exec } = require('child_process')

var fileStreamForFiles = function (files, preserveFolderPath) {
  var rs = new Stream()
  rs.readable = true

  var fileCounter = 0
  streamify(files).on('data', function (file) {
    fileCounter += 1

    var fileStream = fs.createReadStream(join(__dirname, file))
    fileStream.pipe(
      concat(function buffersEmit (buffer) {
        // console.log('buffers concatenated, emit data for ', file);
        var path = preserveFolderPath ? file : file.replace(/^.*[\\/]/, '')
        rs.emit('data', { data: buffer, path: path })
      })
    )
    fileStream.on('end', function () {
      fileCounter -= 1
      if (fileCounter < 1) {
        // console.log('all files processed, emit end');
        rs.emit('end')
      }
    })
  })
  return rs
}

var file1 = 'a/file.txt'
var file2 = 'b/file.txt'
var sinon = require('sinon')
var proxyquire = require('proxyquire')
var s3Stub = fileStreamForFiles(
  ['/fixtures/folder/a/file.txt', '/fixtures/folder/b/file.txt'],
  true
)
s3Zip = proxyquire('../s3-zip.js', {
  's3-files': { createFileStream: sinon.stub().returns(s3Stub) }
})

t.test('test archive password protected', async child => {
  var outputPath = join(__dirname, '/test-password-protected.zip')
  var output = fs.createWriteStream(outputPath)

  await s3Zip
    .setRegisterFormatOptions('zip-encryptable', archiverZipEncryptable)
    .setFormat('zip-encryptable')
    .setArchiverOptions({
      zlib: { level: 8 },
      forceLocalTime: true,
      password: 'test'
    })
    .archive({ region: 'region', bucket: 'bucket' }, '/fixtures/folder/', [
      file1,
      file2
    ])
    .pipe(output)
    .on('finish', async () => {
      exec(
        `unzip -P test ${outputPath} -d ${outputPath}/../testUnzipped/`,
        () => {
          if (
            fs.existsSync(
              `${outputPath}/../testUnzipped/fixtures/folder/a/file.txt`
            )
          ) {
            child.ok(true, 'file exist after unzip')
          }
        }
      )
    })
})
