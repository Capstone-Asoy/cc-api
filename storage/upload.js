const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Ganti dengan path ke key file JSON yang Anda unduh dari GCS
const keyFilename = path.join(__dirname, '../service.json');
const bucketName = 'pp-user';

const storage = new Storage({ keyFilename });
const bucket = storage.bucket(bucketName);

module.exports = bucket;
