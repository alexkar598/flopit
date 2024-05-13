import { Inject, Pipe, PipeTransform, PLATFORM_ID } from "@angular/core";
import { map, Observable, take, timer } from "rxjs";
import { isPlatformBrowser } from "@angular/common";

@Pipe({
  name: "relativeDate",
  standalone: true,
})
export class RelativeDatePipe implements PipeTransform {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  transform(
    value: Date | string,
    style: "long" | "short" = "long",
    language: Intl.UnicodeBCP47LocaleIdentifier = "fr",
    timeZone: string = "America/Toronto",
  ): Promise<string> | Observable<string> {
    const date = new Date(value);
    const now = new Date();

    const daysSince = (now.getTime() - date.getTime()) / 86400000;
    if (Math.abs(daysSince) >= 7) {
      const formatter = new Intl.DateTimeFormat(language, {
        dateStyle: style,
        timeZone,
      });
      return Promise.resolve(formatter.format(date));
    }

    const formatter = new Intl.RelativeTimeFormat(language, { style });

    if (Math.abs(daysSince) > 1)
      return Promise.resolve(formatter.format(-Math.round(daysSince), "days"));

    const hoursSince = daysSince * 24;
    if (Math.abs(hoursSince) > 1)
      return Promise.resolve(
        formatter.format(-Math.round(hoursSince), "hours"),
      );

    // past this point, we're returning an Observable

    return timer(0, 1000).pipe(
      take(this.isBrowser ? Number.POSITIVE_INFINITY : 1),
      map(() => {
        const now = new Date();

        const secondsSince = (now.getTime() - date.getTime()) / 1000;
        const minutesSince = secondsSince / 60;
        if (Math.abs(minutesSince) > 1)
          return formatter.format(-Math.round(minutesSince), "minutes");

        return formatter.format(-Math.round(secondsSince), "seconds");
      }),
    );
  }
}
