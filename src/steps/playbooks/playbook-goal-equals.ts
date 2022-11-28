/*tslint:disable:no-else-after-return*/
/*tslint:disable:triple-equals*/

import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

import { baseOperators } from '../../client/constants/operators';
import * as util from '@run-crank/utilities';
export class PlaybookGoalEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a a Drift Playbook Goal';

  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;

  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<goal>.+) goal on Drift playbook (?<id>.+) should be set';

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: "Conversation's ID",
  }, {
    field: 'goal',
    type: FieldDefinition.Type.STRING,
    description: 'Goal name to check',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'goal',
    type: RecordDefinition.Type.TABLE,
    dynamicFields: true,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.STRING,
      description: 'The Goal\'s ID',
    }, {
      field: 'message',
      type: FieldDefinition.Type.STRING,
      description: 'The Goal\'s message',
    }],
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    let playbooks: any = [];
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;
    const expectedValue: string = stepData.goal;

    // Search Drift for a conversation given the id.
    try {
      const response = await this.client.getPlaybooks();

      playbooks = JSON.parse(response.data);
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
      if (playbooks.length === 0) {
        // If no results were found, return an error.
        return this.error('No Playbooks found ', []);
      }

      // Filter out specific playbook
      const playbook = playbooks.find(p => p.id.toString() === id);
      if (!playbook) {
        // If no results were found, return an error.
        return this.error('No Playbooks with id %s was found', [id]);
      }

      if (!playbook.goals) {
        // If no results were found, return an error.
        return this.error('No goals were found playbook with id %s', [id]);
      }

      // Non-existent fields should always default to `null` for `Set` operators.
      const actualValue = playbook.goals
        ? playbook.goals.map(t => t.name) : [];

      const records = this.createRecords(playbook, stepData['__stepOrder']);
      if (actualValue.find(m => m.toLowerCase() === expectedValue.toLowerCase())) {
        return this.pass('The "%s" goal was one of the goals in playbook with id %s, as expected', [expectedValue, id], records);
      } else {
        return this.fail('Expected "%s" goal to be one of these values %s, but it was not', [expectedValue, actualValue], records);
      }

    } catch (e) {
      console.log(e.response);
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s. Please provide one of: %s', [e.message, baseOperators]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      if (JSON.parse(e.response.data).error && JSON.parse(e.response.data).error.type === 'not_found') {
        return this.error('There was an error getting the conversation in Drift: %s', [
          JSON.parse(e.response.data).error.message,
        ]);
      }

      return this.error('There was an error during validation: %s', [e.message]);
    }
  }

  public createRecords(playbook: Record<string, any>, stepOrder: number = 1): StepRecord[] {
    const headers = {};
    const headerKeys = Object.keys(playbook.goals[0] || {});
    headerKeys.forEach((key: string) => {
      headers[key] = key;
    });
    const records = [];
    // Base Record
    records.push(this.keyValue('playbook', 'Playbook', playbook));
    records.push(this.table('playbookGoals', 'Playbook Goals', headers, playbook.goals));
    // Ordered Record
    records.push(this.keyValue(`playbook.${stepOrder}`, `Playbook from Step ${stepOrder}`, playbook));
    records.push(this.table(`playbookGoals.${stepOrder}`, `Playbook Goals from Step ${stepOrder}`, headers, playbook.goals));
    return records;
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { PlaybookGoalEqualsStep as Step };
