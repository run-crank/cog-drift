/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../../proto/cog_pb';

export class DeleteContactStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Drift contact';
  protected stepExpression: string = 'delete the (?<email>.+) drift contact';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Contact\'s email address',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contact',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: 'The contact\'s ID',
    }, {
      field: 'createdAt',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Contact\'s Create Date',
    }, {
      field: 'email',
      type: FieldDefinition.Type.EMAIL,
      description: 'The Contact\'s Email',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;

    try {
      const contact = await this.client.getContactByEmail(email);

      // When the email is not associated with any contact, respond with error.
      if (!contact) {
        return this.error('Contact %s was not found', [email]);
      }

      // Delete the Drift Contact.
      await this.client.deleteContact(contact.id);

      const record = this.createRecord(contact);
      return this.pass('Successfully deleted Drift contact %s', [email], [record]);
    } catch (e) {
      return this.error('There was an error deleting the Drift contact: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecord(contact: Record<string, any>): StepRecord {
    const obj = { id: contact.id, createdAt: contact.createdAt, ...contact.attributes };
    const record = this.keyValue('contact', 'Created or Updated Contact', obj);
    return record;
  }
}

export { DeleteContactStep as Step };
