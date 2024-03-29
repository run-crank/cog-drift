/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class UpdateAccountStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Update a Drift account';
  protected stepExpression: string = 'update a drift account';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['update'];
  protected targetObject: string = 'Account';

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: "Account's Id",
  }, {
    field: 'ownerId',
    type: FieldDefinition.Type.STRING,
    description: 'Owner\'s Id',
  }, {
    field: 'name',
    type: FieldDefinition.Type.STRING,
    description: 'Account\'s Name',
  }, {
    field: 'domain',
    type: FieldDefinition.Type.STRING,
    description: 'Domain',
  },  {
    field: 'targeted',
    type: FieldDefinition.Type.BOOLEAN,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Is the account currently targeted?',
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
      field: 'updateDateTime',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Account\'s Update Date',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;
    const ownerId: Record<string, any> = stepData.ownerId;
    const name: Record<string, any> = stepData.name;
    const domain: Record<string, any> = stepData.domain;
    const targeted: Record<string, any> = stepData.targeted;
    try {
      const existingContact: Record<string, any> = await this.client.getAccountById(id);

      // Create if contact does not exist given an email. Otherwise, update.
      if (!existingContact) {
        return this.error('No account found with id %s', [id]);
      }

      const account = {
        ownerId,
        name,
        domain,
        targeted,
      };

      account['accountId'] = id;
      let data = await this.client.updateAccount(account);

      data = JSON.parse(data.data).data;

      if (data.customProperties && data.customProperties.length) {
        data.customProperties.forEach((p) => {
          data[p.name] = p.value;
        });
      }

      delete data.customProperties;

      data.accountId = data.accountId.includes('www.') ? data.accountId.split('www.').join('') : data.accountId;

      data.accountId = `${data.accountId.split('_')[0]}_${data.domain}`;

      const record = this.createRecord(data);
      const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);

      if (data) {
        return this.pass('Successfully updated Drift account %s', [account.name], [record, orderedRecord]);
      } else {
        return this.fail('Unable to update Drift account');
      }
    } catch (e) {
      console.log(e.response || e);
      if (e.response.data && JSON.parse(e.response.data).error) {
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
    const record = this.keyValue('account', 'Updated Account', obj);
    return record;
  }

  public createOrderedRecord(account: Record<string, any>, stepOrder = 1): StepRecord {
    const obj = account;
    const record = this.keyValue(`account.${stepOrder}`, `Updated Account from Step ${stepOrder}`, obj);
    return record;
  }
}

export { UpdateAccountStep as Step };
