import Api from "./mapScripApi.js";
import { onHashChanged } from "./navigation.js";
import { showLocation } from "./mapHelper.js";

// PUBLIC API -------------------------------------------

const Scriptures = {
    init: Api.init,
    onHashChanged,
    showLocation
};


export default Object.freeze(Scriptures);