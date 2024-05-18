export * from "@nebular/theme";

type NbMenuItem = import("@nebular/theme").NbMenuItem;

module "@nebular/theme" {
  type NbClickableMenuItem<Base extends NbMenuItem = NbMenuItem> = Omit<
    Base,
    "data"
  > &
    (
      | {
          data: {
            [key: string]: unknown;
            onClick: () => unknown;
          };
        }
      | { link: string }
      | { url: string }
    );
}
