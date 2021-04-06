import * as grpc from 'grpc';
import * as request from 'request-promise';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { ContactAwareMixin, DateAwareMixin } from './mixins';

class ClientWrapper {
  public static expectedAuthFields: Field[] = [{
    field: 'oAuthToken',
    type: FieldDefinition.Type.STRING,
    description: 'OAuth Token',
    help: 'The OAuth Token can be found in your Draft App. This is used to authenticate requests against Drift API.',
  }];

  public client: request.RequestPromiseAPI;

  constructor (auth: grpc.Metadata, clientConstructor = request) {
    // For MVP, we require Drift Integration through a Token (OAuth) only.
    // Later we shall implement refresh token-based/OAuth-based authentication.
    const oAuthToken: string = auth.get('oAuthToken').toString();
    this.client = clientConstructor.defaults({
      headers: {
        'Authorization': `Bearer ${oAuthToken}`,
      },
    });
  }

}

interface ClientWrapper extends ContactAwareMixin, DateAwareMixin {}
applyMixins(ClientWrapper, [ContactAwareMixin, DateAwareMixin]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
          // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
