import { Component, Input, ViewEncapsulation } from "@angular/core";
import { QuillViewComponent } from "ngx-quill";

@Component({
  selector: "app-rich-text",
  standalone: true,
  imports: [QuillViewComponent],
  templateUrl: "./rich-text.component.html",
  styleUrl: "./rich-text.component.scss",
  encapsulation: ViewEncapsulation.None,
})
export class RichTextComponent {
  @Input({ required: true })
  public delta: any = null!;
}
