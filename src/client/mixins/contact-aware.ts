
import * as request from 'request-promise';

export class ContactAwareMixin {
  client: request.RequestPromiseAPI;

  public async getContactByEmail(email: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get(`https://driftapi.com/contacts?email=${email}`)
        .then(resolve)
        .catch(reject);
    });
  }
}
