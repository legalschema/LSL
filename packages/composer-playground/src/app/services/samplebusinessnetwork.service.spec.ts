/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import { SampleBusinessNetworkService } from './samplebusinessnetwork.service';
import { AlertService } from '../basic-modals/alert.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { BusinessNetworkDefinition } from 'composer-common';
import { AclFile } from 'composer-common';

import {
    HttpModule,
    Response,
    ResponseOptions,
    XHRBackend
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';

describe('SampleBusinessNetworkService', () => {

    let adminMock;
    let clientMock;
    let aclFileMock;
    let alertMock;
    let businessNetworkMock = sinon.createStubInstance(BusinessNetworkDefinition);
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        adminMock = sinon.createStubInstance(AdminService);
        clientMock = sinon.createStubInstance(ClientService);
        aclFileMock = sinon.createStubInstance(AclFile);
        alertMock = sinon.createStubInstance(AlertService);

        TestBed.configureTestingModule({
            imports: [HttpModule],
            providers: [SampleBusinessNetworkService,
                {provide: AlertService, useValue: alertMock},
                {provide: AdminService, useValue: adminMock},
                {provide: ClientService, useValue: clientMock},
                {provide: AclFile, useValue: aclFileMock},
                {provide: XHRBackend, useClass: MockBackend}]
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getSampleList', () => {
        it('should get the list of sample networks', fakeAsync(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: [{name: 'bob'}]
                })));
            });

            service.getSampleList().then((result) => {
                result.should.deep.equal([{name: 'bob'}]);
            });

            tick();
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            mockBackend.connections.subscribe((connection) => {
                connection.mockError(new Error('some error'));
            });

            service.getSampleList()
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.message.should.equal('some error');
                });

            tick();
        })));
    });

    describe('deployChosenSample', () => {
        it('should deploy the chosen sample', fakeAsync(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            let mockDeployNetwork = sinon.stub(service, 'deployBusinessNetwork');
            let businessNetworkFromArchiveMock = sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(Promise.resolve({name: 'myNetwork'}));

            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: '1234'
                })));
            });

            service.deployChosenSample({name: 'bob'}, true);

            tick();

            businessNetworkFromArchiveMock.should.have.been.called;
            mockDeployNetwork.should.have.been.calledWith({name: 'myNetwork'}, true);

        })));

        it('should update the chosen sample', fakeAsync(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            let mockDeployNetwork = sinon.stub(service, 'deployBusinessNetwork');
            let businessNetworkFromArchiveMock = sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(Promise.resolve({name: 'myNetwork'}));

            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: '1234'
                })));
            });

            service.deployChosenSample({name: 'bob'}, false);

            tick();

            businessNetworkFromArchiveMock.should.have.been.called;
            mockDeployNetwork.should.have.been.calledWith({name: 'myNetwork'}, false);

        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            let mockDeployNetwork = sinon.stub(service, 'deployBusinessNetwork');
            let businessNetworkFromArchiveMock = sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(Promise.resolve({name: 'myNetwork'}));

            mockBackend.connections.subscribe((connection) => {
                connection.mockError(new Error('some error'));
            });

            service.deployChosenSample({name: 'bob'}, true)
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.message.should.equal('some error');
                });

            tick();

            businessNetworkFromArchiveMock.should.not.have.been.called;
            mockDeployNetwork.should.not.have.been.called;
        })));
    });

    describe('deployBusinessNetwork', () => {
        it('should deploy the business network definition', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.deploy.returns(Promise.resolve());
            clientMock.refresh.returns(Promise.resolve());

            alertMock.busyStatus$ = {next: sinon.stub()};

            service.deployBusinessNetwork(businessNetworkMock, true);

            tick();

            adminMock.deploy.should.have.been.called;
            clientMock.refresh.should.have.been.called;
            clientMock.reset.should.have.been.called;
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should update the business network definition', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {

            adminMock.update.returns(Promise.resolve());
            clientMock.refresh.returns(Promise.resolve());
            clientMock.getBusinessNetworkName.returns('myNetwork');

            let modalManagerMock = {addModelFiles: sinon.stub(), getModelFiles: sinon.stub().returns(['model'])};
            let scriptManagerMock = {getScripts: sinon.stub().returns(['script']), addScript: sinon.stub()};
            let aclManagerMock = {getAclFile: sinon.stub().returns('acl'), setAclFile: sinon.stub()};
            let metaData = {getPackageJson: sinon.stub().returns({}), getREADME: sinon.stub()};

            businessNetworkMock.getModelManager.returns(modalManagerMock);
            businessNetworkMock.getScriptManager.returns(scriptManagerMock);
            businessNetworkMock.getAclManager.returns(aclManagerMock);
            businessNetworkMock.getMetadata.returns(metaData);

            let mockCreateBN = sinon.stub(service, 'createNewBusinessDefinition').returns(businessNetworkMock);

            alertMock.busyStatus$ = {next: sinon.stub()};

            service.deployBusinessNetwork(businessNetworkMock, false);

            tick();

            metaData.getREADME.should.have.been.called;
            metaData.getPackageJson.should.have.been.called;
            mockCreateBN.should.have.been.called;
            clientMock.filterModelFiles.should.have.been.called;

            modalManagerMock.addModelFiles.should.have.been.called;
            scriptManagerMock.addScript.should.have.been.called;
            aclManagerMock.setAclFile.should.have.been.called;

            adminMock.update.should.have.been.called;
            clientMock.refresh.should.have.been.called;
            clientMock.reset.should.have.been.called;
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.deploy.returns(Promise.reject('some error'));

            alertMock.busyStatus$ = {next: sinon.stub()};

            service.deployBusinessNetwork(businessNetworkMock, true).then(() => {
                throw('should not get here');
            })
                .catch((error) => {
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                    error.should.equal('some error');
                });
            tick();
        })));
    });
});
