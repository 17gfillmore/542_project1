import { setupMarkers } from "./mapHelper.js";
import { htmlDiv, htmlAnchor, htmlElement, htmlImg, htmlLink } from "./htmlHelper.js";
import { ajax, books, volumes, encodedScripturesUrlParameters } from "./mapScripApi.js"
import { animateToNewChapter, crossfade } from "./animation.js";

// CONSTANTS -----------------------------------------------
const BOTTOM_PADDING = "<br /><br />";
const BOOKID_SKIPS_PREV = {201: '166', 301: '219', 401: '303'}
const CLASS_BOOKS = "books";
const CLASS_BUTTON = "btn";
const CLASS_CHAPTER = "chapter";
const CLASS_VOLUME = "volume";
const DIV_PREVNEXT = 'prevnext';
const DIV_BREADCRUMBS = 'breadcrumbs';
const DIV_SCRIPTURES = 'scripnav2'; // this is the invisible div that is then animated to take the place of scripnav1
const TAG_HEADERS = "h5";
const ICON_CRUMB = htmlImg({
    src: "./chevron-right.svg",
    id: "crumb",
    alt: "breadcrumb icon"
});
const ICON_NEXT = htmlImg({
    src: "./chevron-bar-right.svg",
});
const ICON_PREV = htmlImg({
    src: "./chevron-bar-left.svg",
});

const bookChapterValid = function (bookId, chapter) {
    let book = books[bookId];

    if (book === undefined || chapter < 0 || chapter > book.numChapters) {
        return false;
    }
    if (chapter === 0 && book.numChapters > 0) {
        return false;
    }

    return true;
};

const booksGrid = function (volume) {
    return htmlDiv({
        classKey: CLASS_BOOKS,
        content: booksGridContent(volume)
    });
};

const booksGridContent = function (volume) {
    let gridContent = '';

    volume.books.forEach(function (book) {
        gridContent += htmlLink({
            classKey: CLASS_BUTTON,
            id: book.id,
            href: `#${volume.id}:${book.id}`,
            content: book.gridName
        });
    });

    return gridContent;
};

const chaptersGrid = function (book) {
    return htmlDiv({
        classKey: CLASS_VOLUME,
        content: htmlElement(TAG_HEADERS, book.fullName)
    }) + htmlDiv({
        classKey: CLASS_BOOKS,
        content: chaptersGridContent(book)
    });
};

const chaptersGridContent = function (book) {
    let gridContent = '';
    let chapter = 1;

    while (chapter <= book.numChapters) {
        gridContent += htmlLink({
            classKey: `${CLASS_BUTTON} ${CLASS_CHAPTER}`,
            id: chapter,
            href: `#0:${book.id}:${chapter}`,
            content: chapter
        });

        chapter += 1;
    }

    return gridContent;
};

const getScripturesCallback = function (chapterHtml, animationType) {
    // document.getElementById("scriptures").innerHTML = chapterHtml;
    animateToNewChapter(chapterHtml, animationType);
    setupMarkers();
};

const getScripturesFailure = function () {
    document.getElementById(DIV_SCRIPTURES).innerHTML = 'unable to retrieve chapter contents.';
};

const navigateBook = function(bookId) {
    let book = books[bookId];

    resetElement(DIV_PREVNEXT);
    setBreadcrumbs(book.parentBookId, bookId)

    if (book.numChapters <= 1) { // go straight to the text
        navigateChapter(bookId, book.numChapters);
    } else {        // when navigating to the chapter links view
        animateToNewChapter(chaptersGrid(book))
    }
    setupMarkers();
};

const navigateChapter = function(bookId, chapter, animationType) {
    setBreadcrumbs(books[bookId].parentBookId, bookId, chapter)
    setPrevNext(bookId, chapter);

    // TODO? update this to use new api (fetch) instead of ajax
    ajax(encodedScripturesUrlParameters(bookId, chapter), getScripturesCallback, getScripturesFailure, true, animationType);
};

const navigateHome = function(volumeId) {
    volumeId 
        ? setBreadcrumbs(volumeId)
        : resetElement(DIV_BREADCRUMBS);
    resetElement(DIV_PREVNEXT);

    animateToNewChapter(volumesGridContent(volumeId))
    setupMarkers();
};

const onHashChanged = function () {
    let ids = [];
    
    if (location.hash !== '' && location.hash.length > 1) {
        ids = location.hash.slice(1).split(':');
    }

    if (ids.length <= 0) {
        navigateHome();
    } else if (ids.length === 1) {
        let volumeId = Number(ids[0]);

        if (volumeId < volumes[0].id || volumeId > volumes.slice(-1)[0].id) {
            navigateHome();
        } else {
            navigateHome(volumeId);
        }
    } else {
        let bookId = Number(ids[1]);

        if (books[bookId] === undefined) {
            navigateHome();
        } else {
            if (ids.length === 2) {
                navigateBook(bookId);
            } else {
                let chapter = Number(ids[2]);
                let animationType = ids[3] || '';

                if (bookChapterValid(bookId, chapter)) {
                    navigateChapter(bookId, chapter, animationType);
                } else {
                    navigateHome();
                }
            }
        }
    }
};

const resetElement = function (elementId, hideDisplay=true) {
    document.getElementById(elementId).innerHTML = '';
    
    if (hideDisplay) {
        document.getElementById(elementId).style.display = 'none';
    }
}

const setBreadcrumbs = function (volumeId, bookId, chapter) {
    // the way this is set up assumes that it's only called with parameters for which breadcrumbs are needed.
    // if you haven't navigated to a book, don't pass a book in. etc
    document.getElementById(DIV_BREADCRUMBS).style.display = 'flex'

    let crumbs = '';
    if (volumeId) {
        crumbs = htmlLink({
            id: "home",
            content: "Home",
            classKey: "crumbLink",
            href: "#"
        })
        crumbs += '<div id="crumby">' + ICON_CRUMB + htmlLink({
            id: "volume",
            content: `${volumes[volumeId - 1].fullName}`, // volumeId - 1 because the id is inside the array items, and I didn't want to search because they are ordered
            ...(bookId) && {classKey: "crumbLink"},
            ...(bookId) && {href: `#${volumeId}`} // only make the crumb a clickable link if we've navigated past it (e.g. are looking at a book)
        }) + '</div>'
    }
    if (bookId) {
        crumbs += '<div id="crumby">' + ICON_CRUMB + htmlLink({
            id: 'book',
            content: `${books[bookId].fullName}`,
            ...(chapter) && {classKey: "crumbLink"},
            ...(chapter) && {href: `#${volumeId}:${bookId}`}
        }) + '</div>'
    }
    if (chapter) {
        crumbs += '<div id="crumby">' + ICON_CRUMB + htmlLink({
            content: `${titleForBookChapter(books[bookId], chapter)}`
        }) + '</div>'
    }

    document.getElementById(DIV_BREADCRUMBS).innerHTML = crumbs;
}

const setPrevNext = function (bookId, chapter) {
    document.getElementById(DIV_PREVNEXT).style.display = 'flex'

    let next = ''
    let nextName = ''
    let prev = ''
    let prevName = ''
    
    let book = books[bookId];
    let nextBook = books[bookId + 1];
    if (bookChapterValid(bookId, chapter + 1)) { 
        // just go to the next chapter
        next = `#${book.parentBookId}:${bookId}:${chapter + 1}:next`;
        nextName = `${book.fullName} ${chapter + 1}`
    } else {
        // don't bother with "next" when we're at the last book/chapter
        if (bookId === 406) {
            next = ''
            nextName = ''
        } else {
            // if the next book doesn't exist at incremented id, it's a new volume
            if (nextBook === undefined) {
                nextBook = books[`${book.parentBookId}01`]
            }
            // next book, chap1 (unless there are 0 chapters in next book)   
            let chapNum = 0
            nextBook.numChapters === 0 
                ? chapNum = 0 
                : chapNum = 1                                    
            next = `#${nextBook.parentBookId}:${nextBook.id}:${chapNum}:next`
            nextName = `${titleForBookChapter(nextBook, chapNum)}`
        }

    }

    let prevBook = books[bookId - 1]
    if (bookChapterValid(bookId, chapter - 1)) {
        // just go to the prev chapter
        prev = `#${book.parentBookId}:${bookId}:${chapter - 1}:prev`;
        prevName = `${book.fullName} ${chapter - 1}`
    } else {
        // set prev stuff = blank for first chapter in Genesis
        if (bookId === 101 && chapter === 1) {
            prev = ''
            prevName = ''
        } else {
            // if incremented id isn't a book, look up the last book id in the prev volume
            if (prevBook === undefined) {
            
                // dict lookup of last bookId of prev volume
                prevBook = books[BOOKID_SKIPS_PREV[book.id]]
            }
            // prev book, numChapters (last chapter)                                        
            prev = `#${prevBook.parentBookId}:${prevBook.id}:${prevBook.numChapters}:prev`
            prevName = `${titleForBookChapter(prevBook, prevBook.numChapters)}`
        }

    }

    document.getElementById(DIV_PREVNEXT).innerHTML = 
    htmlLink({
        id: "prev",
        ...(prev && {content: ICON_PREV}),
        href: `${prev}`,
        title: `${prevName}`,
    }) + htmlLink({
        id: "next",
        ...(next && {content: ICON_NEXT}),
        href: `${next}`,
        title: `${nextName}`,
    });
}

const titleForBookChapter = function (book, chapter) {
    if (book !== undefined) {
        if (chapter > 0) {
            return `${book.tocName} ${chapter}`
        }

        return book.tocName;
    }
};

const volumesGridContent = function (volumeId) {
    let gridContent = '';

    volumes.forEach(function (volume) {
        if (volumeId === undefined || volumeId === volume.id) {
            gridContent += htmlDiv({
                classKey: CLASS_VOLUME,
                content: htmlAnchor(volume) + htmlElement(TAG_HEADERS, volume.fullName)
            });

            gridContent += booksGrid(volume);
        }
    });

    return gridContent + BOTTOM_PADDING;
};

export { bookChapterValid, booksGrid, booksGridContent, chaptersGrid, chaptersGridContent, encodedScripturesUrlParameters,
    navigateBook, navigateChapter, navigateHome, onHashChanged, setBreadcrumbs, setPrevNext, titleForBookChapter, volumesGridContent }