const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
const PORT = 8080;

// Array of keypairs
const UnExpiredKeyPairs = {};
const ExpiredKeyPairs = {};

// Generate keypair with expiry date
function generateRSAKeyPair(isExpired) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });

    let expiry;
    if (isExpired) {
        expiry = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    } else {
        expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    }

    const kid = generateKeyKid();

    const keyPair = {
        privateKey,
        publicKey,
        kid,
        expiry: expiry,
    };

    if (isExpired) {
        ExpiredKeyPairs[kid] = keyPair;
    } else {
        UnExpiredKeyPairs[kid] = keyPair;
    }

    return keyPair;
}


// Generate kid using uuidv4
function generateKeyKid() {
    return uuidv4();
}

function getUnexpiredJWT(res, req) {

    const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    try {
        username = JSON.parse(req.body.username);
    } catch (error) {
        username = 'userABC';
    }

    const user = {
        username: username,
        exp: Math.floor(expirationTime / 1000),
    };

    const kid = Object.keys(UnExpiredKeyPairs)[0];

    const token = jwt.sign(user, UnExpiredKeyPairs[kid].privateKey, {
        algorithm: 'RS256',
        header:{
            kid: kid,
        },
    });

    res.status(200).send(token);
}

function getExpiredJWT(res, req) {
    const expirationTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

    try {
        username = JSON.parse(req.body.username);
    } catch (error) {
        username = 'userABC';
    }

    const user = {
        username: username,
        exp: Math.floor(expirationTime / 1000),
    };

    const kid = Object.keys(ExpiredKeyPairs)[0];

    const token = jwt.sign(user, ExpiredKeyPairs[kid].privateKey, {
        algorithm: 'RS256',
        header: {
            kid: kid,
        },
    });

    res.status(200).send(token);
}

app.post('/auth', (req, res) =>{
    if (req.query.expired) {
        getExpiredJWT(res, req); // if expired is true, return expired token
    } else {
        getUnexpiredJWT(res, req);
    }
});

app.get('/.well-known/jwks.json', (req, res) =>{
    //returns only unexpired key pairs
    const validKeyPairs = [];
    for (const kid in UnExpiredKeyPairs) {
        if (Object.hasOwnProperty.call(UnExpiredKeyPairs, kid)) {
            const key = UnExpiredKeyPairs[kid];
            validKeyPairs.push({
                kid: kid,
                alg: 'RS256',
                kty: 'RSA',
                use: 'sig',
                n: Buffer.from(key.publicKey, 'binary').toString('base64'),
                e: 'AQAB',
            });
        }
    }

    const jwks = { keys: validKeyPairs };
    const jwksJsonKeys = JSON.stringify(jwks);

    res.status(200).json(JSON.parse(jwksJsonKeys));
});

function initializeKeyPairs() {
    generateRSAKeyPair(false);
    generateRSAKeyPair(true);
}

const server = app.listen(PORT, () => {
    // Initialize with 2 sets of key pairs
    initializeKeyPairs();
    console.log(`Running on http://localhost:${PORT}`);
});

// Export both app and server for testing purposes
module.exports = { app, server, UnExpiredKeyPairs, ExpiredKeyPairs, initializeKeyPairs, generateKeyKid, getExpiredJWT, generateRSAKeyPair, getUnexpiredJWT };
