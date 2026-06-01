import GhostContentAPI from "@tryghost/content-api";

// Create API instance with site credentials
const api = new GhostContentAPI({
  url: 'https://raheels-publication.ghost.io',
  key: process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY,
  version: "v5.0"
});


export async function getNavigation() {
    return await api.settings.browse()
  }



export async function getPosts() {
    return await api.posts.browse({
        limit: "all", 
        include: "tags"
    }).catch((err) => {
        console.log(err)
    })
}

export async function getTopThreePosts() {
    return await api.posts.browse({
        limit: "3", 
        include: "tags"
    }).catch((err) => {
        console.log(err)
    })
}

export async function getSinglePost(postSlug) {
    return await api.posts.read({
        slug: postSlug
    })
    .catch(err => {
        console.log(err)
    })
}