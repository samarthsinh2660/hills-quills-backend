import { Request, Response } from 'express';
import cloudinary from '../services/imageUpload.service.ts';
import { errorResponse, successResponse } from '../utils/response.ts';
import { Readable } from 'stream';
import { ERRORS } from '../utils/error.ts';

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = async (fileBuffer: Buffer, folder: string): Promise<{ url: string, public_id: string }> => {
  return new Promise((resolve, reject) => {
    // Create a Readable stream from the buffer using ES modules
    const readableStream = new Readable({
      read() {
        this.push(fileBuffer);
        this.push(null);
      }
    });

    // Create an upload stream to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(ERRORS.CLOUDINARY_UPLOAD_ERROR);
        }
        
        return resolve({ 
          url: result!.secure_url, 
          public_id: result!.public_id 
        });
      }
    );

    // Pipe the readable stream to the Cloudinary upload stream
    readableStream.pipe(uploadStream);
  });
};

// Controller function to handle image uploads
export const uploadImage = async (req: Request, res: Response) => {
  try {
    // Check if file exists in request
    if (!req.file) {
      res.status(ERRORS.NO_FILE_UPLOADED.statusCode).json(errorResponse(ERRORS.NO_FILE_UPLOADED.message, ERRORS.NO_FILE_UPLOADED.code));
      return;
    }

    // Determine folder based on upload type
    const uploadType = req.body.type || 'article'; // Default to 'article' if not specified
    
    let folder;
    switch (uploadType) {
      case 'profile':
        folder = 'hills-quills/profiles';
        break;
      case 'article':
        folder = 'hills-quills/articles';
        break;
      case 'webstory':
        folder = 'hills-quills/webstories';
        break;
      case 'slide':
        folder = 'hills-quills/webstories/slides';
        break;
      case 'ad':
        folder = 'hills-quills/ads';
        break;
      default:
        folder = 'hills-quills/articles'; // Default fallback
    }

    // Upload file to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, folder);

    // Return the Cloudinary URL and additional metadata
    res.status(200).json(successResponse({
      url: result.url,
      public_id: result.public_id,
      type: uploadType,
      folder: folder
    }, 'Image uploaded successfully'));
    
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Use the standardized error if it's a RequestError, otherwise use a generic error
    const errorToReturn = error.code ? error : ERRORS.IMAGE_UPLOAD_FAILED;
    
    res.status(errorToReturn.statusCode).json(errorResponse(errorToReturn.message, errorToReturn.code));
  }
};
