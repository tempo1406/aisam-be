import { QUEUE_NAME, QUEUE_PREFIX } from '../constants/queue.constant';

export type BullConfig = {
  name: string;
  prefix: string;
  streams: {
    events: {
      maxLen: number;
    };
  };
};

export const registerQueueConfig: BullConfig[] = [
  {
    name: QUEUE_NAME.PUBLISH_POST,
    prefix: QUEUE_PREFIX.POST,
    streams: {
      events: {
        maxLen: 100,
      },
    },
  },
  {
    name: QUEUE_NAME.CHECK_EXPIRED_SUBSCRIPTION,
    prefix: QUEUE_PREFIX.SUBSCRIPTION,
    streams: {
      events: {
        maxLen: 100,
      },
    },
  },
  {
    name: QUEUE_NAME.STATISTICS_REPORT,
    prefix: QUEUE_PREFIX.STATISTICS,
    streams: {
      events: {
        maxLen: 100,
      },
    },
  },
];

export const getQueueConfig = () => ({
  defaultJobOptions: {
    // Time to retry
    attempts: 3,
    // Time to wait between retries
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    // Auto delete job when completed
    removeOnComplete: {
      age: 86400, // 24 hours
      count: 1000, // Keep max 1000 job
    },
    // Auto delete job when failed
    removeOnFail: {
      age: 86400,
    },
  },
  // Limit the number of jobs to be processed
  limiter: {
    max: 1,
    duration: 150,
  },
});

export const buildQueueConfig = () =>
  registerQueueConfig.map((q) => ({
    name: q.name,
    prefix: q.prefix,
    ...getQueueConfig(),
  }));
