'use strict'
// Only the API consumed by Expo CLI's iOS certificate identity reader is exposed.
// All signature verification is performed by Node/OpenSSL, never a JS RSA parser.
const certificates = require('./code-signing.cjs')
module.exports = Object.freeze({
  pki: Object.freeze({ certificateFromPem: certificates.convertCertificatePEMToCertificate }),
})
