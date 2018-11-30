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

function takeData(post) {
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
}

/*$.getJSON(PROXY_URL + "[" + posts + "]", function (data) {
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
});*/

function fetchPost(postId) {
    fetch("http://joyreactor.cc/post/" + postId, {
        method: 'GET',
        mode: "no-cors",
        credentials: 'omit'
    }).then((response) => {
        if (response.ok) {
            response.text().then((text) => {
                console.log(postId + " - " + text.length)
                if (text != null) {
                    let doc = new DOMParser().parseFromString(text, "text/html");
                    let ufoor_first = doc.getElementsByClassName("ufoot_first")

                    if (ufoor_first != null && ufoor_first.length > 0) {
                        let postRating = ufoor_first[0].getElementsByClassName("post_rating")

                        if (postRating != null && postRating.length > 0) {
                            let postRatingNumber = postRating[0].firstElementChild.firstChild.textContent

                            let commentIdElements = toArray(doc.querySelectorAll('[comment_id]')).map(e => {
                                let commentId = e.attributes['comment_id'].value;
                                let commentRating = e.firstElementChild.innerHTML;
                                return new Comment(commentId, commentRating)
                            });

                            let postObj = new Post(postId, postRatingNumber, commentIdElements)

                            takeData(postObj)
                        }
                    }
                }
            })
        } else if (response.status == 503) {
            fetchPost(postId)
        }
    });
}

posts.forEach(function (postId) {
    fetchPost(postId)
})
