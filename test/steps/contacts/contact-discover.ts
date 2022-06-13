import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contacts/contact-discover';

chai.use(sinonChai);

describe('DiscoverContact', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let apiClientStub: any;

  beforeEach(() => {
    // An example of how you can stub/mock API client methods.
    apiClientStub = sinon.stub();
    apiClientStub.getContactByEmail = sinon.stub();
    stepUnderTest = new Step(apiClientStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('DiscoverContact');
    expect(stepDef.getName()).to.equal('Discover fields on a Drift Contact');
    expect(stepDef.getExpression()).to.equal('discover fields on Drift contact (?<email>.+)');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Email field
    const email: any = fields.filter(f => f.key === 'email')[0];
    expect(email.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(email.type).to.equal(FieldDefinition.Type.EMAIL);
  });

  it('should respond with pass if contact exists', async () => {
    // Stub a response that matches expectations.
    const sample: any = {id: 'asdf', createdAt: 'asdf', attributes: ['a','b']};
    apiClientStub.getContactByEmail.resolves(sample);

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      email: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with fail if contact does not exist', async () => {
    // Stub a response that matches expectations.
    apiClientStub.getContactByEmail.resolves(null);

    protoStep.setData(Struct.fromJavaScript({
      email: 'expected@example.com'
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if API client throws error', async () => {
    // Stub a response that throws any exception.
    apiClientStub.getContactByEmail.throws({
      response: {
        status: 'anyStatus',
      },
      message: 'anyMessage',
    });
    protoStep.setData(Struct.fromJavaScript({
      email: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
