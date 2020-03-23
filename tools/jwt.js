const express = require('express')
const fs = require('fs')
const uuid = require('uuid');
const { JWK, JWT } = require('jose')
const config = require('./config')
const now = () => Math.round(Date.now() / 1000);
const inquirer = require('inquirer');

const privateKeyContent = fs.readFileSync(process.env.PRIVATE_KEY_FILE || '../keys/private.pem')
const publicKeyContent = fs.readFileSync(process.env.PUBLIC_KEY_FILE || '../keys/public.pem')
const privateKey = JWK.asKey(privateKeyContent, config.jwkParamsFor(publicKeyContent))

console.log('Please provide your user details:')
inquirer
  .prompt([
    {
      name: 'sub',
      message: 'User ID',
      default: uuid.v4(),
    },
    {
      name: 'given_name',
      message: 'Given name',
      default: 'John',
    },
    {
      name: 'family_name',
      message: 'Family name',
      default: 'Doe',
    },
    {
      name: 'email',
      message: 'Email',
      default: 'john.doe@example.com',
    },
    {
      name: 'phone_number',
      message: 'Phone number',
    },
    {
      name: 'locale',
      message: 'Locale',
      default: 'en',
    },
    {
      name: 'iss',
      message: 'Your client ID',
      default: config.clientId,
    },
  ])
  .then(answers => {
    const jwtPayload = Object.assign({
      jti: uuid.v4(),
      aud: config.audience,
      iss: config.clientId,
      iat: now(),
      exp: now() + 30*60,
    }, answers);

    const token = JWT.sign(jwtPayload, privateKey)
    console.log(token);
  })
  .catch(() => {});
