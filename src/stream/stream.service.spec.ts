import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamService, DEFAULT_CALL_TYPE } from './stream.service';

const upsertUsers = jest.fn().mockResolvedValue({});
const getOrCreate = jest.fn().mockResolvedValue({});
const generateCallToken = jest.fn().mockReturnValue('mock-jwt');

jest.mock('@stream-io/node-sdk', () => ({
  StreamClient: jest.fn().mockImplementation(() => ({
    upsertUsers,
    generateCallToken,
    video: {
      call: jest.fn().mockReturnValue({ getOrCreate }),
    },
  })),
}));

describe('StreamService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeService(config: Record<string, string>) {
    const configService = {
      get: (k: string) => config[k],
    } as unknown as ConfigService;
    return new StreamService(configService);
  }

  it('throws when Stream keys are missing', async () => {
    const svc = makeService({});
    await expect(svc.createSalesDemoSession()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('upserts users, creates call, returns call-scoped token', async () => {
    const svc = makeService({
      STREAM_API_KEY: 'key',
      STREAM_API_SECRET: 'secret',
    });
    const result = await svc.createSalesDemoSession('Alice');

    expect(upsertUsers).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Alice' }),
        expect.objectContaining({ name: 'Wubble Sales AI' }),
      ]),
    );
    expect(getOrCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        video: true,
        members: expect.any(Array),
      }),
    });
    expect(generateCallToken).toHaveBeenCalledWith(
      expect.objectContaining({
        call_cids: expect.arrayContaining([
          expect.stringMatching(new RegExp(`^${DEFAULT_CALL_TYPE}:`)),
        ]),
      }),
    );
    expect(result.apiKey).toBe('key');
    expect(result.token).toBe('mock-jwt');
    expect(result.callType).toBe(DEFAULT_CALL_TYPE);
  });
});
