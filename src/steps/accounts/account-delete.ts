/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class DeleteAccountStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Drift account';
  protected stepExpression: string = 'delete the drift account with id (?<id>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: "Account's ID",
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
      field: 'deleteDateTime',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Account\'s Delete Date',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;

    try {
      await this.client.deleteAccount(id);
      const record = this.createRecord({ accountId: id });

      return this.pass('Successfully deleted Drift account %s', [id], [record]);
    } catch (e) {
      console.log(e.response);
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
    const record = this.keyValue('account', 'Deleted Account', obj);
    return record;
  }
}

export { DeleteAccountStep as Step };
