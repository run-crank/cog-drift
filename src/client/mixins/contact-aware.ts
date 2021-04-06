
import * as request from 'request-promise';

export class ContactAwareMixin {
  client: request.RequestPromiseAPI;

  public async getContactByEmail(email: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get(`https://driftapi.com/contacts?email=${email}`)
        .then((value) => {
          // This endpoint returns an array of contacts. Return the first element only.
          const contacts: Record<string, any>[] = JSON.parse(value).data;
          resolve(contacts[0]);
        })
        .catch(reject);
    });
  }

  public async createContact(contact: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.post('https://driftapi.com/contacts', {
        body: JSON.stringify({
          attributes: contact,
        }),
      }).then((value) => {
        const contact: Record<string, any> = JSON.parse(value).data;
        resolve(contact);
      })
      .catch(reject);
    });
  }

  public async updateContact(id: number, contact: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.patch(`https://driftapi.com/contacts/${id}`, {
        body: JSON.stringify({
          attributes: contact,
        }),
      }).then((value) => {
        const contact: Record<string, any> = JSON.parse(value).data;
        resolve(contact);
      })
      .catch(reject);
    });
  }

  public async deleteContact(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.delete(`https://driftapi.com/contacts/${id}`)
        .then(resolve)
        .catch(reject);
    });
  }
}
