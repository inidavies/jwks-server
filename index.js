const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const PORT = 8080;
const app = express();
app.use(express.json());

// Define an array to store key pairs and their metadata
const keyPairs = [];

// generate a unique Key ID (kid)
function generateUniqueKeyID() {
    return uuidv4();
}

// check if a key has expired
function isKeyExpired(expiryTimestamp) {
    const currentTimestamp = new Date();
    return currentTimestamp > expiryTimestamp;
}

// Generate RSA key pair
function generateRSAKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048, // Key size (2048 bits is a common choice)
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });

    return { publicKey:publicKey, privateKey:privateKey };
};

function generateAccessToken(){
    const keyPair = generateRSAKeyPair();
    const kid = generateUniqueKeyID();

    // Set an expiry timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const expiryTimestamp = currentTimestamp + 600; // 600 seconds (10 minutes) from the current time
    const expiry = new Date(expiryTimestamp * 1000); // Convert to milliseconds

    const keyMetadata = {
        kid,
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
        expiry: expiry
    };
    
    keyPairs.push(keyMetadata);
}

app.get('/', (req, res) => {
    res.send(`Running on http://localhost:${PORT}`);
});

app.get('/.well-known/jwks.json', (req, res) => {
    // Filter and include only unexpired key pairs
    const validKeyPairs = keyPairs.filter(keyPair => !isKeyExpired(keyPair.expiry));

    // JWK (JSON Web Key) for public keys
    const jwks = {
        keys: validKeyPairs.map(keyPair => {
            return{
                kid: keyPair.kid,
                alg: 'RS256',
                kty: 'RSA',
                use: 'sig',
                n: keyPair.publicKey, // Public key modulus
                e: 'AQAB', // Exponent for RSA keys
            }
        })
    };

    res.status(200).json(jwks);
});

app.post('/auth', (req, res) => {
    const { expired } = req.query;

    const kid = req.body.kid || '1234'
    unexpiredKeyPair = keyPairs.find(keyPair => keyPair.kid === kid && !isKeyExpired(keyPair.expiry));

    // Find an unexpired key pair 
    //const unexpiredKeyPair = keyPairs.find(keyPair => !isKeyExpired(keyPair.expiry));

    if (!unexpiredKeyPair) {
        return res.status(404).json({ error: 'Invalid or expired key.' });
    }
    
    const username = req.body.username;
    const password = req.body.password;
    const user = { name:username, password:password}

    
    // Conditionally set the expiration time based on the "expired" query parameter
    let expirationTimestamp;

    if (expired === 'true') {
        // Use the key's expiration timestamp
        expirationTimestamp = Math.floor(unexpiredKeyPair.expiry.getTime() / 1000);
    } else {
        // Set a regular expiration time (10 minutes from now)
        const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
        expirationTimestamp = currentTimestamp + 600; // 600 seconds (10 minutes) from the current time
    }
    const options = {
        algorithm: 'RS256',
        expiresIn: '10m'
      };

    // Sign the JWT with the selected expiration timestamp and the private key
    const accessToken = jwt.sign(user, unexpiredKeyPair.privateKey, options);
    res.json(accessToken);
});

const server = app.listen(
    PORT,
    () => {
        generateAccessToken();
        console.log(`Running on http://localhost:${PORT}`)
    }
);