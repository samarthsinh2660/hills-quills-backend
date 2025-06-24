import { Request, Response, NextFunction } from 'express';
import { Ad } from '../models/ad.model.ts';
import { AdRepository, IAdRepository, CreateAdRequest, UpdateAdRequest } from '../repositories/ad.repository.ts';
import { ERRORS, handleUnknownError } from '../utils/error.ts';
import { successResponse, createdResponse, updatedResponse, deletedResponse, listResponse } from '../utils/response.ts';

// Create an instance of the repository
const adRepository: IAdRepository = new AdRepository();

/**
 * Create a new advertisement
 */
export const createAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adData: CreateAdRequest = req.body;
    
    // Validate required fields
    if (!adData.type || !['google', 'admin'].includes(adData.type)) {
      throw ERRORS.INVALID_AD_TYPE;
    }
    
    // Add admin ID from authenticated user if not provided
    if (adData.type === 'admin' && !adData.created_by_admin_id && req.user?.id) {
      adData.created_by_admin_id = req.user.id;
    }

    const createdAd = await adRepository.create(adData);
    res.status(201).json(createdResponse(createdAd, 'Advertisement created successfully'));
  } catch (error) {
    next(error instanceof Error ? handleUnknownError(error) : ERRORS.AD_CREATION_FAILED);
  }
};

/**
 * Get all advertisements
 */
export const getAllAds = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ads = await adRepository.findAll();
    res.status(200).json(listResponse(ads, 'Advertisements retrieved successfully'));
  } catch (error) {
    next(handleUnknownError(error));
  }
};

/**
 * Get advertisement by ID
 */
export const getAdById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adId = parseInt(req.params.id);
    
    if (isNaN(adId)) {
      throw ERRORS.INVALID_PARAMS;
    }
    
    const ad = await adRepository.findById(adId);
    
    if (!ad) {
      throw ERRORS.AD_NOT_FOUND;
    }
    
    res.status(200).json(successResponse(ad, 'Advertisement retrieved successfully'));
  } catch (error) {
    next(handleUnknownError(error));
  }
};

/**
 * Update an advertisement
 */
export const updateAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adId = parseInt(req.params.id);
    const updateData: UpdateAdRequest = req.body;
    
    if (isNaN(adId)) {
      throw ERRORS.INVALID_PARAMS;
    }
    
    // Check if ad exists
    const existingAd = await adRepository.findById(adId);
    if (!existingAd) {
      throw ERRORS.AD_NOT_FOUND;
    }
    
    // Validate ad type if provided
    if (updateData.type && !['google', 'admin'].includes(updateData.type)) {
      throw ERRORS.INVALID_AD_TYPE;
    }
    
    await adRepository.update(adId, updateData);
    
    // Fetch updated ad
    const updatedAd = await adRepository.findById(adId);
    res.status(200).json(updatedResponse(updatedAd, 'Advertisement updated successfully'));
  } catch (error) {
    next(error instanceof Error ? handleUnknownError(error) : ERRORS.AD_UPDATE_FAILED);
  }
};

/**
 * Delete an advertisement
 */
export const deleteAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adId = parseInt(req.params.id);
    
    if (isNaN(adId)) {
      throw ERRORS.INVALID_PARAMS;
    }
    
    // Check if ad exists
    const existingAd = await adRepository.findById(adId);
    if (!existingAd) {
      throw ERRORS.AD_NOT_FOUND;
    }
    
    await adRepository.delete(adId);
    res.status(200).json(deletedResponse('Advertisement deleted successfully'));
  } catch (error) {
    next(error instanceof Error ? handleUnknownError(error) : ERRORS.AD_DELETE_FAILED);
  }
};

/**
 * Delete multiple advertisements
 */
export const deleteMultipleAds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      throw ERRORS.INVALID_REQUEST_BODY;
    }
    
    await adRepository.deleteMultiple(ids);
    res.status(200).json(deletedResponse(`${ids.length} advertisements deleted successfully`));
  } catch (error) {
    next(error instanceof Error ? handleUnknownError(error) : ERRORS.AD_DELETE_FAILED);
  }
};
