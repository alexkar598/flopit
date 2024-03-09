import { Pipe, PipeTransform } from "@angular/core";
import { getImg, ImageTransformations } from "~/app/util";

@Pipe({
  name: "getImg",
  standalone: true,
})
export class GetImgPipe implements PipeTransform {
  transform(
    oid: string,
    transformations: ImageTransformations = {},
    bucket = "images",
  ): string {
    return getImg(oid, transformations, bucket);
  }
}
