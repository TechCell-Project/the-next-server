export type AppConfiguration = {
    nodeEnv: string;
    apiPort: number;
};

export default (): AppConfiguration =>
    ({
        nodeEnv: process.env.NODE_ENV || 'development',
        apiPort: parseInt(process.env.API_PORT ?? '8000', 10),
    }) as const;
