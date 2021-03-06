const BSVABI = require('../bsvabi/bsvabi');
const twetchPublicKey = '022f01e5e15cca351daff3843fb70f3c2f0a1bdd05e5af888a67784ef3e10a2a01';
const ecies = require('../bsvabi/bsv/ecies');
const Crypto = require('../shared-helpers/crypto');
global.window = global;

class TwetchCrypto {
	static aesEncrypt(plainText, key) {
		key = Buffer.from(key, 'hex');
		return Crypto.aesEncrypt(plainText, key);
	}

	static aesDecrypt(encryptedHex, key) {
		key = Buffer.from(key, 'hex');
		return Crypto.aesDecrypt(encryptedHex, key);
	}

	static generateAesKey(l = 32) {
		return BSVABI.bitcoin.crypto.Hash.sha256(BSVABI.bitcoin.PrivateKey().toBuffer())
			.toString('hex')
			.substring(l);
	}

	static eciesEncrypt(plainText, publicKey) {
		return new ecies()
			.publicKey(publicKey)
			.encrypt(plainText)
			.toString('base64');
	}

	static eciesDecrypt(encryptedHex, privateKey) {
		try {
			const priv = new BSVABI.bitcoin.PrivateKey(privateKey);
			const decryptedMessage = new ecies()
				.privateKey(priv)
				.decrypt(Buffer.from(encryptedHex, 'base64'))
				.toString();
			return decryptedMessage;
		} catch (e) {
			return e.toString();
		}
	}

	static ecdhEncrypt(message, priv) {
		const key = BSVABI.bitcoin.PrivateKey(priv);
		const ecdh = new BSVABI.IES({ nokey: true }).privateKey(key).publicKey(twetchPublicKey);
		const encrypted = ecdh.encrypt(message);
		return encrypted.toString('hex');
	}

	static ecdhDecrypt(encrypted, priv, pub) {
		const encryptedBuffer = BSVABI.bitcoin.deps.Buffer.from(encrypted, 'hex');
		const key = BSVABI.bitcoin.PrivateKey(priv);
		const ecdh = new BSVABI.IES({ nokey: true }).privateKey(key).publicKey(pub);
		const message = ecdh.decrypt(encryptedBuffer);
		return message.toString();
	}

	static privFromMnemonic(m, path) {
		const mnemonic = BSVABI.Mnemonic.fromString(m);
		const xpriv = BSVABI.bitcoin.HDPrivateKey.fromSeed(mnemonic.toSeed());
		return xpriv.deriveChild(path || 'm/0/0').privateKey.toString();
	}

	static pubFromMnemonic(m, path) {
		const priv = this.privFromMnemonic(m, path);
		return new BSVABI.bitcoin.PrivateKey(priv).toPublicKey().toString();
	}

	static addressFromMnemonic(m, path) {
		const priv = this.privFromMnemonic(m, path);
		return new BSVABI.bitcoin.PrivateKey(priv)
			.toPublicKey()
			.toAddress()
			.toString();
	}

	static generateMnemonic() {
		return BSVABI.Mnemonic.fromRandom().toString();
	}
}

module.exports = TwetchCrypto;
