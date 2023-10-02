const request = require('supertest');
const { app, server, UnExpiredKeyPairs, ExpiredKeyPairs, initializeKeyPairs, generateKeyKid, getExpiredJWT, generateRSAKeyPair, getUnexpiredJWT} = require('../index');
const jwt = require('jsonwebtoken');

// Close the server after all tests have finished
afterAll((done) => {
    server.close(done);
});

describe('Server', () => {
    describe('initializeKeyPairs', () => {
        it('should initialize two sets of keyPairs', async () => {
            initializeKeyPairs();
            expect(Object.keys(UnExpiredKeyPairs).length).toBeGreaterThan(0);
            expect(Object.keys(ExpiredKeyPairs).length).toBeGreaterThan(0);
        });
    });
    describe('Kid Generation', () => {
        it('should generate kid using uuidv4', async () => {
            const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            let kid = generateKeyKid();
            expect(uuidPattern.test(kid)).toBe(true);
        });
    });
    describe('RSA Key Pair Generation', () => {
        it('should generate kid using uuidv4', async () => {
            let keyPair = generateRSAKeyPair();
            expect(keyPair).toHaveProperty('privateKey', 'publicKey', 'kid', 'expiry');
        });
    });
    describe('Expired JWT Generation', () => {
        it('should generate kid using uuidv4', async () => {
            // Mock the req object
            const req = {
                body: {
                    username: 'userABC',
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };
            
            // Spy on jwt.sign and provide a mock implementation
            const signSpy = jest.spyOn(jwt, 'sign').mockReturnValue('mocked-token');

            getExpiredJWT(res, req);
            // Verify that res.status was called with 200
            expect(res.status).toHaveBeenCalledWith(200);

            // Verify that jwt.sign was called with the expected user data and privateKey
            expect(signSpy).toHaveBeenCalledWith(
                {
                    username: 'userABC',
                    exp: expect.any(Number),
                },
                expect.any(String), // privateKey
                {
                    algorithm: 'RS256',
                    header: {
                        kid: expect.any(String), // kid
                    },
                }
            );

            // Verify that res.send was called with the generated token
            expect(res.send).toHaveBeenCalledWith(expect.any(String)); // token

        });
    });
    describe('Unexpired JWT Generation', () => {
        it('should generate kid using uuidv4', async () => {
            // Mock the req object
            const req = {
                body: {
                    username: 'userABC',
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };
            
            // Spy on jwt.sign and provide a mock implementation
            const signSpy = jest.spyOn(jwt, 'sign').mockReturnValue('mocked-token');

            getUnexpiredJWT(res, req);
            // Verify that res.status was called with 200
            expect(res.status).toHaveBeenCalledWith(200);

            // Verify that jwt.sign was called with the expected user data and privateKey
            expect(signSpy).toHaveBeenCalledWith(
                {
                    username: 'userABC',
                    exp: expect.any(Number),
                },
                expect.any(String), // privateKey
                {
                    algorithm: 'RS256',
                    header: {
                        kid: expect.any(String), // kid
                    },
                }
            );

            // Verify that res.send was called with the generated token
            expect(res.send).toHaveBeenCalledWith(expect.any(String)); // token

        });
    });
    describe('GET /.well-known/jwks.json', () => {
        it('should respond with valid JWKS', async () => {
            const response = await request(app).get('/.well-known/jwks.json');
            expect(response.status).toBe(200);
            expect(response.body.keys).toBeInstanceOf(Array);
        });
    });
    describe('POST /auth', () => {
        it('should authenticate and generate a token', async () => {
            const response = await request(app).post('/auth');
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });
    });
});
