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
    .map(({ member, times }) => {
      console.log(
        member.name,
        times.map(({ date }) => date)
      )
      reportToSlack(
        member,
        `🙈 Eeek! timene for forrige uke er ikke godkjent. Kunne du ordna det?`
      )
    })
}

const today = formatDate(new Date(), 'EEEE')
if (process.env.NODE_ENV !== 'production' || today === 'mandag') {
  run()
}
