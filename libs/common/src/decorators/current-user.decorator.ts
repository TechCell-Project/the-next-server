import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { RequestTypeEnum } from '../enums';
import { JwtPayloadType } from '~/server/auth/strategies/types';

export const getCurrentUserByContext = (context: ExecutionContext): JwtPayloadType | null => {
    switch (context.getType()?.toLowerCase()) {
        case RequestTypeEnum.Http: {
            const request = context.switchToHttp().getRequest();
            return request?.user ?? null;
        }
        case RequestTypeEnum.Rpc: {
            const ctx = context.switchToRpc().getData();
            return ctx?.user ?? null;
        }
        case RequestTypeEnum.Ws: {
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
