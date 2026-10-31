#!/usr/bin/env node
import { discover } from "./register.js";

const catArg = process.argv.find((a) => a.startsWith("--cat="));
const cat = catArg ? catArg.split("=")[1] : "AI/DVM";
await discover(cat);
