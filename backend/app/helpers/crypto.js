import crypto from 'crypto'
import fs from 'fs';

export const genRandomString = function(length){
	return crypto.randomBytes(Math.ceil(length/2))
					.toString('hex') /** convert to hexadecimal format */
					.slice(0,length);   /** return required number of characters */
};

export const sha512 = function(password, salt){
	const hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
	hash.update(password);
	return hash.digest('hex');
};


export const sha1FromFile = function(path) {
	return new Promise((resolve, reject) => {
		const hash = crypto.createHash('sha1')
		const rs = fs.createReadStream(path)
		rs.on('error', reject)
		rs.on('data', chunk => hash.update(chunk))
		rs.on('end', () => resolve(hash.digest('hex')))
	})
} 
