FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR tests

RUN npm i --global playwright
RUN npm i @playwright/test

COPY tests/** ./

CMD npx playwright test
