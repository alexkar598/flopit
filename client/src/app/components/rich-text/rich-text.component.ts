import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { QuillViewComponent, QuillViewHTMLComponent } from "ngx-quill";

@Component({
  selector: "app-rich-text",
  standalone: true,
  imports: [QuillViewComponent, QuillViewHTMLComponent],
  templateUrl: "./rich-text.component.html",
  styleUrl: "./rich-text.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextComponent {
  @Input({ required: true })
  public html: string = null!;

  constructor(protected sanitizer: DomSanitizer) {}

  getHtml() {
    return this.sanitizer.bypassSecurityTrustHtml(this.html);
  }
}
