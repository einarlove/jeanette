import slack from 'slack'
import { startOfWeek, format } from 'date-fns'
import nbLocale from 'date-fns/locale/nb'
import { first, groupBy, pickBy, upperFirst, sortBy } from 'lodash'
import powerOfficeRequest from './powerOfficeRequest'
import {
  PowerOfficeTimeTransaction,
  PowerOfficeEmployee,
  SlackMember,
} from './types'

async function run() {
  const slackMembers = (
    await slack.users.list({ token: process.env.SLACK_TOKEN })
  ).members as SlackMember[]

  const timeTracked = await powerOfficeRequest<PowerOfficeTimeTransaction[]>(
    'Reporting/TimeTransactions',
    {
      fromDate: format(startOfWeek(new Date()), 'yyy-MM-dd'),
      toDate: format(new Date(), 'yyy-MM-dd'),
      $filter: "(StatusFlags eq '0')",
    }
  )

  for await (const [employeeCode, times] of Object.entries(
    groupBy(timeTracked, 'employeeCode')
  )) {
    const employee = first(
      await powerOfficeRequest<PowerOfficeEmployee[]>('Employee', {
        $filter: `(Code eq ${employeeCode})`,
      })
    )

    const slackMember = slackMembers.find(
      member => member.profile.email === employee.emailAddress
    )

    if (slackMember) {
      try {
        if (process.env.DRY_RUN === 'true') {
          console.log(
            `Dry run for ${slackMember.name}: \n`,
            getSlackMessage(slackMember, times)
          )
        } else {
          await slack.chat.postMessage({
            channel: slackMember.id,
            text: getSlackMessage(slackMember, times),
            token: process.env.SLACK_TOKEN,
          })
        }
        console.log('Slack message sent: ', slackMember.name)
      } catch {
        console.log('Slack message failed: ', slackMember.name)
      }
    } else {
      console.log(
        `Skip - No slack user found: ${
          employee.emailAddress ||
          [employee.firstName, employee.lastName].join(' ')
        }`
      )
    }
  }
}

function getSlackMessage(
  member: SlackMember,
  times: PowerOfficeTimeTransaction[]
) {
  return `Hei søten 💋
Jeg håper jeg ikke trenger meg på, ${
    member.profile.display_name
  }. Jeg så at du har logført noen timer denne uken i <https://go.poweroffice.net/#timetracking/timesheet|PowerOffice> som ikke er godkjent enda. Du var nok på vei uansett, men sier ifra alikevell siden vi vet begge hvordan søsteren min Jeanett reagerer når hun ikke har alle timene godkjent 🤭

${sortBy(times, 'date')
  .map(
    time => `*${upperFirst(
      format(new Date(time.date), 'EEEE', { locale: nbLocale })
    )}* · _${time.projectName}_
${time.comment || 'Uten kommentar'}
`
  )
  .join('\n')}

Kiss kiss 💃
`
}

// If REPORT_DAY is set, only run on that day. Used with scheduler. Format as 'Monday'.
if (
  !process.env.REPORT_DAY ||
  process.env.REPORT_DAY === format(new Date(), 'EEEE')
) {
  console.log('Run')
  run()
}
