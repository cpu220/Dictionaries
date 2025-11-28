import { getDB } from './db';
import { IModelService, Model } from '../types';

export class ModelService implements IModelService {
  async getModel(id: string): Promise<Model | undefined> {
    const db = await getDB();
    return db.get('models', id);
  }

  async addModel(model: Model): Promise<string> {
    const db = await getDB();
    await db.put('models', model);
    return model.id;
  }
}
