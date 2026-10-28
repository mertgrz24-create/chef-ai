import type { KeyObject } from 'node:crypto'
export interface KeyPair { publicKey: KeyObject; privateKey: KeyObject }
export interface KeyPairPEM { publicKeyPEM: string; privateKeyPEM: string }
export interface DistinguishedName {
  readonly hash: string
  readonly attributes: readonly { type: string; value: string }[]
  getField(name: string): { type: string; value: string } | undefined
}
export interface Certificate {
  readonly publicKey: KeyObject
  readonly subject: DistinguishedName
  readonly issuer: DistinguishedName
  readonly validity: { readonly notBefore: Date; readonly notAfter: Date }
  getExtension(name: string): { digitalSignature?: boolean; codeSigning?: boolean; id?: string; critical?: boolean; value?: string } | null
  verify(child: Certificate): boolean
}
export interface CSR { readonly publicKey: KeyObject; readonly subject: DistinguishedName; verify(): boolean }
export declare const expoProjectInformationOID: string
export declare function generateKeyPair(): KeyPair
export declare function convertKeyPairToPEM(keyPair: KeyPair): KeyPairPEM
export declare function convertKeyPairPEMToKeyPair(keyPair: KeyPairPEM): KeyPair
export declare function convertPrivateKeyPEMToPrivateKey(pem: string): KeyObject
export declare function convertPublicKeyPEMToPublicKey(pem: string): KeyObject
export declare function convertCertificatePEMToCertificate(pem: string | Buffer): Certificate
export declare function convertCertificateToCertificatePEM(certificate: Certificate): string
export declare function generateSelfSignedCodeSigningCertificate(options: { keyPair: KeyPair; validityNotBefore: Date; validityNotAfter: Date; commonName: string }): Certificate
export declare function validateSelfSignedCertificate(certificate: Certificate, keyPair: KeyPair): void
export declare function signBufferRSASHA256AndVerify(privateKey: KeyObject, certificate: Certificate, buffer: Buffer): string
export declare function generateCSR(keyPair: KeyPair, commonName: string): CSR
export declare function convertCSRPEMToCSR(pem: string | Buffer): CSR
export declare function convertCSRToCSRPEM(csr: CSR): string
export declare function generateDevelopmentCertificateFromCSR(issuerPrivateKey: KeyObject, issuerCertificate: Certificate, csr: CSR, appId: string, scopeKey: string): Certificate
