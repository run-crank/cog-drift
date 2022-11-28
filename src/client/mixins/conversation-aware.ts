
import { Axios } from 'axios';

export class ConversationAwareMixin {
  client: Axios;

  public async getConversations(nextPageId: string = null): Promise<any> {
    return this.client.get(`/conversations/list?limit=50${nextPageId ? `&next=${nextPageId}` : ''}`, { transformResponse: [data => data] });
  }

  public async getConversationById(conversationId: string): Promise<any> {
    return this.client.get(`/conversations/${conversationId}`, { transformResponse: [data => data] });
  }
}
