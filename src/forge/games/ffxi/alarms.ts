import type { AlarmTarget } from '../../../components/alarms/alarmContext'
import { lastConquestReset } from './conquest'
import {
  nextDeparture, guildStatus, upcomingMoonEvents, dayNight, rseNow, rseSchedule,
  itemActivations,
  AIRSHIP_ROUTES, FERRY_ROUTES, MANACLIPPER_ROUTES, BARGE_ROUTES, GUILDS, RSE_RACES,
} from './data/vanaTime'

// Every armable FFXI event with its time-to-fire. Registered as the 'ffxi'
// source on the games-wide AlarmProvider; names are unprefixed (the provider
// namespaces them per source).
export function ffxiAlarmTargets(nowMs: number): AlarmTarget[] {
  const moonEvents = upcomingMoonEvents(nowMs)
  const cycle = dayNight(nowMs)
  return [
    ...[...AIRSHIP_ROUTES, ...FERRY_ROUTES, ...MANACLIPPER_ROUTES, ...BARGE_ROUTES]
      .map(r => ({ key: r.route, inMs: nextDeparture(nowMs, r).earthMsUntil })),
    ...GUILDS.map(g => ({ key: `${g.name} opens`, inMs: guildStatus(nowMs, g).nextOpenInMs })),
    { key: 'Full Moon', inMs: moonEvents.nextFullMs - nowMs },
    { key: 'New Moon', inMs: moonEvents.nextNewMs - nowMs },
    { key: 'Sunrise', inMs: cycle.sunriseInMs },
    { key: 'Sunset', inMs: cycle.sunsetInMs },
    { key: 'Conquest tally', inMs: lastConquestReset() + 7 * 86_400_000 - nowMs },
    { key: 'RSE week change', inMs: rseNow(nowMs).endsEarthMs - nowMs },
    ...RSE_RACES.map((race, i) => ({
      key: `RSE ${race} week`,
      inMs: (rseSchedule(nowMs, 2, i).find(w => w.startsEarthMs > nowMs)?.startsEarthMs ?? nowMs) - nowMs,
    })),
    ...itemActivations(nowMs).map(t => ({ key: t.item.item, inMs: t.nextFutureInMs })),
  ]
}
