const request = require('supertest');
const { app, server } = require('../server');

afterAll((done) => {
    // Close the server after all tests are finished
    server.close(done);
});

describe('GET /keyPair', () => {
    it('should return a valid key pair with a unique kid', async () => {
        const response = await request(app)
            .get('/keyPair')
            .expect(200);
    });
});
/**
describe('GET /jwks', () => {
    it('should return a valid key pair with a unique kid', async () => {
        const response = await request(app)
            .get('/keyPair')
            .expect(200);

        // Add assertions to validate the key pair response
    });
    it('should return a valid JWKS response with unexpired keys', async () => {
        // Prepare the keyPairs array with unexpired keys

        const response = await request(app)
            .get('/jwks')
            .expect(200);

        // Add assertions to validate the JWKS response
    });

    it('should return an empty JWKS response when all keys are expired', async () => {
        // Prepare the keyPairs array with expired keys

        const response = await request(app)
            .get('/jwks')
            .expect(200);

        // Add assertions to validate the empty JWKS response
    });

    it('should handle errors gracefully, e.g., when there are no keys available', async () => {
        // Clear the keyPairs arraya

        const response = await request(app)
            .get('/jwks')
            .expect(500);

        // Add assertions to validate the error response
    });
});

describe('POST /auth', () => {
    it('should return a valid key pair with a unique kid', async () => {
        const response = await request(app)
            .get('/keyPair')
            .expect(200);

        // Add assertions to validate the key pair response
    });
    it('should return a valid unexpired JWT by default', async () => {
        // Prepare the keyPairs array with unexpired keys

        const response = await request(app)
            .post('/auth')
            .expect(200);

        // Add assertions to validate the JWT response
    });

    it('should return a JWT signed with an expired key when "expired" query parameter is set', async () => {
        // Prepare the keyPairs array with both expired and unexpired keys

        const response = await request(app)
            .post('/auth?expired=true')
            .expect(200);

        // Add assertions to validate the JWT response
    });

    it('should handle errors gracefully, e.g., when no unexpired keys are available', async () => {
        // Clear the keyPairs array

        const response = await request(app)
            .post('/auth')
            .expect(500);

        // Add assertions to validate the error response
    });
});
**/
