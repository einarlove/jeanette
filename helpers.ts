import slack from 'slack'
import { format as _format } from 'date-fns'
import nbLocale from 'date-fns/locale/nb'
import { first, groupBy } from 'lodash'
import powerOfficeRequest from './powerOfficeRequest'
import {
  PowerOfficeTimeTransaction,
  PowerOfficeEmployee,
  SlackMember,
} from './types'

export const formatDate = (
  date: Date | number,
  format: string,
  options: object = {}
) => _format(date, format, { locale: nbLocale, ...options })

export const getTimeTrackedByEmployee = async (
  timeTracked: PowerOfficeTimeTransaction[]
) => {
  const slackMembers = (
    await slack.users.list({ token: process.env.SLACK_TOKEN })
  ).members as SlackMember[]

  return Promise.all(
    Object.entries(groupBy(timeTracked, 'employeeCode')).map(
      async ([employeeCode, times]) => {
        const employee = first(
          await powerOfficeRequest<PowerOfficeEmployee[]>('Employee', {
            $filter: `(Code eq ${employeeCode})`,
          })
        )

        return {
          employee,
          member: slackMembers.find(
            member => member.profile.email === employee.emailAddress
          ),
          times,
        }
      }
    )
  )
}

export const reportToSlack = async (member: SlackMember, message: string) => {
  if (process.env.DRY_RUN)
    return console.log(
      `\n\x1b[30m\x1b[47mDry run for ${member.name} ${member.id}: \x1b[0m\n`,
      message
    )

  try {
    await slack.chat.postMessage({
      channel: process.env.FORWARD_TO || member.id,
      text: message.trim(),
      token: process.env.SLACK_TOKEN,
    })
    console.log('Slack message sent:', member.name)
  } catch {
    console.log('Slack message failed:', member.name)
  }
}
