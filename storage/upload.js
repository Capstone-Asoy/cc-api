const { Storage } = require('@google-cloud/storage');
const path = require('path');

const keyFilename = path.join(__dirname, '../service.json');
const bucketName = 'ann-user';

const storage = new Storage({ keyFilename });
const bucket = storage.bucket(bucketName);

module.exports = bucket;
