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
  clientReady: Promise<boolean>;

  constructor (auth: grpc.Metadata, clientConstructor = request) {
    if (auth.get('refreshToken').toString()) {
      this.clientReady = new Promise(async (resolve, reject) => {
        try {
          const tokenDetails = await clientConstructor({
            method: 'POST',
            uri: 'https://driftapi.com/oauth2/token',
            form: {
              client_id: auth.get('clientId').toString(),
              client_secret: auth.get('clientSecret').toString(),
              refresh_token: auth.get('refreshToken').toString(),
              grant_type: 'refresh_token',
            },
            json: true,
          });
          this.client = clientConstructor.defaults({
            headers: {
              'Authorization': `Bearer ${tokenDetails.access_token}`,
            },
          });
          resolve(true);
        } catch (e) {
          reject(Error(`Authentication error, unable to refresh access token: ${e.toString()}`));
        }
       
      });
    } else {
      const oAuthToken: string = auth.get('oAuthToken').toString();
      this.client = clientConstructor.defaults({
        headers: {
          'Authorization': `Bearer ${oAuthToken}`,
        },
      });
      this.clientReady = Promise.resolve(true);
    }
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
