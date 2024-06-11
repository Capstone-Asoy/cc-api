const { Firestore } = require('@google-cloud/firestore')

const firestore = new Firestore({
  projectId: 'capstone-424620',
  keyFilename: './service.json', 
});

async function storeData(id, data) {
  const recommendations = firestore.collection('users')
  return recommendations.doc(id).set(data)
}

async function getData(id, res) {
  const getRecommendations = firestore.collection('users')
  return getRecommendations.doc(id).get()
}

module.exports = {storeData, getData}
