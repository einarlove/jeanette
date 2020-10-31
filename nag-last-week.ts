import { startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import nbLocale from 'date-fns/locale/nb'
import powerOfficeRequest from './powerOfficeRequest'
import { PowerOfficeTimeTransaction } from './types'
import { formatDate, getTimeTrackedByEmployee, reportToSlack } from './helpers'

async function run() {
  const lastWeek = subWeeks(new Date(), 1)
  const timeTracked = await powerOfficeRequest<PowerOfficeTimeTransaction[]>(
    'Reporting/TimeTransactions',
    {
      fromDate: formatDate(
        startOfWeek(lastWeek, { locale: nbLocale }),
        'yyy-MM-dd'
      ),
      toDate: formatDate(
        endOfWeek(lastWeek, { locale: nbLocale }),
        'yyy-MM-dd'
      ),
      $filter: "(StatusFlags eq '0')",
    }
  )

  const timesByEmployee = await getTimeTrackedByEmployee(timeTracked)

  timesByEmployee
    .filter(({ member }) => member)
    .map(({ member }) => {
      const getWrathFromTanja = process.env.TANJA_IDS?.includes(member.id)
      const memberName =
        member.profile.display_name || member.profile.first_name
      if (getWrathFromTanja) {
        reportToSlack(
          member,
          `Satan som jeg må mase!
GODKJENN TIMENE DINE!`,
          true
        )
      } else {
        reportToSlack(
          member,
          `Timene er fortsatt ikke godkjente. Nå føler jeg meg som en masehøne, ${memberName} 😣`
        )
      }
    })
}

const dayToRun = 'mandag'
const today = formatDate(new Date(), 'EEEE')

if (process.env.NODE_ENV !== 'production' || today === dayToRun) {
  run()
} else {
  console.log(today, 'is not', dayToRun)
}
