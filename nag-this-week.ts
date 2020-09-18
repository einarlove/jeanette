import { startOfWeek } from 'date-fns'
import powerOfficeRequest from './powerOfficeRequest'
import { PowerOfficeTimeTransaction } from './types'
import { formatDate, getTimeTrackedByEmployee, reportToSlack } from './helpers'

async function run() {
  const timeTracked = await powerOfficeRequest<PowerOfficeTimeTransaction[]>(
    'Reporting/TimeTransactions',
    {
      fromDate: formatDate(startOfWeek(new Date()), 'yyy-MM-dd'),
      toDate: formatDate(new Date(), 'yyy-MM-dd'),
      $filter: "(StatusFlags eq '0')",
    }
  )
  const timesByEmployee = await getTimeTrackedByEmployee(timeTracked)

  timesByEmployee
    .filter(({ member }) => member)
    .map(({ member, times }) => {
      const memberName =
        member.profile.display_name || member.profile.first_name
      const weekdays = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag']
      const daysWithTimeTracked = times.map(time =>
        formatDate(new Date(time.date), 'EEEE')
      )
      const missingDays = weekdays.filter(
        weekday => !daysWithTimeTracked.includes(weekday)
      )

      if (missingDays.length) {
        const daysString = missingDays.join(', ').replace(/,(?!.*,)/gim, ' og')
        const emptyString = missingDays.length > 1 ? 'tomme' : 'tom'
        reportToSlack(
          member,
          `
Kjære ${memberName}, håper du har hatt en deilig helg. Noe du av alle virkelig fortjener.
jeg lurte på om det var noen timer denne uken som manglet å bli timeført?
Jeg ser at ${daysString} er ${emptyString}, så hvis du har skapt litt magi så synes jeg vi skal få betalt for den 😘

Kos deg resten av kvelden med din kjære ❤️
      `
        )
      } else {
        reportToSlack(
          member,
          `
For en uke, ${memberName}! Ikke tvil om at du leverer. Kunne du gått inn på <https://go.poweroffice.net/#timetracking/timesheet|PowerOffice> og godkjent timene dine så det er på plass?

Vær fornøyd med god insats. Kiss Kiss 💋
      `
        )
      }
    })
}

if (formatDate(new Date(), 'EEEE') === 'søndag') {
  run()
}
