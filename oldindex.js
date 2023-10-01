const express = require('express');
const forge = require('node-forge');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 8080;
const Buffer = require('buffer').Buffer;

app.use(express.json());

// Define an array to store key pairs and their metadata
const keyPairs = [];

// generate a unique Key ID (kid)
function generateUniqueKeyID() {
    //generate a random ID
    return Math.random().toString(36).substr(2, 10);
}

// check if a key has expired
function isKeyExpired(expiryTimestamp) {
    const currentTimestamp = new Date();
    return currentTimestamp > expiryTimestamp;
}

function generateKeyPair() {

    // Generate an RSA key pair with a key size of 2048 bits
    const keyPair = forge.pki.rsa.generateKeyPair(2048);

    // Export the keys in PEM format
    const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey);
    const publicKeyPem = forge.pki.publicKeyToPem(keyPair.publicKey);

    // Generate a unique Key ID (kid) for this key pair
    const kid = generateUniqueKeyID();

    // Set an expiry timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const expirationTimestamp = currentTimestamp + 600; // 600 seconds (10 minutes) from the current time
    const expiryTimestamp = new Date(expirationTimestamp * 1000); // Convert to milliseconds

    // Store the key pair and metadata
    const keyMetadata = {
        kid,
        privateKey: privateKeyPem,
        publicKey: publicKeyPem,
        expiryTimestamp,
    };

    keyPairs.push(keyMetadata);

    // Return the keys and metadata as a JSON response
    //return keyMetadata;
};

app.get('/jwks', (req, res) => {
    // Filter and include only unexpired key pairs
    const validKeyPairs = keyPairs.filter(keyPair => !isKeyExpired(keyPair.expiryTimestamp));

    // Create a JWKS-formatted response
    const jwksResponse = {
        keys: validKeyPairs.map(keyPair => {
            return {
                kid: keyPair.kid,
                alg: 'RS256',
                kty: 'RSA',
                use: 'sig',
                n: keyPair.publicKey,
                e: 'AQAB' // Exponent for RSA keys
            };
        })
    };

    res.status(200).json(jwksResponse);
});

app.get('/auth', (req, res) => {
    const { expired } = req.query;

    // Find an unexpired key pair 
    const unexpiredKeyPair = keyPairs.find(keyPair => !isKeyExpired(keyPair.expiryTimestamp));

    if (!unexpiredKeyPair) {
        return res.status(404).json({ error: 'No unexpired keys available.' });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds

    const payload = {
        username: 'userABC',
        password: 'password123',
    };
    
    /** Conditionally set the expiration time based on the "expired" query parameter
    if (expired === 'true') {
        // Use the key's expiration timestamp
        payload.exp = Math.floor(unexpiredKeyPair.expiryTimestamp.getTime() / 1000);
    }else{
        // Set the expiration time to 10 minutes from the current time
        payload.exp = currentTimestamp + 600;
    } **/

    // Sign the payload using the selected key pair's private key
    const token = jwt.sign(payload, unexpiredKeyPair.privateKey, { algorithm: 'RS256', header});
    

    console.log('Token:', token);
    // Verify the token with the public key
    jwt.verify(token, unexpiredKeyPair.publicKey, { algorithm:'RS256'}, (err, decoded) => {
        if (err) {
        console.error('JWT verification failed:', err.message);
        } else {
        console.log('JWT verification succeeded. Decoded:', decoded);
        }
    });
    
    res.status(200).json({ token });
});

app.get('/', (req, res) => {
    res.send(`Running on http://localhost:${PORT}`);
});

const server = app.listen(
    PORT,
    () => {
        generateKeyPair();
        console.log(`Running on http://localhost:${PORT}`)
    }
);

// Export both app and server for testing purposes
module.exports = { app, server };