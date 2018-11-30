const PROXY_URL = "http://joyprx.dynv6.net:65030/post_rating/";

class Comment {

    constructor(id, rating) {
        this.id = id;
        this.rating = rating;
    }
}

class Post {

    constructor(id, rating, comments) {
        this.id = id;
        this.rating = rating;
        this.comments = comments;
    }
}

function toArray(obj) {
    let array = [];
    for (let i = obj.length >>> 0; i--;) {
        array[i] = obj[i];
    }
    return array;
}

let posts = toArray(document.getElementsByClassName("postContainer")).map(e => e.id.replace("postContainer", ""));

$.getJSON(PROXY_URL + "[" + posts + "]", function (data) {
    data.forEach(function (post) {
        let currentFoot = document.getElementById("postContainer" + post.id).getElementsByClassName("ufoot")[0];
        let current = currentFoot.firstElementChild.getElementsByClassName("post_rating")[0].firstElementChild;

        if (current != null) {
            current.innerHTML = current.innerHTML.replace("--", post.rating);

            let toggler = currentFoot.getElementsByClassName("post_comment_list")[0];
            let config = { attributes: false, childList: true, subtree: true };
            let callback = function (mutationsList, observer) {
                if (mutationsList.filter(m => m.type === "childList").length > 0) {
                    observer.disconnect();

                    post.comments.forEach(function (comment) {
                        let currentTxt = document.getElementById("comment_txt_" + post.id + "_" + comment.id);
                        if (currentTxt != null) {
                            let current = currentTxt.getElementsByClassName("comment_rating")[0].firstElementChild;
                            if (current != null && !current.innerHTML.includes(";") && current.innerHTML.includes("vote")) {
                                current.innerHTML = comment.rating + "; " + current.innerHTML
                            }
                        }
                    });

                    observer.observe(toggler, config);
                }
            };

            let observer = new MutationObserver(callback);

            observer.observe(toggler, config);
        }
    });
});