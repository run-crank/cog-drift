
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
}
