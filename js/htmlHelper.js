const htmlAnchor = function(volume) {
    return `<a name="v${volume.id}" />`;
};

const htmlDiv = function (parameters) {
    let classString = "";
    let contentString = "";
    let idString = "";

    if (parameters.classKey !== undefined) {
        classString = ` class="${parameters.classKey}"`;
    }
    if (parameters.content !== undefined) {
        contentString = parameters.content;
    }
    if (parameters.id !== undefined) {
        idString = ` id="${parameters.id}"`;
    }

    return `<div${idString}${classString}>${contentString}</div>`;
};

const htmlElement = function (tagName, content, classValue) {
    let classString = "";

    if (classValue !== undefined) {
        classString = ` class="${classValue}"`;
    }

    return `<${tagName}${classString}>${content}</${tagName}>`;
};

const htmlImg = function (parameters) {
    let srcString = '';
    let altString = '';
    let classString = '';
    let idString = '';
    
    if (parameters.src !== undefined) {
        srcString = `src="${parameters.src}"`;
    }
    if (parameters.alt !== undefined) {
        altString = ` alt="${parameters.alt}"`
    }
    if (parameters.classKey !== undefined) {
        classString = ` class="${parameters.classKey}"`;
    }
    if (parameters.id !== undefined) {
        idString = ` id="${parameters.id}"`;
    }

    return `<img ${srcString}${classString}${idString}${altString} />`;
}

const htmlLink = function (parameters) {
    let classString = '';
    let contentString = '';
    let hrefString = '';
    let idString = '';
    let titleString = '';
    let altString = '';
    
    if (parameters.classKey !== undefined) {
        classString = ` class="${parameters.classKey}"`;
    }
    if (parameters.content !== undefined) {
        contentString = parameters.content;
    }
    if (parameters.href !== undefined) {
        hrefString = ` href="${parameters.href}"`;
    }
    if (parameters.id !== undefined) {
        idString = ` id="${parameters.id}"`;
    }
    if (parameters.title !== undefined) {
        titleString = ` title="${parameters.title}"`;
    }
    if (parameters.alt !== undefined) {
        altString = ` alt="${parameters.alt}"`
    }

    return `<a${idString}${classString}${hrefString}${titleString}${altString}>${contentString}</a>`;
};

export { htmlAnchor, htmlDiv, htmlElement, htmlImg, htmlLink }