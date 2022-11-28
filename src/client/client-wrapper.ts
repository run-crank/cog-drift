import * as grpc from 'grpc';
import * as request from 'request-promise';
import * as axios from 'axios';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { AccountAwareMixin, ContactAwareMixin, ConversationAwareMixin, DateAwareMixin, PlaybookAwareMixin } from './mixins';

class ClientWrapper {
  public static expectedAuthFields: Field[] = [{
    field: 'oAuthToken',
    type: FieldDefinition.Type.STRING,
    description: 'OAuth Token',
    help: 'The OAuth Token can be found in your Draft App. This is used to authenticate requests against Drift API.',
  }];

  public client: any;

  constructor (auth: grpc.Metadata, clientConstructor = axios) {
    // For MVP, we require Drift Integration through a Token (OAuth) only.
    // Later we shall implement refresh token-based/OAuth-based authentication.
    this.client = clientConstructor;
    const oAuthToken: string = auth.get('oAuthToken').toString();
    this.client.defaults.headers.common['Authorization'] = `Bearer ${oAuthToken}`;
    this.client.defaults.baseURL = 'https://driftapi.com';
    this.client.defaults.headers.post['Content-Type'] = 'application/json';
    this.client.defaults.headers.get['Content-Type'] = 'application/json';
    this.client.defaults.headers.patch['Content-Type'] = 'application/json';
  }

}

interface ClientWrapper extends ContactAwareMixin, DateAwareMixin, AccountAwareMixin, ConversationAwareMixin, PlaybookAwareMixin {}
applyMixins(ClientWrapper, [ContactAwareMixin, DateAwareMixin, AccountAwareMixin, ConversationAwareMixin, PlaybookAwareMixin]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
          // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
