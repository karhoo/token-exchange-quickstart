const crypto = require('crypto');

const clientId = process.env.CLIENT_ID || 'your-app-id'
const audience = process.env.AUDIENCE || 'https://sso.sandbox.karhoo.com/oauth/v2/token-exchange'
const jwkParamsFor = (publicKeyContent) => {
  return {
    alg: 'RS256',
    kid: crypto.createHash('sha256').update(publicKeyContent).digest('hex')
  }
}

module.exports = { clientId, audience, jwkParamsFor }
