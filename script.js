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

function takeData(post) {
    if (post instanceof Post) {
        let currentFoot = document.getElementById("postContainer" + post.id).getElementsByClassName("ufoot")[0];
        let current = currentFoot.firstElementChild.getElementsByClassName("post_rating")[0].firstElementChild;

        if (current != null) {
            current.innerHTML = current.innerHTML.replace("--", post.rating);

            let toggler = currentFoot.getElementsByClassName("post_comment_list")[0];
            let config = {attributes: false, childList: true, subtree: true};
            let callback = function (mutationsList, observer) {
                if (mutationsList.filter(m => m.type === "childList").length > 0) {
                    observer.disconnect();

                    post.comments.forEach(function (comment) {
                        if (comment instanceof Comment) {
                            let currentTxt = document.getElementById("comment_txt_" + post.id + "_" + comment.id);
                            if (currentTxt != null) {
                                let current = currentTxt.getElementsByClassName("comment_rating")[0].firstElementChild;
                                if (current != null && !current.innerHTML.includes(";") && current.innerHTML.includes("vote")) {
                                    current.innerHTML = comment.rating + "; " + current.innerHTML
                                }
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
}

function fetchPost(postId) {
    console.log("postId: " + postId);
    let request = new Request(window.location.protocol + "//" + window.location.host + "/post/" + postId, {
        method: 'GET',
        mode: "no-cors",
        credentials: 'omit',
        redirect: "follow"
    });

    fetch(request).then((response) => {
        console.log(response);
        if (response.ok) {
            response.text().then((text) => {
                console.log(postId + " - " + text.length);
                if (text != null) {
                    let postDoc = new DOMParser().parseFromString(text, "text/html");
                    let ufootFirst = postDoc.getElementsByClassName("ufoot_first");

                    if (ufootFirst != null && ufootFirst.length > 0) {
                        let postRating = ufootFirst[0].getElementsByClassName("post_rating");

                        if (postRating != null && postRating.length > 0) {
                            let postRatingNumber = postRating[0].firstElementChild.firstChild.textContent;

                            let commentIdElements = [].map.call(postDoc.querySelectorAll('[comment_id]'), e => {
                                let commentId = e.attributes['comment_id'].value;
                                let commentRating = e.firstElementChild.innerHTML;
                                return new Comment(commentId, commentRating)
                            });

                            let postObj = new Post(postId, postRatingNumber, commentIdElements);

                            takeData(postObj)
                        }
                    }
                }
            })
        } else if (response.status === 503) {
            console.warn("Retrying for: " + postId + "...");
            fetchPost(postId);
        } else if (response.type === "opaque") {
            //TODO: Find a workaround. [https://github.com/sssemil/joyreactor_rating_plugin/issues/1]
            console.warn("Opaque response for: " + postId + ".");

            // try to get at least comments ratings
            fetchPostComments(postId)
        }
    });
}

function fetchPostComments(postId) {
    console.log("postId: " + postId);
    let request = new Request(window.location.protocol + "//" + window.location.host + "/post/comments/" + postId, {
        method: 'GET',
        mode: "no-cors",
        credentials: 'omit',
        redirect: "follow"
    });

    fetch(request).then((response) => {
        console.log(response);
        if (response.ok) {
            response.text().then((text) => {
                console.log(postId + " - " + text.length);
                if (text != null) {
                    let postCommentsDoc = new DOMParser().parseFromString(text, "text/html");

                    if (postCommentsDoc != null) {
                        let commentIdElements = [].map.call(postCommentsDoc.querySelectorAll('[comment_id]'), e => {
                            let commentId = e.attributes['comment_id'].value;
                            let commentRating = e.firstElementChild.innerHTML;
                            return new Comment(commentId, commentRating)
                        });

                        let postObj = new Post(postId, "--", commentIdElements);

                        takeData(postObj)
                    }
                }
            })
        } else if (response.status === 503) {
            console.warn("Retrying for: " + postId + "...");
            fetchPost(postId);
        }
    });
}

window.onload = function () {
    [].map.call(document.getElementsByClassName("postContainer"), e => {
        fetchPost(e.id.replace('postContainer', ''));
    });
};