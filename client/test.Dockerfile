FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR tests

COPY tests/** ./

RUN npm i --global playwright
RUN npm i @playwright/test

CMD npx playwright test
