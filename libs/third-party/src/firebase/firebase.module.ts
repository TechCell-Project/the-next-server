import { DynamicModule, Module } from '@nestjs/common';
import { AppOptions } from 'firebase-admin/app';
import { FirebaseService } from './firebase.service';

@Module({})
export class FirebaseModule {
    static forRoot(config: AppOptions): DynamicModule {
        return {
            module: FirebaseModule,
            providers: [
                {
                    provide: 'FIREBASE_INIT_OPTIONS',
                    useValue: config,
                },
                FirebaseService,
            ],
            exports: [FirebaseService],
        };
    }
}
