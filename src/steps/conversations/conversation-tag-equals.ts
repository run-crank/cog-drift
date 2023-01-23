/*tslint:disable:no-else-after-return*/
/*tslint:disable:triple-equals*/

import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

import { baseOperators } from '../../client/constants/operators';
import * as util from '@run-crank/utilities';
export class ConversationTagEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a Drift conversation tag';

  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Conversion Tag';

  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<tag>.+) tag on Drift conversation (?<id>.+) should be set';

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: "Conversation's ID",
  }, {
    field: 'tag',
    type: FieldDefinition.Type.STRING,
    description: 'Tag name to check',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'conversation',
    type: RecordDefinition.Type.TABLE,
    dynamicFields: true,
    fields: [{
      field: 'name',
      type: FieldDefinition.Type.STRING,
      description: 'The conversation tag\'s name',
    }, {
      field: 'color',
      type: FieldDefinition.Type.STRING,
      description: 'The Conversation tag\'s color',
    }],
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    let conversation: any;
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;
    const expectedValue: string = stepData.tag;

    // Search Drift for a conversation given the id.
    try {
      const response = await this.client.getConversationById(id);

      conversation = JSON.parse(response.data).data;
    } catch (e) {
      console.log(e.response);
      if (JSON.parse(e.response.data).error && JSON.parse(e.response.data).error.type === 'not_found') {
        return this.error('There was an error getting the conversation in Drift: %s', [
          JSON.parse(e.response.data).error.message,
        ]);
      }
      return this.error('There was a problem connecting to Drift API.', [e.toString()]);
    }

    try {
      if (!conversation) {
        // If no results were found, return an error.
        return this.error('No conversation found with id %s', [id]);
      }

      if (!conversation.conversationTags) {
        // If no results were found, return an error.
        return this.error('No conversation tags were found conversation with id %s', [id]);
      }

      // Non-existent fields should always default to `null` for `Set` operators.
      const actualValue = conversation['conversationTags']
        ? conversation['conversationTags'].map(t => t.name) : [];

      const records = this.createRecords(conversation, stepData['__stepOrder']);

      if (actualValue.includes(expectedValue)) {
        return this.pass('The "%s" tag was one of the tags in conversation with id %s, as expected', [expectedValue, id], records);
      } else {
        return this.fail('Expected "%s" tag to be one of these values %s, but it was not', [expectedValue, actualValue], records);
      }

    } catch (e) {
      console.log(e.response);
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s. Please provide one of: %s', [e.message, baseOperators]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      if (e.response.data && JSON.parse(e.response.data).error && JSON.parse(e.response.data).error.type === 'not_found') {
        return this.error('There was an error getting the conversation in Drift: %s', [
          JSON.parse(e.response.data).error.message,
        ]);
      }

      return this.error('There was an error during validation: %s', [e.message]);
    }
  }

  public createRecords(conversations: Record<string, any>, stepOrder: number = 1): StepRecord[] {
    const headers = {};
    const headerKeys = Object.keys(conversations['conversationTags'][0] || {});
    headerKeys.forEach((key: string) => {
      headers[key] = key;
    });

    const records = [];
    // Base Record
    records.push(this.keyValue('conversation', 'Conversations', conversations));
    records.push(this.table('conversationTags', 'Conversations Tags', headers, conversations['conversationTags']));
    // Ordered Record
    records.push(this.keyValue(`conversation.${stepOrder}`, `Conversations from Step ${stepOrder}`, conversations));
    records.push(this.table(`conversationTags.${stepOrder}`, `Conversations Tags from Step ${stepOrder}`, headers, conversations['conversationTags']));
    return records;
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { ConversationTagEqualsStep as Step };
