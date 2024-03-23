import { TestBed } from '@automock/jest';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
    let appController: AppController;

    beforeEach(async () => {
        const { unit } = TestBed.create(AppController)
            .mock(AppService)
            .using({
                getHello: () => 'Hello World!',
            })
            .compile();

        appController = unit;
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(appController.getHello()).toBe('Hello World!');
        });
    });
});
