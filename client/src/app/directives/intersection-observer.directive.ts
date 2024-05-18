import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";

@Directive({
  selector: "[intersectionObserver]",
  standalone: true,
})
export class IntersectionObserverDirective
  implements OnInit, AfterViewInit, OnDestroy
{
  @Output() visible = new EventEmitter();
  @Input() intersectionObserver?: HTMLElement;
  @Input() intersectionObserverMargin = "0px";

  private observer: IntersectionObserver | null = null;

  constructor(private element: ElementRef) {}

  public ngOnInit() {
    this.observer = new IntersectionObserver(
      (entries, observer) =>
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry) => {
            this.visible.emit();
          }),
      {
        rootMargin: this.intersectionObserverMargin,
        root: this.intersectionObserver,
      },
    );
  }

  ngAfterViewInit(): void {
    this.observer?.observe(this.element.nativeElement);
  }

  public ngOnDestroy() {
    this.observer?.disconnect();
  }
}
