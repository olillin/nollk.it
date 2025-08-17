import { Calendar, ONE_MINUTE_MS, parseCalendar } from 'iamcal'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../prisma/prismaclient'

/** Represents the default expiration time of the calendar cache, in minutes. */
const DEFAULT_CALENDAR_CACHE_EXPIRATION_TIME = 180 // Three hours in minutes

/** Represents the expiration time of the calendar cache, in minutes. */
const calendarCacheExpirationTime = getCalendarCacheExpirationTime()

/**
 * Get calendar cache expiration time from the environment.
 * @param defaultExpirationMinutes The time to return if `CALENDAR_CACHE_EXPIRATION_TIME` is unset or invalid.
 * @returns The parsed value of `CALENDAR_CACHE_EXPIRATION_TIME` or the default time, in minutes.
 */
function getCalendarCacheExpirationTime(
  defaultExpirationMinutes: number = DEFAULT_CALENDAR_CACHE_EXPIRATION_TIME
) {
  const environmentExpirationTime = process.env.CALENDAR_CACHE_EXPIRATION_TIME

  if (environmentExpirationTime) {
    try {
      return parseInt(environmentExpirationTime)
    } catch {
      console.warn(
        `Failed to parse calendar cache expiration time "${environmentExpirationTime}" ` +
          `from environment, should be an integer representing the time in minutes. ` +
          `Using default time of ${defaultExpirationMinutes} minutes.`
      )
    }
  }

  return defaultExpirationMinutes
}

class CachedCalendar {
  /** The serialized body of the calendar in iCalendar format. */
  calendarBody: string
  /** The URLs this calendar was created from. */
  urls: string[]
  /** How long after creation the cache will be considered stale, in minutes.  */
  expirationTimeMinutes: number
  /** The time when this cache was created. Expressed in milliseconds elapsed since midnight, January 1, 1970 Universal Coordinated Time (UTC). */
  time: number

  /**
   * @param calendarBody The serialized body of the calendar in iCalendar format.
   * @param urls The URLs this calendar was created from.
   * @param expirationTime How long after creation the cache will be considered stale, in minutes.
   */
  constructor(
    calendarBody: string,
    urls: string[],
    expirationTime: number = calendarCacheExpirationTime
  ) {
    this.calendarBody = calendarBody
    this.urls = urls
    this.expirationTimeMinutes = expirationTime
    this.time = Date.now()
  }

  /**
   * Get the age of this cache.
   * @returns The age of this cache, in minutes rounded down.
   */
  getAgeMinutes(): number {
    return Math.floor((Date.now() - this.time) / ONE_MINUTE_MS)
  }

  /**
   * Check if this cache is expired.
   * @returns `true` if expired, `false` otherwise.
   */
  isExpired(): boolean {
    return this.getAgeMinutes() >= this.expirationTimeMinutes
  }

  /**
   * Check if this cache is invalidated by changed URLs.
   * @param urls The current calendar URLs.
   * @returns `true` if the URLs have changed, `false` otherwise.
   */
  isInvalidated(urls: string[]): boolean {
    return this.urls.join() !== urls.join()
  }

  /**
   * Get the cached calendar body if not stale.
   * @returns The cached calendar body or nothing if stale.
   */
  async getCalendarBody(): Promise<string | null> {
    if (cachedCalendar === null || cachedCalendar.isExpired()) {
      return null
    }

    const calendarUrls = await getCalendarUrls()
    if (cachedCalendar.isInvalidated(calendarUrls)) {
      return null
    }

    return cachedCalendar.calendarBody
  }
}

let cachedCalendar: CachedCalendar | null = null

/** Save a calendar body to the cache. */
async function cacheCalendarBody(calendarBody: string) {
  const calendarUrls = await getCalendarUrls()
  cachedCalendar = new CachedCalendar(calendarBody, calendarUrls)
}

/**
 * Get the calendar URLs from the database. Calendar links are all links that
 * start with `_kalender`.
 * @returns A string array containing the URLs.
 */
async function getCalendarUrls(): Promise<string[]> {
  const calendarLinks = await prisma.links.findMany({
    where: {
      id: {
        startsWith: '_kalender',
      },
    },
  })
  
  const calendarUrls = calendarLinks.map(link => link.url)
  calendarUrls.forEach((url, index) => {
    if (calendarUrls.lastIndexOf(url) !== index) {
      throw new Error('Links contain duplicate calendar URLs. Calendar events must be unique.')
    }
  })
  
  return calendarUrls
}

/**
 * Fetch and parse a calendar hosted at `url`.
 * @param url The URL to fetch the calendar from.
 * @throws If the calendar cannot be fetched.
 * @throws If parsing the calendar text failed.
 * @returns The parsed calendar after fetching the URL.
 */
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
 * Merge multiple calendars together. The name and other properties will be
 * taken from the first calendar.
 * @param calendars The calendars to merge together.
 * @throws If `calendars` is empty.
 * @returns The merged calendar.
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

/**
 * Create a merged calendar from the calendar links in the database.
 * @param productId The product id of the newly created calendar.
 * @throws If the calendar could not be created.
 * @returns A merged calendar generated from the links.
 */
async function createMergedCalendar(productId: string): Promise<Calendar> {
  const calendar: Calendar = await getCalendarUrls()
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
      ): maybeCalendar is Calendar => maybeCalendar !== undefined

      const filteredCalendars: Calendar[] = calendars.filter(isCalendar)
      return mergeCalendars(filteredCalendars)
    })
    .catch(reason => {
      throw reason
    })

  calendar.setProductId(productId)
  return calendar
}

/**
 * Create a merged calendar, or return the cached calendar if it exists. And cache
 * it if creating a new one.
 * @returns The new merged calendar, or the cached calendar if it exists and is not expired.
 */
async function getCalendarBodyWithCache(): Promise<string> {
  const cached = await cachedCalendar?.getCalendarBody()
  if (cached) {
    return cached
  }

  const productId = '-//Teknologsektionen Informationsteknik//nollk.it//SV'
  const calendarBody = await createMergedCalendar(productId)
    .then(calendar => calendar.serialize())
    .catch(reason => {
      throw new Error(`Failed to create calendar body: ${reason}`)
    })

  cacheCalendarBody(calendarBody)
  return calendarBody
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
  try {
    const calendarBody = await getCalendarBodyWithCache()
    res.setHeader('Content-Type', 'text/calendar')
    res.setHeader('Content-Disposition', 'attachment; filename=schema.ics')
    res.status(200).end(calendarBody)
  } catch (e) {
    res.status(500).json({
      error: {
        message: "Failed to get calendar content",
        details: String(e)
      }
    })
  }
}
