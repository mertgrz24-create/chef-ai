'use strict'
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { AsnConvert, OctetString } = require('@peculiar/asn1-schema')
const x509 = require('@peculiar/asn1-x509')
const pkcs10 = require('@peculiar/asn1-csr')

const expoProjectInformationOID = '1.2.840.113556.1.8000.2554.43437.254.128.102.157.7894389.20439.2.1'
const SHA256_RSA = '1.2.840.113549.1.1.11'
const MAX_DER_BYTES = 1024 * 1024
const aliases = { CN: '2.5.4.3', commonName: '2.5.4.3', O: '2.5.4.10', organizationName: '2.5.4.10', OU: '2.5.4.11', organizationalUnitName: '2.5.4.11' }
const certificateStates = new WeakMap()
const csrStates = new WeakMap()
const der = value => Buffer.from(AsnConvert.serialize(value))
const algorithm = () => new x509.AlgorithmIdentifier({ algorithm: SHA256_RSA, parameters: null })
const sign = (data, key) => crypto.sign('sha256', data, { key: rsaKey(key, 'private'), padding: crypto.constants.RSA_PKCS1_PADDING })
const verify = (data, signature, key) => crypto.verify('sha256', data, { key: rsaKey(key, 'public'), padding: crypto.constants.RSA_PKCS1_PADDING }, signature)

function rsaKey(key, type) {
  assert(key instanceof crypto.KeyObject && key.type === type && key.asymmetricKeyType === 'rsa', `Expected RSA ${type} KeyObject`)
  return key
}
function readDER(input, label) {
  assert(typeof input === 'string' || Buffer.isBuffer(input), 'Expected PEM or DER')
  assert(Buffer.byteLength(input) <= MAX_DER_BYTES, 'Certificate/CSR input too large')
  if (Buffer.isBuffer(input) && input[0] === 0x30) return Buffer.from(input)
  const text = input.toString().trim()
  const start = `-----BEGIN ${label}-----`, end = `-----END ${label}-----`
  assert(text.startsWith(start) && text.endsWith(end), `Expected ${label} PEM`)
  const base64 = text.slice(start.length, -end.length).replace(/\s/g, '')
  assert(/^[A-Za-z0-9+/]+={0,2}$/.test(base64), 'Invalid PEM encoding')
  const bytes = Buffer.from(base64, 'base64')
  assert(bytes.toString('base64') === base64, 'Invalid PEM base64')
  return bytes
}
function parseDER(bytes, type) {
  assert(bytes.length > 0 && bytes.length <= MAX_DER_BYTES, 'Invalid DER size')
  const parsed = AsnConvert.parse(bytes, type)
  // Reject trailing bytes, ignored children and noncanonical structures.
  assert(der(parsed).equals(bytes), 'Noncanonical or unsupported DER structure')
  return parsed
}
function pem(bytes, label) {
  return `-----BEGIN ${label}-----\n${bytes.toString('base64').match(/.{1,64}/g).join('\n')}\n-----END ${label}-----\n`
}
function subjectName(commonName) {
  assert(typeof commonName === 'string' && commonName.length > 0 && Buffer.byteLength(commonName) <= 1024, 'Invalid common name')
  return new x509.Name([new x509.RelativeDistinguishedName([
    new x509.AttributeTypeAndValue({ type: aliases.CN, value: new x509.AttributeValue({ utf8String: commonName }) }),
  ])])
}
function nameView(name) {
  const attributes = name.flatMap(rdn => Array.from(rdn, entry => Object.freeze({ type: entry.type, value: entry.value.toString() })))
  return Object.freeze({
    attributes: Object.freeze(attributes),
    hash: crypto.createHash('sha256').update(der(name)).digest('hex'),
    getField: field => attributes.find(attribute => attribute.type === (aliases[field] ?? field)),
  })
}
function subjectPublicKeyInfo(publicKey) {
  return AsnConvert.parse(rsaKey(publicKey, 'public').export({ type: 'spki', format: 'der' }), x509.SubjectPublicKeyInfo)
}
function publicKeysEqual(first, second) {
  return rsaKey(first, 'public').export({ type: 'spki', format: 'der' }).equals(rsaKey(second, 'public').export({ type: 'spki', format: 'der' }))
}
function signingExtensions() {
  return new x509.Extensions([
    new x509.Extension({ extnID: x509.id_ce_keyUsage, critical: true, extnValue: new OctetString(AsnConvert.serialize(new x509.KeyUsage(x509.KeyUsageFlags.digitalSignature))) }),
    new x509.Extension({ extnID: x509.id_ce_extKeyUsage, critical: true, extnValue: new OctetString(AsnConvert.serialize(new x509.ExtendedKeyUsage([x509.id_kp_codeSigning]))) }),
  ])
}
function extensionView(parsed, name) {
  const id = { keyUsage: x509.id_ce_keyUsage, extKeyUsage: x509.id_ce_extKeyUsage, expoProjectInformation: expoProjectInformationOID }[name] ?? name
  const extension = parsed.tbsCertificate.extensions?.find(entry => entry.extnID === id)
  if (!extension) return null
  const value = Buffer.from(extension.extnValue.buffer)
  if (id === x509.id_ce_keyUsage) return { digitalSignature: AsnConvert.parse(value, x509.KeyUsage).toJSON().includes('digitalSignature') }
  if (id === x509.id_ce_extKeyUsage) return { codeSigning: AsnConvert.parse(value, x509.ExtendedKeyUsage).includes(x509.id_kp_codeSigning) }
  return { id, critical: extension.critical, value: value.toString('utf8') }
}
function convertCertificatePEMToCertificate(input) {
  const bytes = readDER(input, 'CERTIFICATE')
  const native = new crypto.X509Certificate(bytes)
  const parsed = parseDER(bytes, x509.Certificate)
  const certificate = Object.freeze({
    publicKey: native.publicKey,
    subject: nameView(parsed.tbsCertificate.subject),
    issuer: nameView(parsed.tbsCertificate.issuer),
    validity: Object.freeze({ notBefore: new Date(native.validFrom), notAfter: new Date(native.validTo) }),
    getExtension: name => extensionView(parsed, name),
    verify(child) {
      const childState = certificateStates.get(child)
      assert(childState, 'Expected a parsed certificate')
      return der(childState.parsed.tbsCertificate.issuer).equals(der(parsed.tbsCertificate.subject)) && childState.native.verify(native.publicKey)
    },
  })
  certificateStates.set(certificate, { native, parsed, bytes })
  return certificate
}
function convertCertificateToCertificatePEM(certificate) {
  const state = certificateStates.get(certificate)
  assert(state, 'Expected a parsed certificate')
  return pem(state.bytes, 'CERTIFICATE')
}
function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicExponent: 65537 })
}
function convertKeyPairToPEM({ privateKey, publicKey }) {
  return {
    privateKeyPEM: rsaKey(privateKey, 'private').export({ type: 'pkcs1', format: 'pem' }).toString(),
    publicKeyPEM: rsaKey(publicKey, 'public').export({ type: 'spki', format: 'pem' }).toString(),
  }
}
const convertPrivateKeyPEMToPrivateKey = pem => rsaKey(crypto.createPrivateKey(pem), 'private')
const convertPublicKeyPEMToPublicKey = pem => rsaKey(crypto.createPublicKey(pem), 'public')
function convertKeyPairPEMToKeyPair({ privateKeyPEM, publicKeyPEM }) {
  return { privateKey: convertPrivateKeyPEMToPrivateKey(privateKeyPEM), publicKey: convertPublicKeyPEMToPublicKey(publicKeyPEM) }
}
function generateCertificate(publicKey, privateKey, subject, issuer, notBefore, notAfter, extensions) {
  assert(notBefore instanceof Date && notAfter instanceof Date && Number.isFinite(+notBefore) && Number.isFinite(+notAfter) && notAfter > notBefore, 'Invalid certificate validity')
  const serialNumber = crypto.randomBytes(16)
  serialNumber[0] = (serialNumber[0] & 0x7f) | 1
  const tbsCertificate = new x509.TBSCertificate({
    version: 2, serialNumber, signature: algorithm(), subject, issuer,
    validity: new x509.Validity({ notBefore, notAfter }),
    subjectPublicKeyInfo: subjectPublicKeyInfo(publicKey), extensions,
  })
  const certificate = new x509.Certificate({ tbsCertificate, signatureAlgorithm: algorithm(), signatureValue: sign(der(tbsCertificate), privateKey) })
  return convertCertificatePEMToCertificate(der(certificate))
}
function generateSelfSignedCodeSigningCertificate({ keyPair, validityNotBefore, validityNotAfter, commonName }) {
  assert(publicKeysEqual(crypto.createPublicKey(keyPair.privateKey), keyPair.publicKey), 'keyPair key mismatch')
  const subject = subjectName(commonName)
  return generateCertificate(keyPair.publicKey, keyPair.privateKey, subject, subject, validityNotBefore, validityNotAfter, signingExtensions())
}
function validateSelfSignedCertificate(certificate, keyPair) {
  const state = certificateStates.get(certificate)
  assert(state, 'Expected a parsed certificate')
  const now = Date.now()
  assert(certificate.issuer.hash === certificate.subject.hash, 'Certificate is not self-signed')
  // Read validity from immutable original DER, not mutable public Date objects.
  assert(Date.parse(state.native.validFrom) <= now && now <= Date.parse(state.native.validTo), 'Certificate validity expired')
  assert(certificate.getExtension('keyUsage')?.digitalSignature, 'Digital Signature usage not present')
  assert(certificate.getExtension('extKeyUsage')?.codeSigning, 'Code Signing usage not present')
  assert(state.native.verify(state.native.publicKey), 'Certificate signature not valid')
  assert(publicKeysEqual(state.native.publicKey, keyPair.publicKey), 'Certificate public key does not match key pair')
  assert(publicKeysEqual(crypto.createPublicKey(keyPair.privateKey), keyPair.publicKey), 'keyPair key mismatch')
}
function signBufferRSASHA256AndVerify(privateKey, certificate, bufferToSign) {
  const state = certificateStates.get(certificate)
  assert(state && Buffer.isBuffer(bufferToSign), 'Expected certificate and Buffer')
  const signature = sign(bufferToSign, privateKey)
  assert(verify(bufferToSign, signature, state.native.publicKey), 'Signature generated with private key not valid for certificate')
  return signature.toString('base64')
}
function convertCSRPEMToCSR(input) {
  const bytes = readDER(input, 'CERTIFICATE REQUEST')
  const parsed = parseDER(bytes, pkcs10.CertificationRequest)
  assert(parsed.signatureAlgorithm.algorithm === SHA256_RSA && (parsed.signatureAlgorithm.parameters === null || parsed.signatureAlgorithm.parameters === undefined), 'Unsupported CSR signature algorithm')
  const publicKey = crypto.createPublicKey({ key: der(parsed.certificationRequestInfo.subjectPKInfo), type: 'spki', format: 'der' })
  rsaKey(publicKey, 'public')
  const csr = Object.freeze({
    publicKey, subject: nameView(parsed.certificationRequestInfo.subject),
    verify: () => verify(Buffer.from(parsed.certificationRequestInfoRaw ?? der(parsed.certificationRequestInfo)), Buffer.from(parsed.signature), publicKey),
  })
  csrStates.set(csr, { parsed, bytes })
  return csr
}
function convertCSRToCSRPEM(csr) {
  const state = csrStates.get(csr)
  assert(state, 'Expected a parsed CSR')
  return pem(state.bytes, 'CERTIFICATE REQUEST')
}
function generateCSR(keyPair, commonName) {
  assert(publicKeysEqual(crypto.createPublicKey(keyPair.privateKey), keyPair.publicKey), 'keyPair key mismatch')
  const certificationRequestInfo = new pkcs10.CertificationRequestInfo({ subject: subjectName(commonName), subjectPKInfo: subjectPublicKeyInfo(keyPair.publicKey) })
  return convertCSRPEMToCSR(der(new pkcs10.CertificationRequest({ certificationRequestInfo, signatureAlgorithm: algorithm(), signature: sign(der(certificationRequestInfo), keyPair.privateKey) })))
}
function generateDevelopmentCertificateFromCSR(issuerPrivateKey, issuerCertificate, csr, appId, scopeKey) {
  const issuer = certificateStates.get(issuerCertificate), request = csrStates.get(csr)
  assert(issuer && request && csr.verify(), 'CSR not self-signed')
  assert(publicKeysEqual(crypto.createPublicKey(issuerPrivateKey), issuerCertificate.publicKey), 'Issuer key mismatch')
  assert(typeof appId === 'string' && typeof scopeKey === 'string' && !appId.includes(',') && !scopeKey.includes(',') && Buffer.byteLength(appId) + Buffer.byteLength(scopeKey) <= 4096, 'Invalid project scope')
  const notBefore = new Date(Date.now() - 86400000)
  const notAfter = new Date(notBefore.getTime() + 30 * 86400000)
  const extensions = signingExtensions()
  extensions.push(new x509.Extension({ extnID: expoProjectInformationOID, extnValue: new OctetString(Buffer.from(`${appId},${scopeKey}`, 'utf8')) }))
  return generateCertificate(csr.publicKey, issuerPrivateKey, request.parsed.certificationRequestInfo.subject, issuer.parsed.tbsCertificate.subject, notBefore, notAfter, extensions)
}
module.exports = {
  expoProjectInformationOID, generateKeyPair, convertKeyPairToPEM, convertKeyPairPEMToKeyPair,
  convertPublicKeyPEMToPublicKey, convertPrivateKeyPEMToPrivateKey,
  convertCertificatePEMToCertificate, convertCertificateToCertificatePEM,
  generateSelfSignedCodeSigningCertificate, validateSelfSignedCertificate,
  signBufferRSASHA256AndVerify, generateCSR, convertCSRPEMToCSR, convertCSRToCSRPEM,
  generateDevelopmentCertificateFromCSR,
}
