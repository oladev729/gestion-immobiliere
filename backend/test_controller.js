const visiteurController = require('./src/controllers/visiteurController');
const req = {
  body: {
    nom: 'Test',
    prenoms: 'Tester',
    email: 'test@example.com',
    telephone: '123456',
    message: 'Hello'
  }
};
const res = {
  status: (code) => {
    console.log('Status set to:', code);
    return res;
  },
  json: (data) => {
    console.log('JSON response:', data);
    return res;
  }
};

visiteurController.demandeInscription(req, res)
  .then(() => console.log('Done'))
  .catch(err => console.error('Caught error:', err));
