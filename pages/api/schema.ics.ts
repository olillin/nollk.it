import { Calendar, parseCalendar } from 'iamcal'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../prisma/prismaclient'

async function getCalendarUrls(): Promise<string[]> {
  const calendarLinks = await prisma.links.findMany({
    where: {
      id: {
        startsWith: '_kalender',
      },
    },
  })
  
  const calendarUrls = calendarLinks.map(link => link.url)
  
  return calendarUrls
}

async function fetchCalendar(url: string): Promise<Calendar> {
  return fetch(url)
  .then(response => {
    if (!response.ok)
      throw new Error(`Failed fetching calendar: ${response}`)
    return response.text()
  })
  .then(text => {
    return parseCalendar(text)
  })
  .catch(reason => {
    throw reason
  })
}

/**
* Merge multiple calendars together. The name will be taken from the primary calendar.
* @param calendars The calendars to merge together, where the first is the primary calendar.
* @throws If `calendars` is empty.
*/
function mergeCalendars(calendars: Calendar[]): Calendar {
  if (calendars.length === 0)
    throw new Error('At least one calendar must be provided')
  
  const primary = calendars[0]
  const secondary = calendars.splice(1)
  
  const mergedCalendar = new Calendar(primary)
  secondary.forEach(calendar => {
    mergedCalendar.addComponents(calendar.getEvents())
  })
  
  return mergedCalendar
}

function createMergedCalendar(): Promise<Calendar> {
  return getCalendarUrls()
    .then(urls =>
      Promise.all(
        urls.map(url => {
          return fetchCalendar(url).catch(() => undefined)
        })
      )
    )
    .then(calendars => {
      return mergeCalendars(
        calendars.filter(calendar => calendar != undefined)
      )
    })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const productId = '-//Teknologsektionen Informationsteknik//nollk.it//SV'
  const calendar: Calendar = await createMergedCalendar()
  .then(merged => merged.setProductId(productId))
  .catch(reason => {
    console.warn(`Failed to create merged calendar: ${reason}`)
    return new Calendar(productId)
  })
  
  const calendarBody = calendar.serialize()
  
  res.setHeader('Content-Type', 'text/calendar')
  res.setHeader('Content-Disposition', 'attachment; filename=schema.ics')
  res.status(200).send(calendarBody)
}
