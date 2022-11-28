/*tslint:disable:no-else-after-return*/
/*tslint:disable:triple-equals*/

import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class ListConversation extends BaseStep implements StepInterface {

  protected stepName: string = 'List Conversations from Drift';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'get a list of conversations from drift';

  protected expectedFields: Field[] = [];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'conversation',
    type: RecordDefinition.Type.TABLE,
    dynamicFields: true,
    fields: [{
      field: 'id',
      description: "Conversation's ID",
      type: FieldDefinition.Type.STRING,
    }, {
      field: 'status',
      description: "Conversation's Status",
      type: FieldDefinition.Type.STRING,
    }, {
      field: 'contactId',
      description: "Conversation's Contact ID",
      type: FieldDefinition.Type.STRING,
    }, {
      field: 'inboxId',
      description: "Conversation's Inbox ID",
      type: FieldDefinition.Type.STRING,
    }],
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    let conversations: any[] = [];
    let hasMore = true;
    let nextOffset = '0';

    try {
      while(hasMore) {
        try {
          let response = await this.client.getConversations(nextOffset);
          response = JSON.parse(response.data);
          conversations = [...conversations, ...response.data];
          if (response.pagination && response.pagination.more) {
            nextOffset = response.pagination.next;
          } else {
            hasMore = false;
          }
        } catch (e) {
          hasMore = false;
          throw (e);
        }
        
      }

    } catch (e) {
      console.log(e.response);
      return this.error('There was a problem connecting to Drift API.', [e.toString()]);
    }

    try {
      if (conversations.length === 0) {
        // If no results were found, return an error.
        return this.error('No conversations were found', []);
      }

      const records = this.createRecords(conversations, stepData['__stepOrder']);
      return this.pass('Successfully listed conversations', [], records);
    } catch (e) {
      console.log(e.response);
      return this.error('There was an error checking conversations: %s', [e.message]);
    }
  }

  public createRecords(conversations: Record<string,any>[], stepOrder: number = 1): StepRecord[] {
    const headers = {};
    const headerKeys = Object.keys(conversations[0] || {});
    headerKeys.forEach((key: string) => {
      headers[key] = key;
    });
    const records = [];
    // Base Record
    records.push(this.table('conversation', 'List Conversations', headers, conversations));
    // Ordered Record
    records.push(this.table(`conversation.${stepOrder}`, `List Conversations from Step ${stepOrder}`, headers, conversations));
    return records;
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { ListConversation as Step };
