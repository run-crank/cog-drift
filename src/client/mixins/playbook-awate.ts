
import { Axios } from 'axios';

export class PlaybookAwareMixin {
  client: Axios;

  public async getPlaybooks(): Promise<any> {
    return this.client.get('/playbooks/list', { transformResponse: [data => data] });
  }
}
