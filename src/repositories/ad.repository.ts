import { RowDataPacket, OkPacket } from 'mysql2';
import { db } from '../database/db.ts';
import { Ad } from '../models/ad.model.ts';

// Interface for creating a new ad
export interface CreateAdRequest {
  type: 'google' | 'admin';
  image_url?: string;
  title?: string;
  link_url?: string;
  description?: string;
  created_by_admin_id?: number;
}

// Interface for updating an existing ad
export interface UpdateAdRequest {
  type?: 'google' | 'admin';
  image_url?: string;
  title?: string;
  link_url?: string;
  description?: string;
}

export interface IAdRepository {
  create(adData: CreateAdRequest): Promise<Ad>;
  findById(id: number): Promise<Ad | null>;
  findAll(): Promise<Ad[]>;
  update(id: number, updateData: UpdateAdRequest): Promise<void>;
  delete(id: number): Promise<void>;
  deleteMultiple(ids: number[]): Promise<void>;
}

export class AdRepository implements IAdRepository {
  async create(adData: CreateAdRequest): Promise<Ad> {
    const query = `
      INSERT INTO ads (type, image_url, title, link_url, description, created_by_admin_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute<OkPacket>(query, [
      adData.type,
      adData.image_url || null,
      adData.title || null,
      adData.link_url || null,
      adData.description || null,
      adData.created_by_admin_id || null
    ]);
    
    const createdAd = await this.findById(result.insertId);
    if (!createdAd) {
      throw new Error('Failed to retrieve created ad');
    }
    return createdAd;
  }

  async findById(id: number): Promise<Ad | null> {
    const query = `
      SELECT * FROM ads WHERE id = ?
    `;
    
    const [rows] = await db.execute<Ad[]>(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  }

  async findAll(): Promise<Ad[]> {
    const query = `
      SELECT * FROM ads ORDER BY created_at DESC
    `;
    
    const [rows] = await db.execute<Ad[]>(query);
    return rows;
  }

  async update(id: number, updateData: UpdateAdRequest): Promise<void> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (updateData.type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(updateData.type);
    }
    
    if (updateData.image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(updateData.image_url);
    }
    
    if (updateData.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(updateData.title);
    }
    
    if (updateData.link_url !== undefined) {
      updateFields.push('link_url = ?');
      updateValues.push(updateData.link_url);
    }
    
    if (updateData.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updateData.description);
    }
    
    if (updateFields.length === 0) {
      return; // Nothing to update
    }
    
    const query = `
      UPDATE ads SET ${updateFields.join(', ')} WHERE id = ?
    `;
    
    updateValues.push(id);
    await db.execute(query, updateValues);
  }

  async delete(id: number): Promise<void> {
    const query = `DELETE FROM ads WHERE id = ?`;
    await db.execute(query, [id]);
  }

  async deleteMultiple(ids: number[]): Promise<void> {
    if (!ids.length) return;
    
    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM ads WHERE id IN (${placeholders})`;
    await db.execute(query, ids);
  }
}
