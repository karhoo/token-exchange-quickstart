const express = require('express')
const fs = require('fs')
const uuid = require('uuid');
const { JWK, JWT } = require('jose')
const config = require('./config')

const publicKeyContent = fs.readFileSync(process.env.PUBLIC_KEY_FILE || '../keys/public.pem')
const publicKey = JWK.asKey(publicKeyContent, config.jwkParamsFor(publicKeyContent))

const app = express()
app.use(express.json())
app.get('/jwks', (req, res) => {
  return res.send({ keys: [publicKey] })
})

app.listen(8080, () => console.log(`Hosting the JWKS endpoint at http://localhost:8080/jwks.`))
