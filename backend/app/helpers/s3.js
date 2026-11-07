import multer from 'multer';
import multerS3 from 'multer-s3';
import aws from 'aws-sdk';
import sharp from 'sharp';


export const s3 = new aws.S3({})
export const multipart = multer({}).none()
export const upload = multer({
  dest: '/tmp'
})
export const s3upload = (options) => multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_USER_UPLOADS_BUCKET,
    region: process.env.AWS_S3_USER_UPLOADS_BUCKET_REGION,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    cacheControl: 'max-age=31536000',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, `users/${req.params.id}/avatar.${file.mimetype.split('/')[1].split('+')[0]}`)
    },
    ...options
  })
})
export const s3rename = (from, to, bucket = process.env.AWS_S3_USER_UPLOADS_BUCKET, region = process.env.AWS_S3_USER_UPLOADS_BUCKET_REGION) => {
  const fromPath = from.split('amazonaws.com/')[1] || from;
  const toPath = to.split('amazonaws.com/')[1] || to;
  return s3.copyObject({
    //Region: region,
    Bucket: bucket, 
    CopySource: `${bucket}/${fromPath}`, 
    Key: toPath
   }).promise().then(() => 
    // Delete the old object
    s3.deleteObject({
      //Region: region,
      Bucket: bucket, 
      Key: fromPath
    }).promise()
   )
}

import stream from 'stream';
import fs from 'fs';
export const s3uploadAndUnlink = async (file, key) => {
  const pass = new stream.PassThrough()
  const params = {
      Bucket: process.env.AWS_S3_USER_UPLOADS_BUCKET,
      CreateBucketConfiguration: {
          // Set your region here
          LocationConstraint: process.env.AWS_S3_USER_UPLOADS_BUCKET_REGION
      },
      ContentType: file.mimetype,
      Key: key,
      Body: pass
  };
  const promise = s3.upload(params).promise();
  fs.createReadStream(file.path).pipe(pass)
  return promise.then(() => {
    fs.unlinkSync(file.path, () => {});
    return `https://s3.${process.env.AWS_S3_USER_UPLOADS_BUCKET_REGION}.amazonaws.com/${process.env.AWS_S3_USER_UPLOADS_BUCKET}/${key}`
  })
}



export const s3uploadResized = async (file, key, width, uploadAnyway, sizeCallback) => {
  const pass = new stream.PassThrough()

  console.log('Processing', file.path);
  const image = await sharp(file.path, {
//    animated: true
  });
  const metadata = await image.metadata()
  const startTime = new Date();
  if (metadata.width <= width) {
    if (!uploadAnyway) {
      return
    }
    width = metadata.width;
  }
  const height = Math.floor((width / metadata.width) * metadata.height);
  const newPath = file.path + '@' + width + 'x' + height;
  if (file.mimetype.indexOf('svg') == -1 && !(metadata.pages > 1)) {
    await (image.rotate().resize(width).toFile(newPath));
  } else {
    fs.copyFileSync(file.path, newPath);
  }
  if (sizeCallback) {
    sizeCallback({width, height, path: newPath})
  }


  const params = {
      Bucket: process.env.AWS_S3_USER_UPLOADS_BUCKET,
      CreateBucketConfiguration: {
          // Set your region here
          LocationConstraint: process.env.AWS_S3_USER_UPLOADS_BUCKET_REGION
      },
      ContentType: file.mimetype,
      Key: key.replace(/(\.[^.]*?)$/, '@' + width + 'x' + height + '$1'),
      Body: pass
  };
  //await image.contain(width, Jimp.AUTO)
  //await image.writeAsync(newPath)
  console.log('Written', newPath, 'in', (new Date - startTime) + 'ms');
  const promise = s3.upload(params).promise();
  fs.createReadStream(newPath).pipe(pass)
  console.log('Uploading', params.Key);
  return promise.then(() => {
    fs.unlinkSync(newPath, () => {});
    return `https://s3.${process.env.AWS_S3_USER_UPLOADS_BUCKET_REGION}.amazonaws.com/${process.env.AWS_S3_USER_UPLOADS_BUCKET}/${params.Key}`
  })

}

export async function s3uploadResponsive(file, key, sizes = [400, 768, 1024, 1280]) {
  // upload original image, measure its dimension
  var originalSize;
  var promises = {
    default: s3uploadResized(file, key, 2048, true, (size) => originalSize = size)
  }
  
  // resize image to given sizes
  if (file.mimetype.indexOf('svg') === -1) {
    sizes.forEach((size) => 
      promises[size] = s3uploadResized(file, key, size)
    )
  }

  // upload all images in parallel
  var results = (await Promise.all(Object.values(promises))).reduce((newSizes, value, index) => {
    const key = Object.keys(promises)[index];
    return value ? {...newSizes, [key]: value} : newSizes
  }, {});
  
  // delete original
  fs.unlinkSync(file.path, () => {});
  
  results[originalSize.width] = results.default;

  if (global.gc) {
    console.log('Run gc')
    global.gc();
  }
  return results;
}

export {multer, multerS3, aws};
