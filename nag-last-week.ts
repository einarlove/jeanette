import { startOfWeek, subDays } from 'date-fns'
import powerOfficeRequest from './powerOfficeRequest'
import { PowerOfficeTimeTransaction } from './types'
import { formatDate, getTimeTrackedByEmployee, reportToSlack } from './helpers'

async function run() {
  const yeasterday = subDays(new Date(), 1)
  const timeTracked = await powerOfficeRequest<PowerOfficeTimeTransaction[]>(
    'Reporting/TimeTransactions',
    {
      fromDate: formatDate(startOfWeek(yeasterday), 'yyy-MM-dd'),
      toDate: formatDate(yeasterday, 'yyy-MM-dd'),
      $filter: "(StatusFlags eq '0')",
    }
  )
  const timesByEmployee = await getTimeTrackedByEmployee(timeTracked)

  timesByEmployee
    .filter(({ member }) => member)
    .map(({ member }) => {
      reportToSlack(
        member,
        `🙈 Eeek! timene for forrige uke er ikke godkjent. Kunne du ordna det?`
      )
    })
}

run()
