import { registerAs } from '@nestjs/config';

function buildS3BaseUrl(): string {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_S3_REGION;
    const endpoint = process.env.AWS_S3_ENDPOINT?.trim();

    if (endpoint) {
        const normalizedEndpoint = endpoint.replace(/\/$/, '');
        return bucket ? `${normalizedEndpoint}/${bucket}` : normalizedEndpoint;
    }

    if (bucket && region) {
        return `https://${bucket}.s3.${region}.amazonaws.com`;
    }

    return '';
}

export default registerAs(
    'aws',
    (): Record<string, unknown> => ({
        s3: {
            credential: {
                key: process.env.AWS_S3_CREDENTIAL_KEY,
                secret: process.env.AWS_S3_CREDENTIAL_SECRET,
            },
            bucket: process.env.AWS_S3_BUCKET ?? 'bucket',
            region: process.env.AWS_S3_REGION,
            endpoint: process.env.AWS_S3_ENDPOINT,
            baseUrl: buildS3BaseUrl(),
        },
        ses: {
            credential: {
                key: process.env.AWS_SES_CREDENTIAL_KEY,
                secret: process.env.AWS_SES_CREDENTIAL_SECRET,
            },
            region: process.env.AWS_SES_REGION,
        },
    })
);
