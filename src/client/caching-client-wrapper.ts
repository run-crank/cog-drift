import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';

class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario, request, and requestor
  public cachePrefix = `${this.idMap.scenarioId}${this.idMap.requestorId}${this.idMap.connectionId}`;

  constructor(private client: ClientWrapper, public redisClient: any, public idMap: any) {
    this.redisClient = redisClient;
    this.idMap = idMap;
  }

  // Contact aware methods
  // -------------------------------------------------------------------

  public async getContactByEmail(email: string) {
    const cachekey = `Drift|Contact|${email}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.getContactByEmail(email);
      if (result && Object.keys(result).length) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async createContact(contact: Record<string, any>) {
    await this.clearCache();
    return await this.client.createContact(contact);
  }

  public async updateContact(id: number, contact: Record<string, any>) {
    await this.clearCache();
    return await this.client.updateContact(id, contact);
  }

  public async deleteContact(id: number) {
    await this.clearCache();
    return await this.client.deleteContact(id);
  }

  // Account aware methods
  // -------------------------------------------------------------------

  public async getAccountById(id: string) {
    const cachekey = `Drift|Account|${id}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.getAccountById(id);
      if (result && Object.keys(result).length) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async createAccount(account: Record<string, any>) {
    await this.clearCache();
    return await this.client.createAccount(account);
  }

  public async updateAccount(account: Record<string, any>) {
    await this.clearCache();
    return await this.client.updateAccount(account);
  }

  public async deleteAccount(id: string) {
    await this.clearCache();
    return await this.client.deleteAccount(id);
  }

  // Conversation aware methods
  // -------------------------------------------------------------------

  public async getConversations(nextPageId: string = null): Promise<any> {
    await this.clearCache();
    return await this.client.getConversations(nextPageId);
  }

  public async getConversationById(conversationId: string): Promise<any> {
    await this.clearCache();
    return await this.client.getConversationById(conversationId);
  }

  // Non-cached methods
  // -------------------------------------------------------------------

  public isDate(value: any) {
    return this.client.isDate(value);
  }

  public toDate(epoch: number) {
    return this.client.toDate(epoch);
  }

  public toEpoch(date: Date) {
    return this.client.toEpoch(date);
  }

  // Redis methods for get, set, and delete
  // -------------------------------------------------------------------

  // Async getter/setter
  public getAsync = promisify(this.redisClient.get).bind(this.redisClient);
  public setAsync = promisify(this.redisClient.setex).bind(this.redisClient);
  public delAsync = promisify(this.redisClient.del).bind(this.redisClient);

  public async getCache(key: string) {
    try {
      const stored = await this.getAsync(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (err) {
      console.log(err);
    }
  }

  public async setCache(key: string, value: any) {
    try {
      // arrOfKeys will store an array of all cache keys used in this scenario run, so it can be cleared easily
      const arrOfKeys = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      arrOfKeys.push(key);
      await this.setAsync(key, 55, JSON.stringify(value));
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, JSON.stringify(arrOfKeys));
    } catch (err) {
      console.log(err);
    }
  }

  public async delCache(key: string) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.log(err);
    }
  }

  public async clearCache() {
    try {
      // clears all the cachekeys used in this scenario run
      const keysToDelete = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      if (keysToDelete.length) {
        keysToDelete.forEach(async (key: string) => await this.delAsync(key));
      }
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, '[]');
    } catch (err) {
      console.log(err);
    }
  }
}

export { CachingClientWrapper as CachingClientWrapper };
