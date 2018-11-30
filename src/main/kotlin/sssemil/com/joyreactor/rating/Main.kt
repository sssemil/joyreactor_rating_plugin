package sssemil.com.joyreactor.rating

import com.google.gson.Gson
import io.ktor.application.call
import io.ktor.application.install
import io.ktor.features.CORS
import io.ktor.features.origin
import io.ktor.http.ContentType
import io.ktor.response.respondText
import io.ktor.routing.get
import io.ktor.routing.routing
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import org.jsoup.Jsoup
import org.slf4j.Logger
import org.slf4j.LoggerFactory

val gson = Gson()
val logger: Logger = LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME)

fun main(args: Array<String>) {
    embeddedServer(Netty, 65030) {
        install(CORS) {
            anyHost()
        }

        routing {
            get("/post_rating/{post_ids}") {
                logger.debug("CALL: ${call.request.origin.remoteHost}; ${call.request.origin.uri}")
                call.parameters["post_ids"]?.let { postIdJsonArray ->
                    try {
                        gson.fromJson(postIdJsonArray, IntArray::class.java)

                        val posts = ArrayList<Post>()
                        val jobs = ArrayList<Job>()

                        gson.fromJson(postIdJsonArray, IntArray::class.java).forEach { postId ->
                            jobs.add(launch {
                                postId.let { postIdInt ->
                                    getPost(postIdInt)?.let { post ->
                                        posts.add(post)
                                    }
                                }
                            })
                        }

                        jobs.forEach { job -> job.join() }

                        call.respondText(gson.toJson(posts), ContentType.Application.Json)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }
    }.start(wait = true)
}

fun getPost(postId: Int): Post? {
    val postBody = Jsoup.connect("http://joyreactor.cc/post/$postId").get().body()

    postBody.getElementsByClass("ufoot_first")
        .firstOrNull()?.getElementsByClass("post_rating")?.text()?.toDoubleOrNull()?.let { postRating ->
            val postComments = postBody.getElementsByAttribute("comment_id").mapNotNull { commentElement ->
                commentElement.attr("comment_id").toIntOrNull()?.let { commentId ->
                    commentElement.allElements.first().text().toDoubleOrNull()?.let { commentRating ->
                        Comment(commentId, commentRating)
                    }
                }
            }

            return Post(postId, postRating, postComments)
        }

    return null
}

data class Post(val id: Int, val rating: Double, val comments: List<Comment>)

data class Comment(val id: Int, val rating: Double)
