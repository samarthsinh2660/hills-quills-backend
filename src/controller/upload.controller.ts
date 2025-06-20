import { Request, Response } from 'express';
import cloudinary from '../services/imageUpload.service.ts';
import { errorResponse, successResponse } from '../utils/response.ts';
import { Readable } from 'stream';

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
          return reject(error);
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
      res.status(400).json(errorResponse('No file uploaded', 50010));
      return;
    }

    // Determine folder based on upload type
    const uploadType = req.body.type || 'article'; // Default to 'article' if not specified
    const folder = uploadType === 'profile' ? 'hills-quills/profiles' : 'hills-quills/articles';

    // Upload file to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, folder);

    // Return the Cloudinary URL
    res.status(200).json(successResponse({
      url: result.url,
      public_id: result.public_id
    }, 'Image uploaded successfully'));
    return;
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json(errorResponse('Image upload failed', 50011));
    return;
  }
};
