import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { CachingClientWrapper } from '../../src/client/caching-client-wrapper';

chai.use(sinonChai);

describe('CachingClientWrapper', () => {
  const expect = chai.expect;
  let cachingClientWrapperUnderTest: CachingClientWrapper;
  let clientWrapperStub: any;
  let redisClientStub: any;
  let idMap: any;

  beforeEach(() => {
    clientWrapperStub = {
      getContactByEmail: sinon.spy(),
      createContact: sinon.spy(),
      deleteContact: sinon.spy(),
      updateContact: sinon.spy(),
    };

    redisClientStub = {
      get: sinon.spy(),
      setex: sinon.spy(),
      del: sinon.spy(),
    };

    idMap = {
      requestId: '1',
      scenarioId: '2',
      requestorId: '3',
    };
  });

  it('getContactByEmail using original function', (done) => {
    const expectedEmail = 'any@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.getContactByEmail(expectedEmail);

    setTimeout(() => {
      expect(clientWrapperStub.getContactByEmail).to.have.been.calledWith(expectedEmail);
      done();
    });
  });

  it('getContactByEmail using cache', (done) => {
    const expectedEmail = 'any@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.getContactByEmail(expectedEmail);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.getContactByEmail).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('deleteContact', (done) => {
    const expectedId = 123;
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.deleteContact(expectedId);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.deleteContact).to.have.been.calledWith(expectedId);
      done();
    });
  });

  it('createContact', (done) => {
    const request = {
      email: 'test@example.com',
      dataFields: {
        name: 'bob',
      },
      returnRepresentation: true,
    };
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.createContact(request);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.createContact).to.have.been.calledWith(request);
      done();
    });
  });

  it('updateContact', (done) => {
    const expectedId = 123;
    const request = {
      email: 'test@example.com',
      dataFields: {
        name: 'bob',
      },
      returnRepresentation: true,
    };
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.updateContact(expectedId, request);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.updateContact).to.have.been.calledWith(expectedId, request);
      done();
    });
  });

  it('getCache', (done) => {
    redisClientStub.get = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getCache('expectedKey');

    setTimeout(() => {
      expect(redisClientStub.get).to.have.been.calledWith('expectedKey');
      done();
    });
  });

  it('setCache', (done) => {
    redisClientStub.setex = sinon.stub().yields(); 
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getCache = sinon.stub().returns(null);
    cachingClientWrapperUnderTest.cachePrefix = 'testPrefix';
    cachingClientWrapperUnderTest.setCache('expectedKey', 'expectedValue');

    setTimeout(() => {
      expect(redisClientStub.setex).to.have.been.calledWith('expectedKey', 55, '"expectedValue"');
      done();
    });
  });

  it('delCache', (done) => {
    redisClientStub.del = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.delCache('expectedKey');

    setTimeout(() => {
      expect(redisClientStub.del).to.have.been.calledWith('expectedKey');
      done();
    });
  });

  it('clearCache', (done) => {
    redisClientStub.del = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.cachePrefix = 'testPrefix';
    cachingClientWrapperUnderTest.getCache = sinon.stub().returns(['testKey1', 'testKey2'])
    cachingClientWrapperUnderTest.clearCache();

    setTimeout(() => {
      expect(redisClientStub.del).to.have.been.calledWith('testKey1');
      expect(redisClientStub.del).to.have.been.calledWith('testKey2');
      expect(redisClientStub.setex).to.have.been.calledWith('cachekeys|testPrefix');
      done();
    });
  });
}); 