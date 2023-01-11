/*tslint:disable:no-else-after-return*/
/*tslint:disable:triple-equals*/

import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class DiscoverContact extends BaseStep implements StepInterface {

  protected stepName: string = 'Discover fields on a Drift contact';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['discover'];
  protected targetObject: string = 'Contact';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'discover fields on Drift contact (?<email>.+)';

  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Contact's email address",
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contact',
    type: RecordDefinition.Type.KEYVALUE,
    dynamicFields: true,
    fields: [{
      field: 'id',
      description: 'Contact ID',
      type: FieldDefinition.Type.NUMERIC,
    }, {
      field: 'email',
      description: "Contact's Email Address",
      type: FieldDefinition.Type.EMAIL,
    }, {
      field: 'start_date',
      description: "Contact's Create Date",
      type: FieldDefinition.Type.DATETIME,
    }],
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    let contact: any;
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;

    // Search Drift for a contact given the email.
    try {
      contact = await this.client.getContactByEmail(email);
    } catch (e) {
      return this.error('There was a problem connecting to Drift API.', [e.toString()]);
    }

    try {
      if (!contact) {
        // If no results were found, return an error.
        return this.fail('No contact found with email %s', [email]);
      }

      const records = this.createRecords(contact, stepData['__stepOrder']);
      return this.pass('Successfully discovered fields on contact', [], records);
    } catch (e) {
      console.log(e.response.data);
      return this.error('There was an error checking the contact: %s', [e.message]);
    }
  }

  public createRecords(contact, stepOrder = 1): StepRecord[] {
    const obj = { id: contact.id, createdAt: contact.createdAt, ...contact.attributes };

    const records = [];
    // Base Record
    records.push(this.keyValue('contact', 'Discovered Contact', obj));
    // Ordered Record
    records.push(this.keyValue(`contact.${stepOrder}`, `Discovered Contact from Step ${stepOrder}`, obj));
    return records;
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { DiscoverContact as Step };
