export enum AuthErrorCode {
  COMPANY_NOT_ASSOCIATED = 'COMPANY_NOT_ASSOCIATED',
  COMPANY_NOT_ACTIVE = 'COMPANY_NOT_ACTIVE',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  INVALID_COMPANY_TYPE = 'INVALID_COMPANY_TYPE'
}

export const AuthErrorMessages = {
  [AuthErrorCode.COMPANY_NOT_ASSOCIATED]: 'User must be associated with a company to access inquiries',
  [AuthErrorCode.COMPANY_NOT_ACTIVE]: 'Company status must be active to access inquiries',
  [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [AuthErrorCode.SUBSCRIPTION_REQUIRED]: 'Active subscription required',
  [AuthErrorCode.INVALID_COMPANY_TYPE]: 'Invalid company type for inquiry access'
};