import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'relativeDate',
  standalone: true
})
export class RelativeDatePipe implements PipeTransform {

  transform(
    value: Date | string,
    style: "long" | "short" = "long",
    language: Intl.UnicodeBCP47LocaleIdentifier = "fr",
    timeZone: string = "America/Toronto"): string {

    const date = new Date(value)
    const now = new Date()

    const daysSince = (now.getTime() - date.getTime()) / 86400000;
    if (Math.abs(daysSince) >= 7) {
      const formater = new Intl.DateTimeFormat(language, {dateStyle: style, timeZone});
      return formater.format(date);
    }

    const formater = new Intl.RelativeTimeFormat(language, {style});

    if (Math.abs(daysSince) > 1) return formater.format(-Math.round(daysSince), 'days');

    const hoursSince = daysSince * 24
    if (Math.abs(hoursSince) > 1) return formater.format(-Math.round(hoursSince), 'hours');

    const minutesSince = hoursSince * 60
    if (Math.abs(minutesSince) > 1) return formater.format(-Math.round(minutesSince), 'minutes');

    const secondsSince = minutesSince * 60
    return formater.format(-Math.round(secondsSince), 'seconds');
  }

}
