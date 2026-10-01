const postInput = document.getElementById("postInput");
const publishBtn = document.getElementById("publishBtn");
const feed = document.getElementById("feed");

publishBtn.addEventListener("click", () => {
    const text = postInput.value.trim();

    if (text === "") return;

    const post = document.createElement("div");
    post.classList.add("post");

    post.innerHTML = `
        <h4>You</h4>
        <p>${text}</p>
        <button class="like-btn">❤️ Like</button>
    `;

    feed.prepend(post);

    postInput.value = "";
});
