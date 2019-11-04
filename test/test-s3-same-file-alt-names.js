// Test s3-zip BUT using alternate file names for the same file which is listed multiple times

var s3Zip = require('../s3-zip.js')
var t = require('tap')
var fs = require('fs')
var Stream = require('stream')
var concat = require('concat-stream')
var join = require('path').join
var streamify = require('stream-array')
var tar = require('tar')

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

var inputFiles = [
  '/fixtures/folder/a/file.txt',
  '/fixtures/folder/a/file.txt'
]
var outputFiles = [
  'FILE_1_ALT_1.TXT',
  'FILE_1_ALT_2.TXT'
]
var filesRead = []

t.test('test a tar archive with alternate names for one file listed many times', function (child) {
  var outputPath = join(__dirname, '/test-same_file_alt_name.tar')
  var output = fs.createWriteStream(outputPath)
  var archive = s3Zip
    .setFormat('tar')
    .archiveStream(fileStreamForFiles(inputFiles, true), inputFiles, outputFiles)
    .pipe(output)

  archive.on('close', function () {
    fs.createReadStream(outputPath)
      .pipe(tar.list())
      .on('entry', function (entry) {
        filesRead.push(entry.path)
      })
      .on('end', function () {
        child.same(filesRead, outputFiles)
        child.end()
      })
  })
})

t.test('test archive with alternate names for one file listed many times', function (child) {
  var archive = s3Zip
    .archive({ region: 'region', bucket: 'bucket' },
      '',
      inputFiles,
      outputFiles.map(file => {
        return { name: file }
      })
    )

  child.type(archive, 'object')
  child.end()
})
