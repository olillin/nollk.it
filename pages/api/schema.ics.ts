import { Calendar, ONE_MINUTE_MS, parseCalendar } from 'iamcal'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../prisma/prismaclient'

/** Represents the default calendar cache expiration time, in minutes. */
const DEFAULT_CALENDAR_CACHE_EXPIRATION = 180 // Three hours in minutes

/** Represents the calendar cache expiration time, in minutes. */
const calendarCacheExpiration = getCalendarCacheExpiration()

function getCalendarCacheExpiration(
  defaultMinutes: number = DEFAULT_CALENDAR_CACHE_EXPIRATION
) {
  try {
    if (process.env.CALENDAR_CACHE_EXPIRATION) {
      return parseInt(process.env.CALENDAR_CACHE_EXPIRATION)
    } else {
      return defaultMinutes
    }
  } catch {
    console.warn(
      `Failed to parse calendar cache expiration "${process.env.CALENDAR_CACHE_EXPIRATION}", ` +
      `should be an integer representing the time in minutes. `+ 
      `Using default time of ${defaultMinutes} minutes.`
    )
    return defaultMinutes
  }
}

let cachedCalendarBody: string | null = null
let cachedCalendarTime: number = 0
let cachedCalendarUrls: string = ''

/** Get the cached calendar body, or nothing if unset or expired. */
async function getCachedCalendarBody(): Promise<string | null> {
  const cacheAgeMinutes = (Date.now() - cachedCalendarTime) / ONE_MINUTE_MS
  if (cacheAgeMinutes >= calendarCacheExpiration) {
    // Cache invalidated by expiration time
    return null
  }

  const calendarUrls = await (await getCalendarUrls()).join()
  if (calendarUrls != cachedCalendarUrls) {
    // Cache invalidated by changed URLs
    return null
  }

  return cachedCalendarBody
}

/** Save a calendar body to the cache and save the cached time. */
async function cacheCalendarBody(calendarBody: string) {
  cachedCalendarBody = calendarBody
  cachedCalendarTime = Date.now()
  cachedCalendarUrls = (await getCalendarUrls()).join()
}

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

async function createMergedCalendar(
  productId: string
): Promise<Calendar> {
  const calendar = await getCalendarUrls()
    .then(urls =>
      Promise.all(
        urls.map(url => {
          return fetchCalendar(url).catch(() => undefined)
        })
      )
    )
    .then(calendars => {
      const isCalendar = (
        maybeCalendar: Calendar | undefined
      ): maybeCalendar is Calendar => calendar !== undefined
      
      const filteredCalendars: Calendar[] = calendars.filter(isCalendar)
      return mergeCalendars(filteredCalendars)
    })
  calendar.setProductId(productId)
  return calendar
}

/**
 * Create a merged calendar, or return the cached calendar if it exists. And cache
 * it if creating a new one.
 * @param productId The product id of the calendar if creating a new one.
 * @returns The new merged calendar, or the cached calendar if it exists and is not expired.
 */
async function createCalendarBodyWithCache(productId: string): Promise<string> {
  const cached = await getCachedCalendarBody()
  if (cached) {
    return cached
  }
  const mergedCalendar = await createMergedCalendar(productId)
  const calendarBody =  mergedCalendar.serialize()
  cacheCalendarBody(calendarBody)
  return calendarBody
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const productId = '-//Teknologsektionen Informationsteknik//nollk.it//SV'
  const calendarBody: string = await createCalendarBodyWithCache(productId)
    .catch(reason => {
      console.warn(`Failed to create merged calendar: ${reason}`)
      return new Calendar(productId).serialize()
    })
  
  res.setHeader('Content-Type', 'text/calendar')
  res.setHeader('Content-Disposition', 'attachment; filename=schema.ics')
  res.status(200).send(calendarBody)
}
