/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateAccountStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Drift account';
  protected stepExpression: string = 'create a drift account';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'account',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'account',
    type: RecordDefinition.Type.KEYVALUE,
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
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const account: Record<string, any> = stepData.account;

    const properties = [ // Properties that are not custom
      'ownerId',
      'name',
      'domain',
      'accountId',
      'deleted',
      'createDateTime',
      'updateDateTime',
      'targeted',
    ];

    try {
      let data = await this.client.createAccount(account);

      data = JSON.parse(data.data).data;

      if (data.customProperties && data.customProperties.length) {
        data.customProperties.forEach((p) => {
          data[p.name] = p.value;
        });
      }

      delete data.customProperties;
      data.accountId = data.accountId.includes('www.') ? data.accountId.split('www.').join('') : data.accountId;

      const record = this.createRecord(data);
      const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);

      if (data) {
        return this.pass('Successfully created Drift account %s', [account.name], [record, orderedRecord]);
      } else {
        return this.fail('Unable to create Drift account');
      }
    } catch (e) {
      console.log(e.response);
      if (JSON.parse(e.response.data).error) {
        return this.error('There was an error creating the account in Drift: %s', [
          JSON.parse(e.response.data).error.message,
        ]);
      }
      return this.error('There was an error creating the account in Drift: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecord(account: Record<string, any>): StepRecord {
    const obj = account;
    const record = this.keyValue('account', 'Created Account', obj);
    return record;
  }

  public createOrderedRecord(account: Record<string, any>, stepOrder = 1): StepRecord {
    const obj = account;
    const record = this.keyValue(`account.${stepOrder}`, `Created Account from Step ${stepOrder}`, obj);
    return record;
  }
}

export { CreateAccountStep as Step };
