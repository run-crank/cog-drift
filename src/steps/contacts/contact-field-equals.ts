/*tslint:disable:no-else-after-return*/
/*tslint:disable:triple-equals*/

import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

import { baseOperators } from '../../client/constants/operators';
import * as util from '@run-crank/utilities';
export class ContactFieldEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Drift Contact';

  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;

  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>.+) field on Drift contact (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectedValue>.+)?';

  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Contact's email address",
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
    const field: string = stepData.field;
    const expectedValue: string = stepData.expectedValue;
    const operator: string = stepData.operator || 'be';

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

      // Non-existent fields should always default to `null` for `Set` operators.
      const fieldValue = contact.attributes[field]
        ? contact.attributes[field] : null;

      const actualValue = this.client.isDate(fieldValue) ? this.client.toDate(fieldValue) : fieldValue;

      const contactRecord = this.createRecord(contact);
      const result = this.assert(operator, actualValue, expectedValue, field);

      // If the value of the field matches expectations, pass.
      // If the value of the field does not match expectations, fail.
      return result.valid ? this.pass(result.message, [], [contactRecord])
        : this.fail(result.message, [], [contactRecord]);
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s. Please provide one of: %s', [e.message, baseOperators]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }

      return this.error('There was an error during validation: %s', [e.message]);
    }
  }

  private createRecord(contact: Record<string, any>): StepRecord {
    const obj = { id: contact.id, createdAt: contact.createdAt, ...contact.attributes };
    const record = this.keyValue('contact', 'Checked Contact', obj);
    return record;
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { ContactFieldEqualsStep as Step };
