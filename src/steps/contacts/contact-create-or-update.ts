/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateOrUpdateContactStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create or update a Drift contact';
  protected stepExpression: string = 'create or update a drift contact';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'contact',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contact',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: 'The contact\'s ID',
    }, {
      field: 'email',
      type: FieldDefinition.Type.EMAIL,
      description: 'The Contact\'s Email',
    }, {
      field: 'start_date',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Contact\'s Create Date',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.contact.email;
    const contact: Record<string, any> = stepData.contact;
    let modifiedContact: Record<string, any>;

    try {
      const existingContact: Record<string, any> = await this.client.getContactByEmail(email);

      // Create if contact does not exist given an email. Otherwise, update.
      if (!existingContact) {
        modifiedContact = await this.client.createContact(contact);
      } else {
        modifiedContact = await this.client.updateContact(existingContact.id, contact);
      }

      const record = this.createRecord(modifiedContact);

      if (modifiedContact) {
        return this.pass('Successfully created or updated Drift contact %s', [email], [record]);
      } else {
        return this.fail('Unable to create or update Drift contact');
      }
    } catch (e) {
      return this.error('There was an error creating or updating the contact in Drift: %s', [
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

export { CreateOrUpdateContactStep as Step };
