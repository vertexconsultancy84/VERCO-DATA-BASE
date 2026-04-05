import * as cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: 'dzikttrya',
  api_key: '466747726444735',
  api_secret: 'Kcg7jS0ApBQVUc45WPFg8eZQ7vA',
  secure: true,
});

// Function to upload file to Cloudinary
export async function uploadToCloudinary(file: File | Buffer, folder: string = 'products') {
  try {
    return new Promise((resolve, reject) => {
      const resourceType = file instanceof File 
        ? (file.type.startsWith('video/') ? 'video' : 'image')
        : 'auto';

      const uploadOptions: any = {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}-${file instanceof File ? file.name.split('.')[0] : 'upload'}`,
        overwrite: true,
      };

      // Add video-specific optimizations
      if (resourceType === 'video') {
        uploadOptions.chunk_size = 6000000; // 6MB chunks for large videos
        uploadOptions.eager = [
          { format: 'mp4', quality: 'auto' },
          { format: 'webm', quality: 'auto' }
        ];
      }

      // Convert File to Buffer if needed
      const handleUpload = async () => {
        let uploadData: Buffer;
        
        try {
          if (file instanceof File) {
            // Check file size to prevent memory issues
            const maxSize = 50 * 1024 * 1024; // 50MB limit
            if (file.size > maxSize) {
              throw new Error(`File size too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
            }
            
            // Use arrayBuffer() for server-side processing (FileReader not available in Node.js)
            const arrayBuffer = await file.arrayBuffer();
            uploadData = Buffer.from(arrayBuffer);
          } else {
            uploadData = file;
          }
        } catch (error: any) {
          throw new Error(`File processing failed: ${error.message}`);
        }

        cloudinary.v2.uploader.upload_stream(
          uploadOptions,
          (error: any, result: any) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
                resource_type: result.resource_type,
              });
            }
          }
        ).end(uploadData);
      };

      handleUpload();
    });
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error}`);
  }
}

// Function to delete from Cloudinary
export async function deleteFromCloudinary(publicId: string) {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.v2.uploader.destroy(
        publicId,
        (error: any, result: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error}`);
  }
}
