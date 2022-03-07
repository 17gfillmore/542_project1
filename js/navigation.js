import { setupMarkers } from "./mapHelper.js";
import { htmlDiv, htmlAnchor, htmlElement, htmlImg, htmlLink } from "./htmlHelper.js";
import { ajax, books, volumes, encodedScripturesUrlParameters } from "./mapScripApi.js"
import { animateToNewContent, animateToNewNav } from "./animation.js";

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
const ICON_CRUMB2 = htmlImg({
    src: "./dash.svg",
    id: "crumb2",
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

const getScreenSize = function () {
    if (window.matchMedia("(max-width: 600px").matches) {
        return "xsmall";
    } else if (window.matchMedia("(max-width: 800px").matches) {
        return "xsmall";
        // return 'small'; //design change hah
    } else if (window.matchMedia("(max-width: 1299px").matches) {
        return "xsmall";
        // return 'fullSize';
    } else {
        // at 1300px, the nav bar goes to the side again, so 
        // use a shorter button name again
        return 'small';
    }

}

const getScripturesCallback = function (chapterHtml, animationType) {
    // document.getElementById("scriptures").innerHTML = chapterHtml;
    animateToNewContent(chapterHtml, animationType);
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
        animateToNewContent(chaptersGrid(book))
    }
    setupMarkers();
};

const navigateChapter = function(bookId, chapter, animationType) {
    setBreadcrumbs(books[bookId].parentBookId, bookId, chapter)
    setPrevNext(bookId, chapter);

    // TODO? update this to use new api (fetch) instead of ajax
    ajax(encodedScripturesUrlParameters(bookId, chapter), getScripturesCallback, getScripturesFailure, true, animationType);
};

// covers both "home" (list of all volumes and their books) and the single-volume view
const navigateHome = function(volumeId) {
    setBreadcrumbs(volumeId);
    resetElement(DIV_PREVNEXT);
    animateToNewContent(volumesGridContent(volumeId))
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
        crumbs = '<div id="crumby">' + htmlLink({
            content: "Home",
            classKey: "crumbLink",
            href: "#"
        }) + "</div>"
        crumbs += '<div id="crumby">' + ICON_CRUMB + htmlLink({
            content: `${volumes[volumeId - 1].fullName}`, // volumeId - 1 because the id is inside the array items, and I didn't want to search because they are ordered
            ...(bookId) && {classKey: "crumbLink"}, // only make the crumb a clickable link if we've navigated past it (e.g. are looking at a book)
            ...(bookId) && {href: `#${volumeId}`} 
        }) + '</div>'
    } else {
        volumes.forEach(vol => {
            crumbs += '<div id="crumby">' + ICON_CRUMB2 + htmlLink({
                content: `${vol.fullName}`,
                classKey: "crumbLink",
                href: `#${vol.id}`
            }) + '</div>';
        });
    }
    if (bookId) {
        crumbs += '<div id="crumby">' + ICON_CRUMB + htmlLink({
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

    animateToNewNav(crumbs, DIV_BREADCRUMBS)
    // document.getElementById(DIV_BREADCRUMBS).innerHTML = crumbs;
}

const setPrevNext = function (bookId, chapter) {
    // the display is set to "none" to clear the empty space, so just resetting it
    document.getElementById(DIV_PREVNEXT).style.display = 'flex'
    
    let book = books[bookId];

    let nextBook;
    let nextChapter;
    let nextHash;
    if (bookChapterValid(bookId, chapter + 1)) { 
        // same book, next chapter
        [nextBook, nextChapter] = [book, chapter + 1];
        nextHash = `#${book.parentBookId}:${bookId}:${nextChapter}:next`;
    } else {
        // don't bother with "next" when we're at the last book/chapter
        if (bookId === 406) {
            nextBook = null;
            nextHash = '';
        } else {
            // if a book doesn't exist at the next bookid, it's the first book in a new volume. else, just next book
            books[bookId + 1] === undefined
                ? nextBook = books[`${book.parentBookId}01`]
                : nextBook = books[bookId + 1]

            // next chapter of the new book/volume is 1 (unless there are 0 chapters in it)
            nextBook.numChapters === 0
                ? nextChapter = 0
                : nextChapter = 1
            nextHash = `#${nextBook.parentBookId}:${nextBook.id}:${nextChapter}:next`
        }

    }

    let prevBook;
    let prevChapter;
    let prevHash;
    if (bookChapterValid(bookId, chapter - 1)) {
        // same book, previous chapter
        [prevBook, prevChapter] = [book, chapter - 1]
        prevHash = `#${book.parentBookId}:${bookId}:${prevChapter}:prev`;
    } else { // previous book, so need to find chapter
        // don't bother with "prev" when we're at the first book/chapter
        if (bookId === 101 && chapter === 1) {
            prevBook = null;
            prevHash = '';
        } else {
            // if incremented id isn't a book, look up the last book id in the prev volume. Otherwise, just go back a 
            // book in the same volume. 
            books[bookId - 1] === undefined
                ? prevBook = books[BOOKID_SKIPS_PREV[bookId]]   // bookid_skips_prev has the first book in a volume as the key 
                                                                // and the last (of the previous volume) as the value
                : prevBook = books[bookId - 1]

            prevChapter = prevBook.numChapters
            prevHash = `#${prevBook.parentBookId}:${prevBook.id}:${prevChapter}:prev`
        }

    }

    let nextLinkContent = '';
    let prevLinkContent = '';
    // changed my mind about the design... I like it with just the icons smooshed up by the text
    // // set content for links based on screen size (just icon, icon and short name, icon and full name)
    // let screenSize = getScreenSize();
    // if (!nextBook) {
    //     nextLinkContent = '';
    // } else {
    //     if (screenSize === 'xsmall') {
    //         nextLinkContent = ICON_NEXT
    //     } else if (screenSize === 'small') {
    //         nextChapter === 0
    //             ? nextLinkContent = `${nextBook.citeAbbr} ${ICON_NEXT}`
    //             : nextLinkContent = `${nextBook.citeAbbr} ${nextChapter} ${ICON_NEXT}`
    //     } else if (screenSize === 'fullSize') {
    //         nextChapter === 0
    //             ? nextLinkContent = `${nextBook.fullName} ${ICON_NEXT}`
    //             : nextLinkContent = `${nextBook.fullName} ${nextChapter} ${ICON_NEXT}`
    //     }
    //     nextLinkContent = htmlDiv({
    //         id: 'crumby',
    //         content: nextLinkContent
    //     })
    // }
    // if (!prevBook) {
    //     prevLinkContent = '';
    // } else {
    //     if (screenSize === 'xsmall') {
    //         prevLinkContent = ICON_PREV
    //     } else if (screenSize === 'small') {
    //         prevChapter === 0
    //             ? prevLinkContent = `${ICON_PREV} ${nextBook.citeAbbr}`
    //             : prevLinkContent = `${ICON_PREV} ${prevBook.citeAbbr} ${prevChapter}`
    //     } else if (screenSize === 'fullSize') {
    //         prevChapter === 0
    //             ? prevLinkContent = `${ICON_PREV} ${nextBook.fullName}`
    //             : prevLinkContent = `${ICON_PREV} ${prevBook.fullName} ${prevChapter}`
    //     }
    //     prevLinkContent = htmlDiv({
    //         id: 'crumby',
    //         content: prevLinkContent
    //     })
    // }

    !nextBook
        ? nextLinkContent = ''
        : nextLinkContent = htmlDiv({
            id: 'crumby',
            content: ICON_NEXT
        })
    !prevBook
        ? prevLinkContent = ''
        : prevLinkContent = htmlDiv({
            id: 'crumby',
            content: ICON_PREV
        })

    // create and set actual link elements
    let prevnextNavContent = htmlLink({
        classKey: "crumbLink",
        content: prevLinkContent,
        href: prevHash,
        // title: `${prevName}`,
    }) + htmlLink({
        classKey: "crumbLink",
        content: nextLinkContent,
        href: nextHash,
        // title: `${nextName}`,
    });
    document.getElementById(DIV_PREVNEXT).innerHTML = prevnextNavContent;
};

const titleForBookChapter = function (book, chapter) {
    if (book !== undefined) {
        if (chapter > 0) {
            return book.tocName === "Sections"
                ? `Section ${chapter}`
                : `${book.tocName} ${chapter}`
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