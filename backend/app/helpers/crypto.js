import crypto from 'crypto'
import fs from 'fs';

export const genRandomString = function(length){
	return crypto.randomBytes(Math.ceil(length/2))
					.toString('hex') /** convert to hexadecimal format */
					.slice(0,length);   /** return required number of characters */
};

// Legacy: a single HMAC-SHA512 round is far too fast for passwords. Only kept
// to check old hashes, which verifyPassword upgrades to scrypt on login.
export const sha512 = function(password, salt){
	const hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
	hash.update(password);
	return hash.digest('hex');
};

// Password hashing with scrypt (memory-hard, built into Node).
// Stored as "scrypt$N$r$p$<base64 key>" in hashed_password; the random salt
// stays in its own column. Parameters live in the hash, so they can be raised
// later and verifyPassword will flag older hashes for rehashing.
const SCRYPT = { N: 32768, r: 8, p: 1, keylen: 64 };
const SCRYPT_PREFIX = 'scrypt$';

const scryptAsync = (password, salt, keylen, options) => new Promise((resolve, reject) => {
	crypto.scrypt(password, salt, keylen, { ...options, maxmem: 256 * options.N * options.r }, (err, key) => {
		if (err) reject(err); else resolve(key);
	});
});

function assertPassword(password) {
	if (typeof password !== 'string' || password.length === 0) {
		throw new Error('Password is required');
	}
	if (password.length > 1024) {
		throw new Error('Password is too long');
	}
}

export async function hashPassword(password) {
	assertPassword(password);
	const salt = genRandomString(32);
	const { N, r, p, keylen } = SCRYPT;
	const key = await scryptAsync(password, salt, keylen, { N, r, p });
	return {
		salt,
		hashedPassword: `${SCRYPT_PREFIX}${N}$${r}$${p}$${key.toString('base64')}`,
	};
}

// Returns { ok, needsRehash }. needsRehash is true for legacy SHA-512 hashes
// and for scrypt hashes made with weaker parameters than the current ones.
export async function verifyPassword(password, hashedPassword, salt) {
	if (typeof password !== 'string' || !password || !hashedPassword || !salt) {
		return { ok: false, needsRehash: false };
	}
	if (hashedPassword.startsWith(SCRYPT_PREFIX)) {
		const [, N, r, p, encoded] = hashedPassword.split('$');
		const expected = Buffer.from(encoded || '', 'base64');
		if (!expected.length) return { ok: false, needsRehash: false };
		const params = { N: Number(N), r: Number(r), p: Number(p) };
		const actual = await scryptAsync(password, salt, expected.length, params);
		const ok = crypto.timingSafeEqual(actual, expected);
		const weaker = params.N < SCRYPT.N || params.r < SCRYPT.r || params.p < SCRYPT.p;
		return { ok, needsRehash: ok && weaker };
	}
	const legacy = Buffer.from(sha512(password, salt));
	const stored = Buffer.from(hashedPassword);
	const ok = legacy.length === stored.length && crypto.timingSafeEqual(legacy, stored);
	return { ok, needsRehash: ok };
}


export const sha1FromFile = function(path) {
	return new Promise((resolve, reject) => {
		const hash = crypto.createHash('sha1')
		const rs = fs.createReadStream(path)
		rs.on('error', reject)
		rs.on('data', chunk => hash.update(chunk))
		rs.on('end', () => resolve(hash.digest('hex')))
	})
} 
