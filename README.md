# How to get started with token exchange

This repository guides you through a process of generating valid JWT tokens
so that they can be used in the token exchange flow on Karhoo sandbox environment.

## 1. Generating keys

Start with generating your private and public key pair.

The **private key** will be used to sign JWT tokens on your end. Make sure you keep your private key safe and store it in your vault.

The **public key** will be shared with Karhoo to verify issued tokens.

  ```bash
  mkdir keys

  # Generate keys in PEM format
  openssl genrsa -out keys/private.pem 2048
  openssl rsa -in keys/private.pem -pubout -out keys/public.pem

  # Generate PKCS#8 equivalent of the keys
  openssl pkcs8 -topk8 -inform PEM -outform DER -in keys/private.pem -out keys/private.der -nocrypt
  openssl rsa -in keys/private.pem -pubout -outform DER -out keys/public.der
  ```

## 2. Registering your app

In order to use the token exchange flow your application needs to be registered within
Karhoo auth server (corresponding client entry needs to be created within Karhoo’s auth server).
Moreover, your public key also needs to be registered and correlated with your app.

It is expected your public key is distributed
through a [JSON Web Key Set](https://tools.ietf.org/html/rfc7517) endpoint implemented by your backend
and the only thing you should be sharing is a JWKS endpoint URI.

```
curl --request GET --url http://your-api.example.com/jwks
{
  "keys": [{
    "alg":"RS256",
    "kid":"00001",
    "e":"AQAB",
    "n":"sZL2ud...SNvqQ",
    "kty":"RSA"
  }]
}
```

Unlike sharing a static `public.pem` file, this mechanism helps you rotate your keys
and reduces risk of public keys getting out of sync
with what has been initially registered within Karhoo auth service.

Having in mind implementing this endpoint may take a while, we prepared a tool which will help
you instantly publish your public key in the desired format for testing purposes:

```bash
docker run -d -p 8080:8080 \
    --name token-exchange \
    --volume $(pwd)/keys:/keys:ro \
    karhoo/token-exchange-quickstart

curl --request GET --url http://localhost:8080/jwks > jwks.json
```

Having a `jwks.json` file created you can now
host it on your servers as a static file or just share it with Karhoo
so that it can be registered as a valid verification key for your app.

## 3. Issuing tokens

It is time to start issuing tokens.
JWTs should have the following payload:

```
{
  "jti": "b961af11-462e-4685-bca6-c81bf8081cc4",  // Unique token identifier
  "aud": "https://sso.sandbox.karhoo.com/oauth/v2/token-exchange", // Audience
  "iss": "your-client-id",         // Client ID as registered within Karhoo auth service
  "sub": "ecc...f4b",              // The unique identifier of your user
  "iat": 1578068426,               // A timestamp when the token was issued  
  "exp": 1578068926,               // A timestamp when the token expires
  "given_name": "John",            // First name
  "family_name": "Doe",            // Last name
  "email": "john.doe@karhoo.com",  // Verified email
  "phone_number": "+15005550006",  // Verified phone number in E.164 format
  "locale": "en"   			           // End-User's locale (BCP47 [RFC5646] format)
}
```

and should be signed with your private key using `RS256` algorithm.

Since implementing this feature on your backend may take a while, we prepared a tool which will help
you instantly generate valid JWTs for testing purposes:

```bash
docker exec -ti token-exchange make jwt
```

```
Please provide your user details:
? User ID c1e30e2c-21b6-40c4-9228-9d940c99174e
? Given name John
? Family name Doe
? Email john.doe@example.com
? Phone number
? Locale en
? Your client ID your-app-id
eyJra...zRQ7Tn3A
```

You can now use the output of this command
as a valid token within Karhoo SDK:

```kotlin
/* Initializing SDK with your clientId */
KarhooUISDK.setConfiguration(object: KarhooUISDKConfiguration {
    // ...
    override fun environment() = KarhooEnvironment.Sandbox()
    override fun authenticationMethod() = AuthenticationMethod.TokenExchange(
        clientId = "your-app-id",
        scope = "openid profile email phone https://karhoo.com/traveller")
})

// ...

/* Authenticating with your token:
   https://developer.karhoo.com/reference#login-token */
KarhooApi.authService.login(token = "eyJra...zRQ7Tn3A").execute {
    when (it) {
        is Resource.Success -> { /* successful auth */ }
        is Resource.Failure -> { /* unsuccessful auth */ }
    }
}
```

## 4. Implementing it in your backend

Finally, once you have successfully authenticated a user in Karhoo SDK using the tokens you issued, check out the examples on how both the JWKS endpoint and token generation can be implemented in your code.
We have covered most popular technologies:

  - [Java](./java)
  - [Node](./node)
  - [Go](./go)
  - [Python](./python)
  - [Ruby](./ruby)

Each example is a console application which prints out
the following messages based on the keys you generated:

```
1) You've just generated your first JWT:

eyJraWQiOiIw...VdQN7NbwQ

  You can investigate its payload by copying it to https://jwt.io.

2) You should implement a JWKS endpoint (e.g. GET https://your-api.example.com/jwks) returing the following response:
{
  "keys": [
    {
      "alg": "RS256",
      "kid": "00001",
      "e": "AQAB",
      "n": "sZL2udyk54...bnfyUOKSNvqQ",
      "kty": "RSA"
    }
  ]
}
```
