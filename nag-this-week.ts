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
    const getWrathFromTanja = process.env.TANJA_IDS?.includes(member.id)
    const daysString = missingDays.join(', ').replace(/,(?!.*,)/gim, ' og')

    if (getWrathFromTanja && (missingDays.length || hasUnapprovedTimes)) {
      reportToSlack(
        member,
        `Fy faen, ${memberName}! Ditt inkompetente rævhøl.
Ikke klarer du en så enkel oppgave som å ${
          missingDays.length
            ? 'føre timene dine som du har fått streng beskjed om. Legg inn de manglende timene for torsdag og fredag'
            : 'godkjenne timene dine før uka er slutt'
        }. Fiks det eller så graver jeg deg et nytt rasshøl, plassere øya dine i bakhuet og fister deg med en børste. Dere søringer kan jo faen meg ingenting.`,
        true
      )
    } else if (missingDays.length) {
      reportToSlack(
        member,
        `
  Hei ${memberName}!
  Du har noen timer ikke godkjent og det kan være noen timer denne uken som mangler å bli timeført. For eksempel er ${daysString} uten førte timer.
        `
      )
    } else if (hasUnapprovedTimes) {
      reportToSlack(
        member,
        `Liten påminnelse om at timene for denne uken mangler godkjennelse. Ha en fin søndagskveld, ${memberName}.`
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
