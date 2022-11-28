
const axios = require('axios');

export class ContactAwareMixin {
  client: any;

  public async getContactByEmail(email: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get(`/contacts?email=${email}`, { transformResponse: [data => data] })
        .then((value) => {
          // This endpoint returns an array of contacts. Return the first element only.
          const contacts: Record<string, any>[] = JSON.parse(value.data).data;
          resolve(contacts[0]);
        })
        .catch(reject);
    });
  }

  public async createContact(contact: Record<string, any>): Promise<any> {
    return new Promise(async (resolve, reject) => {
      await this.client.post('/contacts', JSON.stringify({ attributes: contact }), { transformResponse: [data => data] })
        .then((value) => {
          const contact: Record<string, any> = JSON.parse(value.data).data;
          resolve(contact);
        })
        .catch(reject);
    });
  }

  public async updateContact(id: number, contact: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.patch(`/contacts/${id}`, JSON.stringify({ attributes: contact }), { transformResponse: [data => data] })
        .then((value) => {
          const contact: Record<string, any> = JSON.parse(value.data).data;
          resolve(contact);
        })
        .catch(reject);
    });
  }

  public async deleteContact(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.delete(`/contacts/${id}`, { transformResponse: [data => data] })
        .then(resolve)
        .catch(reject);
    });
  }
}
