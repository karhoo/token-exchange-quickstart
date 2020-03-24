# How to get started with token exchange

This tutorial guides you through a process of integrating your external authentication system with the Karhoo platform.

If you are not familiar with the token exchange flow we advise you to read the [Token Exchange section of our API Reference](https://developer.karhoo.com/reference#token-exchange) before continuing.

This guide focuses on issuing JWT tokens as a proof of users being authenticated within your authentication system. Issued tokens will be used to authenticate with the Karhoo Platform on behalf of your users.

## 1. Generating keys

Let's start by generating your private and public key pair.

The **private key** will be used to sign JWT tokens on your end. Make sure you keep your private key safe and store it in your vault.

The **public key** will be shared with Karhoo to verify issued tokens.

```bash
mkdir keys

# Generate keys in PEM format
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Generate PKCS#8 equivalent of the keys. It is needed just for Java implementation in examples
openssl pkcs8 -topk8 -inform PEM -outform DER -in keys/private.pem -out keys/private.der -nocrypt
openssl rsa -in keys/private.pem -pubout -outform DER -out keys/public.der
```

## 2. Registering your app

In order to use the token exchange flow your application needs to be registered within Karhoo auth server (corresponding client entry needs to be created within Karhoo’s auth server). Moreover, your public key needs to be correlated with your app and registered as a valid token verification key.

It is expected your public key is distributed through a [JSON Web Key Set](https://tools.ietf.org/html/rfc7517) endpoint implemented by your backend and the only thing that should be shared with Karhoo is the JWKS endpoint URI.

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

Unlike sharing a static `public.pem` file, this mechanism helps you rotate your keys and reduces the risk of public keys getting out of sync with what has been initially registered within Karhoo auth service.

Having in mind implementing this endpoint may take a while, we prepared a tool which helps
you instantly publish your public key in the desired format for testing purposes:

```bash
docker run -d -p 8080:8080 \
    --name token-exchange \
    --volume $(pwd)/keys:/keys:ro \
    karhoo/token-exchange-quickstart

curl --request GET --url http://localhost:8080/jwks > jwks.json
```

You can now distribute the generated `jwks.json` file by either:
- hosting it on your servers as a static file
- sharing it directly with Karhoo

This will speed things up with registering your public key as a valid verification key for your app.
Once it is done you will be provided with a `client_id` uniquely identifying your application in the Karhoo platform.

## 3. Issuing tokens

It is time to start issuing tokens. JWTs should have the following payload:

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
  "locale": "en"                   // End-User's locale (BCP47 [RFC5646] format)
}
```

and should be signed with your private key using `RS256` algorithm.

Since implementing this feature on your backend may take a while, we prepared a tool which will help you instantly generate valid JWTs for testing purposes:

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

You can now use the output of this command as a valid token within Karhoo SDK:

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

It is also possible to authenticate with issued tokens using [the token exchange endpoint directly from our API explorer](https://developer.karhoo.com/reference#post_oauth-v2-token-exchange).

**NOTE: Issuing tokens by developers**

  Please bear in mind that make jwt command uses keys stored on your local computer. In order to make it work for other developers you need to share your keys and instruct them to use the full command chain:

  ```
  docker run -d -p 8080:8080 \
      --name token-exchange \
      --volume ~/shared-keys/public.pem:/keys/public.pem:ro \
      --volume ~/shared-keys/private.pem:/keys/private.pem:ro \
      karhoo/token-exchange-quickstart
  docker exec -ti token-exchange make jwt
  ```

## 4. Implementing it in your backend

Finally, once you have successfully authenticated a user using Karhoo SDK and the tokens you issued, check out the examples on how both the JWKS endpoint and token generation can be implemented in your code.

We have covered most popular technologies:

  - [Java](https://github.com/karhoo/token-exchange-quickstart/tree/master/java)
  - [Node](https://github.com/karhoo/token-exchange-quickstart/tree/master/node)
  - [Go](https://github.com/karhoo/token-exchange-quickstart/tree/master/go)
  - [Python](https://github.com/karhoo/token-exchange-quickstart/tree/master/python)
  - [Ruby](https://github.com/karhoo/token-exchange-quickstart/tree/master/ruby)

Each example implements a console application able to:
- issue a sample JWT token
- print your public key in the desired format (JWK)

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
