export const QUEUE_NAME = {
  PUBLISH_POST: 'publish-post',
  STATISTICS_REPORT: 'statistics-report',
  GENERATE_REPORT: 'generate-report',
  GENERATE_REPORT_MANUAL: 'generate-report-manual',
  CHECK_EXPIRED_SUBSCRIPTION: 'check-expired-subscription',
  CHECK_EXPIRED_SUBSCRIPTION_MANUAL: 'check-expired-subscription-manual',
};

export const QUEUE_PREFIX = {
  POST: 'post',
  SUBSCRIPTION: 'subscription',
  STATISTICS: 'statistics',
};

export const QUEUE_PATTERN = {
  CHECK_EXPIRED_SUBSCRIPTION: '0 0 * * *',
  CHECK_EXPIRED_STATISTICS: '0 0 * * *',
};
