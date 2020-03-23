# Token exchange tools

Prerequisites: Node 10+

## Running from sources

```bash
# Installing dependencies.
npm install

# Setting up location of the keys
export set PUBLIC_KEY_FILE=../keys/public.pem # default
export set PRIVATE_KEY_FILE=../keys/private.pem # default

# Running a server hosting the JWKS endpoint at http://localhost:8080/jwks
npm start

# Generating sample JWTs
make jwt
```
