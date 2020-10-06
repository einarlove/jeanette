import { startOfWeek } from 'date-fns'
import powerOfficeRequest from './powerOfficeRequest'
import { PowerOfficeTimeTransaction } from './types'
import { formatDate, getTimeTrackedByEmployee, reportToSlack } from './helpers'
import { nb } from 'date-fns/locale'

const today = new Date()

async function run() {
  const timeTracked = await powerOfficeRequest<PowerOfficeTimeTransaction[]>(
    'Reporting/TimeTransactions',
    {
      fromDate: formatDate(startOfWeek(today, { locale: nb }), 'yyy-MM-dd'),
      toDate: formatDate(today, 'yyy-MM-dd'),
    }
  )

  let timesByEmployee = await getTimeTrackedByEmployee(timeTracked)
  timesByEmployee = timesByEmployee.filter(({ member }) => member)

  if (!timesByEmployee.length) {
    console.log('No employees with time tracked found')
  }

  timesByEmployee.map(({ member, times }) => {
    const memberName = member.profile.display_name || member.profile.first_name
    const weekdays = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag']
    const hasUnapprovedTimes = times.some(time => time.statusFlags === 0)

    const daysWithTimeTracked = times.map(time =>
      formatDate(new Date(time.date), 'EEEE')
    )
    const missingDays = weekdays.filter(
      weekday => !daysWithTimeTracked.includes(weekday)
    )

    if (hasUnapprovedTimes) {
      console.log(
        memberName,
        times.filter(time => time.statusFlags === 0)
      )
    }

    if (missingDays.length) {
      const daysString = missingDays.join(', ').replace(/,(?!.*,)/gim, ' og')
      const emptyString = missingDays.length > 1 ? 'tomme' : 'tom'
      reportToSlack(
        member,
        `
Kjære ${memberName}, håper du har hatt en deilig helg. Noe du av alle virkelig fortjener.
${
  hasUnapprovedTimes ? 'Du har noen timer ikke godkjent, og jeg' : 'Jeg'
} lurte på om det var noen timer denne uken som manglet å bli timeført?
Jeg ser at ${daysString} er ${emptyString}, så hvis du har skapt litt magi så synes jeg vi skal få betalt for det 😘

Kos deg resten av kvelden med din kjære ❤️
      `
      )
    } else if (hasUnapprovedTimes) {
      reportToSlack(
        member,
        `
For en uke, ${memberName}! Ikke tvil om at du leverer. Kunne du gått inn på <https://go.poweroffice.net/#timetracking/timesheet|PowerOffice> og godkjent timene dine så det er på plass?

Vær fornøyd med god insats. Kiss Kiss 💋
      `
      )
    } else {
      console.log('Skip', memberName)
    }
  })
}

const weekdayToRun = 'søndag'
const weekdayNow = formatDate(today, 'EEEE')

if (process.env.NODE_ENV !== 'production' || weekdayNow === weekdayToRun) {
  run()
} else {
  console.log(today, 'is not', weekdayToRun)
}
