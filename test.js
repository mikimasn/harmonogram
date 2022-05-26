import { createRequire } from "module";
import { makeid } from "./functions.js";
const require = createRequire(import.meta.url);

import {oauth2} from "./oauth2.js";
console.log(makeid(128));
