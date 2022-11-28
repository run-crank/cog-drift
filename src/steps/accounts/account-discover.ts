/*tslint:disable:no-else-after-return*/
/*tslint:disable:triple-equals*/

import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

import { baseOperators } from '../../client/constants/operators';
import * as util from '@run-crank/utilities';

export class DiscoverAccountStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Discover fields on a Drift Account';

  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'discover fields on drift account (?<id>.+)';

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: "Account's ID",
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Expected field value',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'account',
    type: RecordDefinition.Type.KEYVALUE,
    dynamicFields: true,
    fields: [{
      field: 'accountId',
      type: FieldDefinition.Type.STRING,
      description: 'The account\'s ID',
    }, {
      field: 'name',
      type: FieldDefinition.Type.STRING,
      description: 'The Account\'s Name',
    }, {
      field: 'ownerId',
      type: FieldDefinition.Type.STRING,
      description: 'The Account\'s Owner ID',
    }, {
      field: 'createDateTime',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Account\'s Create Date',
    }],
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    let account: any;
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;
    const field: string = stepData.field;
    const expectedValue: string = stepData.expectedValue;
    const operator: string = stepData.operator || 'be';

    // Search Drift for a account given the id.
    try {
      account = await this.client.getAccountById(id);

      if (!account) {
        // If no results were found, return an error.
        return this.fail('No account found with id %s', [id]);
      }

      account = JSON.parse(account.data).data;
      if (account.customProperties && account.customProperties.length) {
        account.customProperties.forEach((p) => {
          account[p.name] = p.value;
        });
      }

      delete account.customProperties;

      account.accountId = account.accountId.includes('www.') ? account.accountId.split('www.').join('') : account.accountId;

    } catch (e) {
      console.log(e.response);
      if (e.response.data && JSON.parse(e.response.data).error && JSON.parse(e.response.data).error.type === 'not_found') {
        return this.error('There was an error getting the account in Drift: %s', [
          JSON.parse(e.response.data).error.message,
        ]);
      }
      return this.error('There was a problem connecting to Drift API.', [e.toString()]);
    }

    try {
      const records = this.createRecords(account, stepData['__stepOrder']);

      return this.pass('Successfully discovered fields on lead', [], records);
    } catch (e) {
      console.log(e);
      console.log(e.response.data);
      if (JSON.parse(e.response.data).error && JSON.parse(e.response.data).error.type === 'not_found') {
        return this.error('There was an error creating the account in Drift: %s', [
          JSON.parse(e.response.data).error.message,
        ]);
      }

      return this.error('There was an error checking the account: %s', [e.message]);
    }
  }

  public createRecords(account, stepOrder = 1): StepRecord[] {
    const obj = account;

    const records = [];
    // Base Record
    records.push(this.keyValue('account', 'Checked Account', obj));
    // Ordered Record
    records.push(this.keyValue(`account.${stepOrder}`, `Checked Account from Step ${stepOrder}`, obj));
    return records;
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { DiscoverAccountStep as Step };
