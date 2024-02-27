import * as fs from "fs";
import { printSchema } from "graphql/utilities";
import { builder } from "../src/schema/_builder.js";
import path from "node:path";
import { schema, writeSchemaToFile } from "../src/schema.ts";

writeSchemaToFile("schema.graphql");
