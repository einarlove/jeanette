export type PowerOfficeTimeTransaction = {
  id: number
  date: string
  customerCode: number
  customerName: string
  projectCode: string
  projectName: string
  projectBillingMethod: number
  activityCode: string
  activityName: string
  employeeCode: number
  employeeName: string
  comment: string
  internalComment: string
  hours: number
  hourlyRate: number
  billableHours: number
  billableAmount: number
  approvalStatus: number
  statusFlags: number
  costRate: number
  costPrice: number
  margin: number
  marginPercent: number
  isAccrued: boolean
  isInvoicedExternally: boolean
}

export type PowerOfficeEmployee = {
  // Excerpt of properties. Rest visible at https://api.poweroffice.net/Web/docs/index.html#reference/rest/Route_GET_Employee__id__.md
  id: number
  emailAddress: string
  phoneNumber: string
  firstName: string
  lastName: string
}

export type SlackMember = {
  id: string
  team_id: string
  name: string
  deleted: boolean
  color: string
  real_name: string
  tz: string
  tz_label: string
  tz_offset: number
  profile: {
    avatar_hash: string
    status_text: string
    status_emoj: string
    real_name: string
    display_name: string
    real_name_normalized: string
    display_name_normalized: string
    email: string
    image_24: string
    image_32: string
    image_48: string
    image_72: string
    image_192: string
    image_512: string
    team: string
  }
  is_admin: boolean
  is_owner: boolean
  is_primary_owner: boolean
  is_restricted: boolean
  is_ultra_restricted: boolean
  is_bot: boolean
  updated: number
  is_app_user: boolean
  has_2fa: boolean
}
