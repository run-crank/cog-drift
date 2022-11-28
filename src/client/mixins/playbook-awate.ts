export class PlaybookAwareMixin {
  client: any;

  public async getPlaybooks(): Promise<any> {
    return this.client.get('/playbooks/list', { transformResponse: [data => data] });
  }
}
