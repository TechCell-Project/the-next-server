import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { RequestType } from '../enums';
import { JwtPayloadType } from '~/modules/auth/strategies/types';

export const getCurrentUserByContext = (context: ExecutionContext): JwtPayloadType | null => {
    switch (context.getType()?.toLowerCase()) {
        case RequestType.Http: {
            const request = context.switchToHttp().getRequest();
            return request?.user ?? null;
        }
        case RequestType.Rpc: {
            const ctx = context.switchToRpc().getData();
            return ctx?.user ?? null;
        }
        case RequestType.Ws: {
            const client = context.switchToWs().getClient();
            return client?.handshake?.auth?.user ?? null;
        }
        default:
            return null;
    }
};

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) =>
    getCurrentUserByContext(context),
);
