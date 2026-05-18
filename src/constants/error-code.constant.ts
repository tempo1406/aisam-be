export enum ErrorCode {
  // Common Validation
  V000 = 'common.validation.error',
  V001 = 'common.validation.is_invalid_email',
  V002 = 'common.validation.is_invalid_password',
  V003 = 'common.validation.is_invalid_string',
  V004 = 'common.validation.is_not_empty',
  V005 = 'common.validation.is_invalid_date_format',
  V006 = 'common.validation.is_invalid_time_format',
  V007 = 'common.validation.is_invalid_phone_number',
  V008 = 'common.validation.not_founds',

  // Validation User || Auth
  U001 = 'user.validation.is_invalid_email',
  U002 = 'user.validation.is_invalid_password',
  U003 = 'user.validation.not_found',
  U004 = 'user.validation.is_invalid_email_or_password',
  U005 = 'user.validation.email_already_exists',
  U006 = 'user.validation.already_banned',
  U007 = 'user.validation.not_banned',

  // Validation Role
  R001 = 'role.validation.is_invalid_name',
  R002 = 'role.validation.name_already_exists',

  // Validation Category
  C001 = 'category.validation.is_invalid_name',
  C002 = 'category.validation.name_already_exists',
  C003 = 'category.validation.not_found',
  C004 = 'category.validation.is_invalid_id',

  // Validation Brand
  B001 = 'brand.validation.not_found',
  B002 = 'brand.validation.creation_failed',
  B003 = 'brand.validation.update_failed',
  B004 = 'brand.validation.deletion_failed',
  B005 = 'brand.validation.name_already_exists',

  // Validation Post
  P001 = 'post.validation.not_found',
  P002 = 'post.validation.creation_failed',
  P003 = 'post.validation.update_failed',
  P004 = 'post.validation.deletion_failed',
  P005 = 'post.validation.unsupported_platform',
  // Validation Plan
  PL001 = 'plan.validation.not_found',
  PL002 = 'plan.validation.name_already_exists',
  PL003 = 'plan.validation.is_invalid_name',
  PL004 = 'plan.validation.is_invalid_currency',

  // Validation Subscription
  S001 = 'subscription.validation.not_found',
  S002 = 'subscription.validation.already_same_plan_sactive',
  S003 = 'subscription.validation.plan_not_found',
  S004 = 'subscription.validation.user_not_found',
  S005 = 'subscription.validation.cannot_cancel_expired',
  S006 = 'subscription.validation.plan_is_free',
  S007 = 'subscription.validation.already_pending',

  // Validation Hashtag Collection
  H001 = 'hashtag_collection.validation.not_found',
  H002 = 'hashtag_collection.validation.name_already_exists',
  H003 = 'hashtag_collection.validation.update_failed',
  H004 = 'hashtag_collection.validation.deletion_failed',

  // Validation Social Account
  SA001 = 'social_account.validation.not_found',
  SA002 = 'social_account.validation.creation_failed',
  SA003 = 'social_account.validation.update_failed',
  SA004 = 'social_account.validation.deletion_failed',
  SA005 = 'social_account.validation.page_already_exists',
  SA006 = 'social_account.validation.not_supported_platform',

  // Validation Facebook
  FB001 = 'facebook.validation.not_found',
  FB002 = 'facebook.validation.creation_failed',
  FB003 = 'facebook.validation.update_failed',
  FB004 = 'facebook.validation.deletion_failed',
  FB005 = 'facebook.validation.name_already_exists',
  FB006 = 'facebook.validation.not_supported_platform',
  FB007 = 'facebook.validation.token_expired',
  FB008 = 'facebook.validation.token_invalid',

  // Validation Instagram
  IG001 = 'instagram.validation.container_creation_failed',
  IG002 = 'instagram.validation.publish_failed',
  IG003 = 'instagram.validation.token_invalid',
  IG004 = 'instagram.validation.invalid_parameters',
  IG005 = 'instagram.validation.processing_error',
  IG006 = 'instagram.validation.timeout',
}
