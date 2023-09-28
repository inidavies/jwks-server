const request = require('supertest');
const { app, server } = require('../index');

// Close the server after all tests have finished
afterAll((done) => {
    server.close(done);
});

describe('Server', () => {
    describe('GET /', () => {
        it('should run on port 8080 and respond with message', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(200); 
            expect(response.text).toContain('Running on http://localhost:8080');
        });
    });
    describe('GET /keyPair', () => {
        it('should create a new key pair', async () => {
            const response = await request(app).get('/keyPair');
            console.log(response.status);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('kid');
        });
    });
    describe('GET /jwks', () => {
        it('should respond with valid JWKS', async () => {
            const response = await request(app).get('/jwks');
            expect(response.status).toBe(200);
            expect(response.body.keys).toBeInstanceOf(Array);;
        });
    });
    describe('POST /auth', () => {
        it('should authenticate and generate a token', async () => {
            const response = await request(app).post('/auth');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });
    });
});
