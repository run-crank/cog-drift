export class AccountAwareMixin {
  client: any;

  public async getAccountById(id: string): Promise<any> {
    return this.client.get(`/accounts/${id}`, { transformResponse: [data => data] });
  }

  public async createAccount(account: Record<string, any>): Promise<any> {
    return this.client.post('/accounts/create', JSON.stringify(account), { transformResponse: [data => data] });
    // return this.client.get('/accounts', { transformResponse: [data => data] });
  }

  public async updateAccount(account: Record<string, any>): Promise<any> {
    return this.client.patch('/accounts/update', JSON.stringify(account), { transformResponse: [data => data] });
  }

  public async deleteAccount(id: string): Promise<any> {
    return this.client.delete(`/accounts/${id}`, { transformResponse: [data => data] });
  }
}
